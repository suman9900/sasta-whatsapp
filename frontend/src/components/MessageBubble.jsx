import { Check, CheckCheck } from 'lucide-react';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isOwn, showSender, isFailed, onRetry }) {
  if (message.type === 'system') {
    return <div className="system-message">{message.content}</div>;
  }

  const isSeen = message.readBy && message.readBy.length > 0;

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'} ${showSender ? 'group-start' : ''} ${isFailed ? 'message-failed' : ''}`}>
      <div className="message-bubble">
        {showSender && !isOwn && (
          <div className="message-sender">{message.senderName}</div>
        )}
        <div className="message-content">{message.content}</div>
        <div className="message-meta">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {isOwn && !isFailed && (
            <span className="message-status">
              {isSeen ? (
                <CheckCheck size={14} color="#34B7F1" strokeWidth={2.5} />
              ) : (
                <Check size={12} />
              )}
            </span>
          )}
        </div>
        {isFailed && (
          <button className="message-retry-btn" onClick={onRetry}>
            Failed · Tap to retry
          </button>
        )}
      </div>
    </div>
  );
}
