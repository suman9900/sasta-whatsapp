const crypto = require('crypto');
const Conversation = require('../models/Conversation');

// Generate a URL-safe random room ID
function generateRoomId() {
  return crypto.randomBytes(6).toString('hex'); // 12 chars
}

exports.createRoom = async (req, res, next) => {
  try {
    const { roomName } = req.body;
    let roomId = generateRoomId();

    // Ensure uniqueness
    while (await Conversation.findOne({ roomId })) {
      roomId = generateRoomId();
    }

    const conversation = await Conversation.create({
      roomId,
      roomName: roomName ? String(roomName).trim().slice(0, 50) : '',
    });

    res.status(201).json({
      roomId: conversation.roomId,
      roomName: conversation.roomName,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const conversation = await Conversation.findOne({ roomId, isActive: true });

    if (!conversation) {
      return res.status(404).json({ error: 'Room not found or is no longer active.' });
    }

    res.json({
      roomId: conversation.roomId,
      roomName: conversation.roomName,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    next(error);
  }
};
