const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  readBy: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
  collection: 'shocket_messages'
});

// Compound index for fetching messages by room in chronological order
messageSchema.index({ roomId: 1, createdAt: 1 });
// For pagination (cursor-based)
messageSchema.index({ roomId: 1, _id: -1 });

module.exports = mongoose.model('Message', messageSchema);
