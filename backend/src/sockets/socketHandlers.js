const crypto = require('crypto');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const RoomMember = require('../models/RoomMember');

// In-memory participant tracking
// Map<roomId, Map<socketId, { participantId, displayName }>>
const rooms = new Map();

// Rate limiting for messages (per socket)
const messageRateMap = new Map();
const MSG_RATE_WINDOW = 10000; // 10 seconds
const MAX_MESSAGES_PER_WINDOW = 20;

function checkMessageRate(socketId) {
  const now = Date.now();
  const entry = messageRateMap.get(socketId);
  if (!entry || now - entry.windowStart > MSG_RATE_WINDOW) {
    messageRateMap.set(socketId, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= MAX_MESSAGES_PER_WINDOW) return false;
  entry.count++;
  return true;
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, (ch) => {
    switch (ch) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return ch;
    }
  });
}

function getParticipantList(roomId) {
  const roomParticipants = rooms.get(roomId);
  if (!roomParticipants) return [];
  return Array.from(roomParticipants.values()).map(p => ({
    participantId: p.participantId,
    displayName: p.displayName,
    online: true,
  }));
}

module.exports = function setupSocket(io) {
  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentParticipantId = null;
    let currentDisplayName = null;

    // ── JOIN ROOM ──
    socket.on('join_room', async ({ roomId, displayName, deviceId }, callback) => {
      try {
        // Validate inputs
        if (!roomId || typeof roomId !== 'string') {
          return callback?.({ error: 'Invalid room ID.' });
        }
        if (!deviceId || typeof deviceId !== 'string') {
          return callback?.({ error: 'Device ID is required.' });
        }
        const trimmedName = (displayName || '').trim().slice(0, 30);
        if (!trimmedName) {
          return callback?.({ error: 'Display name is required.' });
        }

        // Verify room exists
        const conversation = await Conversation.findOne({ roomId, isActive: true });
        if (!conversation) {
          return callback?.({ error: 'Room not found or is no longer active.' });
        }

        // Leave any previous room
        if (currentRoom) {
          socket.leave(currentRoom);
          const prevParticipants = rooms.get(currentRoom);
          if (prevParticipants) {
            prevParticipants.delete(socket.id);
            if (prevParticipants.size === 0) rooms.delete(currentRoom);
          }
        }

        // Generate participant ID
        currentParticipantId = crypto.randomBytes(8).toString('hex');
        currentDisplayName = trimmedName;
        currentRoom = roomId;

        // Join the Socket.IO room
        socket.join(roomId);

        // Track participant
        if (!rooms.has(roomId)) rooms.set(roomId, new Map());
        rooms.get(roomId).set(socket.id, {
          participantId: currentParticipantId,
          displayName: currentDisplayName,
          deviceId: deviceId, // Store deviceId in memory too
        });

        // Determine or create membership to restrict history
        let member = await RoomMember.findOne({ roomId, deviceId });
        if (!member) {
          member = await RoomMember.create({ roomId, deviceId });
        }

        // Load recent messages (last 50) that were created AFTER the user joined
        const messages = await Message.find({ 
          roomId, 
          createdAt: { $gte: member.joinedAt } 
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        messages.reverse();

        const participants = getParticipantList(roomId);

        // Notify existing participants
        socket.to(roomId).emit('user_joined', {
          participantId: currentParticipantId,
          displayName: currentDisplayName,
          participantCount: participants.length,
        });

        // Update room activity
        conversation.lastActivity = new Date();
        await conversation.save();

        // Respond to the joining user
        callback?.({
          success: true,
          room: {
            roomId: conversation.roomId,
            roomName: conversation.roomName,
            createdAt: conversation.createdAt,
          },
          participantId: currentParticipantId,
          participants,
          messages: messages.map(m => ({
            messageId: m.messageId,
            roomId: m.roomId,
            senderId: m.senderId,
            senderName: m.senderName,
            content: m.content,
            createdAt: m.createdAt,
            readBy: m.readBy || [],
          })),
        });
      } catch (err) {
        console.error('join_room error:', err);
        callback?.({ error: 'Failed to join room.' });
      }
    });

    // ── SEND MESSAGE ──
    socket.on('send_message', async ({ roomId, content, clientMessageId }, callback) => {
      try {
        // Verify membership
        if (!currentRoom || currentRoom !== roomId) {
          return callback?.({ error: 'You are not in this room.' });
        }
        if (!checkMessageRate(socket.id)) {
          return callback?.({ error: 'Too many messages. Slow down.' });
        }

        // Validate content
        const trimmedContent = (content || '').trim();
        if (!trimmedContent) {
          return callback?.({ error: 'Message cannot be empty.' });
        }
        if (trimmedContent.length > 5000) {
          return callback?.({ error: 'Message is too long (max 5000 characters).' });
        }

        const safeContent = sanitize(trimmedContent);
        const messageId = crypto.randomBytes(12).toString('hex');

        // Persist message
        const message = await Message.create({
          messageId,
          roomId,
          senderId: currentParticipantId,
          senderName: currentDisplayName,
          content: safeContent,
        });

        // Update room activity
        await Conversation.updateOne({ roomId }, { lastActivity: new Date() });

        const messageData = {
          messageId: message.messageId,
          roomId: message.roomId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          createdAt: message.createdAt,
          readBy: [],
          clientMessageId,
        };

        // Broadcast to all in the room including sender
        io.to(roomId).emit('receive_message', messageData);

        callback?.({ success: true, messageId: message.messageId });
      } catch (err) {
        console.error('send_message error:', err);
        callback?.({ error: 'Failed to send message.' });
      }
    });

    // ── LOAD MORE MESSAGES (pagination) ──
    socket.on('load_more_messages', async ({ roomId, beforeId, deviceId }, callback) => {
      try {
        if (!currentRoom || currentRoom !== roomId) {
          return callback?.({ error: 'You are not in this room.' });
        }

        const member = await RoomMember.findOne({ roomId, deviceId });
        if (!member) {
          return callback?.({ messages: [], hasMore: false });
        }

        let query = { 
          roomId,
          createdAt: { $gte: member.joinedAt }
        };
        
        if (beforeId) {
          const refMsg = await Message.findOne({ messageId: beforeId }).lean();
          if (refMsg) {
            query.createdAt = { ...query.createdAt, $lt: refMsg.createdAt };
          }
        }

        const messages = await Message.find(query)
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        messages.reverse();

        callback?.({
          messages: messages.map(m => ({
            messageId: m.messageId,
            roomId: m.roomId,
            senderId: m.senderId,
            senderName: m.senderName,
            content: m.content,
            createdAt: m.createdAt,
          })),
          hasMore: messages.length === 50,
        });
      } catch (err) {
        console.error('load_more_messages error:', err);
        callback?.({ error: 'Failed to load messages.' });
      }
    });

    // ── TYPING ──
    socket.on('typing_start', ({ roomId }) => {
      if (currentRoom && currentRoom === roomId) {
        socket.to(roomId).emit('typing_update', {
          participantId: currentParticipantId,
          displayName: currentDisplayName,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', ({ roomId }) => {
      if (currentRoom && currentRoom === roomId) {
        socket.to(roomId).emit('typing_update', {
          participantId: currentParticipantId,
          displayName: currentDisplayName,
          isTyping: false,
        });
      }
    });

    // ── MARK SEEN ──
    socket.on('mark_seen', async ({ roomId, messageIds }) => {
      try {
        if (!currentRoom || currentRoom !== roomId || !messageIds || !messageIds.length) return;
        
        // Update database
        await Message.updateMany(
          { roomId, messageId: { $in: messageIds }, senderId: { $ne: currentParticipantId } },
          { $addToSet: { readBy: currentParticipantId } }
        );

        // Broadcast to room
        socket.to(roomId).emit('messages_seen', {
          messageIds,
          participantId: currentParticipantId
        });
      } catch (err) {
        console.error('mark_seen error:', err);
      }
    });

    // ── LEAVE ROOM ──
    socket.on('leave_room', ({ roomId }) => {
      handleLeave(socket, roomId);
    });

    // ── DISCONNECT ──
    socket.on('disconnect', () => {
      if (currentRoom) {
        handleLeave(socket, currentRoom);
      }
      messageRateMap.delete(socket.id);
    });

    function handleLeave(sock, roomId) {
      sock.leave(roomId);
      const roomParticipants = rooms.get(roomId);
      if (roomParticipants) {
        roomParticipants.delete(sock.id);
        const participants = getParticipantList(roomId);
        io.to(roomId).emit('user_left', {
          participantId: currentParticipantId,
          displayName: currentDisplayName,
          participantCount: participants.length,
        });
        if (roomParticipants.size === 0) rooms.delete(roomId);
      }
      if (currentRoom === roomId) {
        currentRoom = null;
        currentParticipantId = null;
        currentDisplayName = null;
      }
    }
  });
};
