import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight, Link as LinkIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import '../styles/home.css';

export default function Home() {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreate = () => {
    navigate('/create');
  };

  const handleJoin = () => {
    const val = joinInput.trim();
    if (!val) {
      setJoinError('Please enter a room link or ID.');
      return;
    }
    setJoinError('');

    // Extract room ID from URL or use directly
    let roomId = val;
    try {
      const url = new URL(val);
      const parts = url.pathname.split('/');
      const chatIdx = parts.indexOf('chat');
      if (chatIdx !== -1 && parts[chatIdx + 1]) {
        roomId = parts[chatIdx + 1];
      }
    } catch {
      // Not a URL, use as-is (room ID)
    }

    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="home-page">
      <Navbar />

      <main className="hero">
        <div className="hero-content">
          <div className="hero-icon">
            <MessageSquare size={32} />
          </div>
          <h1 className="hero-heading">Simple. Private. Real-time conversations.</h1>
          <p className="hero-sub">
            Create a conversation room, share the link, and start chatting instantly. No accounts, no setup — just real-time messaging.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={handleCreate}>
              <MessageSquare size={18} />
              Create New Conversation
            </button>

            <div className="hero-divider">or join an existing one</div>

            <div className="join-section">
              <input
                className="input"
                type="text"
                placeholder="Paste room link or ID…"
                value={joinInput}
                onChange={(e) => { setJoinInput(e.target.value); setJoinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <button className="btn btn-secondary" onClick={handleJoin}>
                <ArrowRight size={16} />
                Join
              </button>
            </div>
            {joinError && <p className="error-text">{joinError}</p>}
          </div>
        </div>
      </main>

      <section className="how-section">
        <h2 className="how-section-title">How it works</h2>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-card-step">1</div>
            <div className="how-card-title">Create a room</div>
            <div className="how-card-desc">Click the button above to generate a unique conversation link.</div>
          </div>
          <div className="how-card">
            <div className="how-card-step">2</div>
            <div className="how-card-title">Share the link</div>
            <div className="how-card-desc">Send the link to anyone you want to chat with.</div>
          </div>
          <div className="how-card">
            <div className="how-card-step">3</div>
            <div className="how-card-title">Start chatting</div>
            <div className="how-card-desc">Enter your name and start talking in real time.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
