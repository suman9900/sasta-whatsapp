const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to quickly find a member's record in a room
roomMemberSchema.index({ roomId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);
