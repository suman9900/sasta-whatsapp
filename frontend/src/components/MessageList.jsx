import { useRef, useEffect, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, participantId, hasMore, onLoadMore }) {
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewBanner, setShowNewBanner] = useState(false);
  const prevLengthRef = useRef(messages.length);

  // Check scroll position
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 100;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(nearBottom);
    if (nearBottom) setShowNewBanner(false);
  }, []);

  // Auto-scroll to bottom on new messages if near bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (messages.length > prevLengthRef.current) {
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      } else {
        // New message came while scrolled up
        setShowNewBanner(true);
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages, isNearBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [participantId]);

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setShowNewBanner(false);
  };

  return (
    <div className="messages-area" ref={containerRef} onScroll={handleScroll}>
      {hasMore && (
        <div className="load-more-bar">
          <button className="load-more-btn" onClick={onLoadMore}>Load older messages</button>
        </div>
      )}
      {messages.map((msg, idx) => {
        const isOwn = msg.senderId === participantId;
        // Show sender name on first msg or when sender changes (only for non-system)
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const showSender = !msg.type && (!prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === 'system');

        return (
          <MessageBubble
            key={msg.messageId}
            message={msg}
            isOwn={isOwn}
            showSender={showSender}
          />
        );
      })}
      {showNewBanner && (
        <button className="new-messages-banner" onClick={scrollToBottom}>
          ↓ New messages
        </button>
      )}
    </div>
  );
}
