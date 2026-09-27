import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Copy, Check, LogOut } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import ConnectionStatus from '../components/ConnectionStatus';
import ParticipantList from '../components/ParticipantList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import '../styles/chat.css';

export default function ChatRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const displayName = location.state?.displayName;

  if (!displayName) {
    return <JoinRedirect roomId={roomId} />;
  }

  return <InnerChatRoom roomId={roomId} displayName={displayName} />;
}

function InnerChatRoom({ roomId, displayName }) {
  const navigate = useNavigate();
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendError, setSendError] = useState('');

  const {
    connectionStatus,
    messages,
    participants,
    participantId,
    roomInfo,
    typingUsers,
    joinError,
    hasMoreMessages,
    isJoined,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    loadMoreMessages,
  } = useSocket(roomId, displayName);

  const roomUrl = `${window.location.origin}/chat/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
    } catch {
      const input = document.createElement('input');
      input.value = roomUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async (content) => {
    setSendError('');
    try {
      await sendMessage(content);
    } catch (err) {
      setSendError(err.message);
    }
  };

  const handleLeave = () => {
    navigate('/');
  };

  if (joinError) {
    return (
      <div className="chat-error-page">
        <div>
          <h2>Cannot Join Room</h2>
          <p>{joinError}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="chat-error-page">
        <div>
          <p>Connecting to room…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <ConnectionStatus status={connectionStatus} />

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-icon">
          <MessageSquare size={18} />
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">
            {roomInfo?.roomName || 'Conversation'}
          </div>
          <div className="chat-header-meta">
            {roomId.slice(0, 8)}… · {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-header-btn" onClick={() => setShowParticipants(p => !p)} title="Participants">
            <Users size={18} />
          </button>
          <button className="chat-header-btn" onClick={handleCopy} title="Copy invite link">
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button className="chat-header-btn" onClick={handleLeave} title="Leave conversation">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Participants panel */}
      {showParticipants && (
        <ParticipantList participants={participants} currentParticipantId={participantId} />
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        participantId={participantId}
        hasMore={hasMoreMessages}
        onLoadMore={loadMoreMessages}
      />

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Send error */}
      {sendError && (
        <div style={{ padding: '4px 16px', fontSize: 12, color: 'var(--error)' }}>
          {sendError}
        </div>
      )}

      {/* Composer */}
      <MessageInput
        onSend={handleSend}
        onTypingStart={sendTypingStart}
        onTypingStop={sendTypingStop}
        disabled={connectionStatus !== 'connected'}
      />
    </div>
  );
}

// Small helper component for redirect
function JoinRedirect({ roomId }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your name.'); return; }
    if (trimmed.length > 30) { setError('Name must be 30 characters or less.'); return; }
    navigate(`/chat/${roomId}`, { state: { displayName: trimmed }, replace: true });
  };

  return (
    <div className="chat-error-page">
      <div style={{ maxWidth: 360, width: '100%' }}>
        <h2 style={{ marginBottom: 4 }}>Join Conversation</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>Room: {roomId}</p>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
          Enter your name
        </label>
        <input
          className="input"
          type="text"
          placeholder="Your display name"
          value={name}
          maxLength={30}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          autoFocus
          style={{ marginBottom: 4 }}
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" onClick={handleJoin} style={{ width: '100%', marginTop: 16 }}>
          Join Conversation
        </button>
      </div>
    </div>
  );
}
