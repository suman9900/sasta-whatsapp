import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getRoom } from '../services/api';
import '../styles/home.css';

export default function JoinRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [loading, setLoading] = useState(true);

  // Verify room exists
  useEffect(() => {
    getRoom(roomId)
      .then(() => setLoading(false))
      .catch((err) => {
        setRoomError(err.message || 'Room not found.');
        setLoading(false);
      });
  }, [roomId]);

  const handleJoin = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }
    if (trimmed.length > 30) {
      setError('Name must be 30 characters or less.');
      return;
    }
    setError('');
    // Navigate to chat with display name stored in state
    navigate(`/chat/${roomId}`, { state: { displayName: trimmed }, replace: true });
  };

  if (loading) {
    return (
      <div className="join-page">
        <Navbar />
        <div className="join-body">
          <div className="join-card" style={{ textAlign: 'center' }}>
            <p>Checking room…</p>
          </div>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="join-page">
        <Navbar />
        <div className="join-body">
          <div className="join-card" style={{ textAlign: 'center' }}>
            <h2>Room Not Found</h2>
            <p className="room-id-label" style={{ marginBottom: 16 }}>{roomError}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <Navbar />
      <div className="join-body">
        <div className="join-card">
          <h2>Join Conversation</h2>
          <p className="room-id-label">Room: {roomId}</p>

          <label htmlFor="display-name">Enter your name</label>
          <input
            id="display-name"
            className="input"
            type="text"
            placeholder="Your display name"
            value={name}
            maxLength={30}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" onClick={handleJoin}>
            <LogIn size={16} />
            Join Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
