import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2, ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import { createRoom } from '../services/api';
import '../styles/home.css';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await createRoom();
      setRoomId(data.roomId);
    } catch (err) {
      setError(err.message || 'Failed to create room. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const roomUrl = roomId ? `${window.location.origin}/chat/${roomId}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = roomUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Shocket conversation',
          text: 'Join my real-time conversation on Shocket!',
          url: roomUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleEnter = () => {
    navigate(`/chat/${roomId}`);
  };

  // If room not yet created, show the create action
  if (!roomId) {
    return (
      <div className="create-room-page">
        <Navbar />
        <div className="create-room-body">
          <div className="create-room-card">
            <h2>Create a Conversation</h2>
            <p>Generate a unique room link and invite others to join.</p>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary btn-lg" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create Room'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      <Navbar />
      <div className="create-room-body">
        <div className="create-room-card">
          <h2>Room Created!</h2>
          <p>Share this link with others to start chatting.</p>

          <div className="room-link-box">
            <span className="room-link-url">{roomUrl}</span>
          </div>

          {copied && <div className="copy-toast">Link copied!</div>}

          <div className="room-link-actions">
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
            <button className="btn btn-secondary" onClick={handleShare}>
              <Share2 size={14} />
              Share
            </button>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleEnter} style={{ width: '100%' }}>
            Enter Conversation
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
