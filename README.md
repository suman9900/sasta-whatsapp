# Shocket — Real-Time WebSocket Messaging Platform

A modern, real-time messaging web application. Create a room, share the link, and chat instantly — no accounts required.

## Tech Stack

- **Frontend:** React + Vite, React Router, Socket.IO Client, Lucide React, Vanilla CSS
- **Backend:** Node.js, Express, Socket.IO, Mongoose
- **Database:** MongoDB

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI if needed
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Test It

1. Open the app and click **Create New Conversation**
2. Copy the generated room link
3. Open the link in a second browser tab/window
4. Enter display names in both tabs and start chatting!

## Project Structure

```
backend/
  server.js                    # Express + Socket.IO entry point
  src/
    config/database.js         # MongoDB connection
    models/Conversation.js     # Room schema
    models/Message.js          # Message schema
    routes/roomRoutes.js       # REST API routes
    controllers/roomController.js
    sockets/socketHandlers.js  # All WebSocket event handling
    middleware/errorHandler.js

frontend/
  src/
    components/                # Reusable UI components
    pages/                     # Route pages
    hooks/useSocket.js         # Socket.IO custom hook
    services/                  # API and socket services
    styles/                    # CSS files
    App.jsx                    # Router setup
    main.jsx                   # Entry point
```

## Environment Variables

### Backend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/shocket` | MongoDB connection string |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |

### Frontend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:5000` | Backend API URL |

## Deployment

### Frontend → Vercel
Build command: `npm run build`  
Output directory: `dist`

### Backend → Render
Start command: `npm start`  
Set environment variables in Render dashboard.

### Database → MongoDB Atlas
Update `MONGODB_URI` in backend `.env` with your Atlas connection string.
