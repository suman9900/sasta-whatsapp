const express = require('express');
const { createRoom, getRoom } = require('../controllers/roomController');

const router = express.Router();

// Rate limiting state (simple in-memory)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ROOM_CREATIONS = 10;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return next();
  }

  if (entry.count >= MAX_ROOM_CREATIONS) {
    return res.status(429).json({ error: 'Too many rooms created. Please try again later.' });
  }

  entry.count++;
  next();
}

// POST /api/rooms — create a new conversation room
router.post('/', rateLimit, createRoom);

// GET /api/rooms/:roomId — get room info
router.get('/:roomId', getRoom);

module.exports = router;
