const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  roomName: {
    type: String,
    default: '',
  },
  createdBy: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    maxParticipants: { type: Number, default: 50 },
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for cleanup of inactive rooms
conversationSchema.index({ lastActivity: 1 });
conversationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
