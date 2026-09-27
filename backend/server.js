require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./src/config/database');
const roomRoutes = require('./src/routes/roomRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const setupSocket = require('./src/sockets/socketHandlers');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Routes
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/rooms', roomRoutes);

// Error handler
app.use(errorHandler);

// Setup sockets
setupSocket(io);

// Connect to DB and start
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
