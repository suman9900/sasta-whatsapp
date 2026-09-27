import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

export function useSocket(roomId, displayName) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // connected | reconnecting | disconnected
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [participantId, setParticipantId] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [joinError, setJoinError] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const seenMessageIds = useRef(new Set());
  const typingTimers = useRef(new Map());

  // Add message with deduplication
  const addMessage = useCallback((msg) => {
    if (seenMessageIds.current.has(msg.messageId)) return;
    seenMessageIds.current.add(msg.messageId);
    setMessages(prev => [...prev, msg]);
  }, []);

  // Join room
  useEffect(() => {
    if (!roomId || !displayName) return;

    let deviceId = sessionStorage.getItem('shocket_device_id');
    if (!deviceId) {
      deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('shocket_device_id', deviceId);
    }

    const socket = connectSocket();

    function onConnect() {
      setConnectionStatus('connected');
      // Join/rejoin room on connect
      socket.emit('join_room', { roomId, displayName, deviceId }, (response) => {
        if (response.error) {
          setJoinError(response.error);
          return;
        }
        setJoinError(null);
        setIsJoined(true);
        setParticipantId(response.participantId);
        setRoomInfo(response.room);
        setParticipants(response.participants);

        // Load initial messages
        seenMessageIds.current.clear();
        const msgs = response.messages || [];
        msgs.forEach(m => seenMessageIds.current.add(m.messageId));
        setMessages(msgs);
        setHasMoreMessages(msgs.length === 50);
      });
    }

    function onDisconnect() {
      setConnectionStatus('disconnected');
    }

    function onReconnectAttempt() {
      setConnectionStatus('reconnecting');
    }

    function onReceiveMessage(msg) {
      addMessage(msg);
    }

    function onUserJoined({ participantId: pid, displayName: name, participantCount }) {
      setParticipants(prev => {
        // Add if not already present
        if (prev.some(p => p.participantId === pid)) return prev;
        return [...prev, { participantId: pid, displayName: name, online: true }];
      });
      // Add system message
      addMessage({
        messageId: `sys-join-${pid}-${Date.now()}`,
        type: 'system',
        content: `${name} joined the conversation`,
        createdAt: new Date().toISOString(),
      });
    }

    function onUserLeft({ participantId: pid, displayName: name, participantCount }) {
      setParticipants(prev => prev.filter(p => p.participantId !== pid));
      // Remove from typing
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(pid);
        return next;
      });
      addMessage({
        messageId: `sys-leave-${pid}-${Date.now()}`,
        type: 'system',
        content: `${name} left the conversation`,
        createdAt: new Date().toISOString(),
      });
    }

    function onTypingUpdate({ participantId: pid, displayName: name, isTyping }) {
      setTypingUsers(prev => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(pid, name);
          // Auto-clear after 4s
          if (typingTimers.current.has(pid)) clearTimeout(typingTimers.current.get(pid));
          typingTimers.current.set(pid, setTimeout(() => {
            setTypingUsers(p => {
              const n = new Map(p);
              n.delete(pid);
              return n;
            });
            typingTimers.current.delete(pid);
          }, 4000));
        } else {
          next.delete(pid);
          if (typingTimers.current.has(pid)) {
            clearTimeout(typingTimers.current.get(pid));
            typingTimers.current.delete(pid);
          }
        }
        return next;
      });
    }

    function onMessagesSeen({ messageIds, participantId: pid }) {
      setMessages(prev => prev.map(m => {
        if (messageIds.includes(m.messageId)) {
          return { ...m, readBy: [...new Set([...(m.readBy || []), pid])] };
        }
        return m;
      }));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('receive_message', onReceiveMessage);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_update', onTypingUpdate);
    socket.on('messages_seen', onMessagesSeen);

    // If already connected, fire join immediately
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('receive_message', onReceiveMessage);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_update', onTypingUpdate);
      socket.off('messages_seen', onMessagesSeen);

      socket.emit('leave_room', { roomId });
      disconnectSocket();
      setIsJoined(false);

      // Clear typing timers
      typingTimers.current.forEach(t => clearTimeout(t));
      typingTimers.current.clear();
    };
  }, [roomId, displayName, addMessage]);

  // Emit mark_seen for new unseen messages
  useEffect(() => {
    if (!isJoined || !participantId || messages.length === 0) return;
    const socket = getSocket();
    
    const unseenIds = messages
      .filter(m => m.senderId !== participantId && !m.type && !(m.readBy || []).includes(participantId))
      .map(m => m.messageId);

    if (unseenIds.length > 0) {
      socket.emit('mark_seen', { roomId, messageIds: unseenIds });
      
      // Optimistically update local state
      setMessages(prev => prev.map(m => {
        if (unseenIds.includes(m.messageId)) {
          return { ...m, readBy: [...new Set([...(m.readBy || []), participantId])] };
        }
        return m;
      }));
    }
  }, [messages, isJoined, participantId, roomId]);

  // Send message
  const sendMessage = useCallback((content) => {
    const socket = getSocket();
    const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return new Promise((resolve, reject) => {
      socket.emit('send_message', { roomId, content, clientMessageId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [roomId]);

  // Typing events
  const sendTypingStart = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) socket.emit('typing_start', { roomId });
  }, [roomId]);

  const sendTypingStop = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) socket.emit('typing_stop', { roomId });
  }, [roomId]);

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    const socket = getSocket();
    if (messages.length === 0) return;

    const oldestMsg = messages.find(m => !m.type); // skip system messages
    if (!oldestMsg) return;

    const deviceId = sessionStorage.getItem('shocket_device_id');

    socket.emit('load_more_messages', { roomId, beforeId: oldestMsg.messageId, deviceId }, (response) => {
      if (response.error) return;
      const older = (response.messages || []).filter(m => !seenMessageIds.current.has(m.messageId));
      older.forEach(m => seenMessageIds.current.add(m.messageId));
      setMessages(prev => [...older, ...prev]);
      setHasMoreMessages(response.hasMore);
    });
  }, [roomId, messages]);

  return {
    connectionStatus,
    messages,
    participants,
    participantId,
    roomInfo,
    typingUsers,
    joinError,
    hasMoreMessages,
    isJoined,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    loadMoreMessages,
  };
}
