import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const MAX_LENGTH = 5000;

export default function MessageInput({ onSend, onTypingStart, onTypingStop, disabled }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    // keep picker open or close it? usually keep open
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_LENGTH) return;
    setText(val);

    // Typing indicator
    if (val.trim()) {
      if (!typingRef.current) {
        typingRef.current = true;
        onTypingStart?.();
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        typingRef.current = false;
        onTypingStop?.();
      }, 2000);
    } else {
      if (typingRef.current) {
        typingRef.current = false;
        onTypingStop?.();
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');

    // Stop typing indicator
    if (typingRef.current) {
      typingRef.current = false;
      onTypingStop?.();
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    const ta = textareaRef.current;
    if (ta) ta.style.height = 'auto';
  }, [text, onSend, onTypingStop]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;
  const nearLimit = text.length > MAX_LENGTH - 200;

  return (
    <div className="composer">
      {showEmoji && (
        <div className="emoji-picker-container" ref={emojiRef}>
          <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
        </div>
      )}
      
      <button 
        className="emoji-btn" 
        onClick={() => setShowEmoji(v => !v)}
        disabled={disabled}
        title="Choose an emoji"
      >
        <Smile size={24} />
      </button>

      <div className="composer-input-wrap">
        <textarea
          ref={textareaRef}
          className="composer-input"
          placeholder="Type a message…"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
        {nearLimit && (
          <span className={`composer-char-count ${text.length > MAX_LENGTH - 50 ? 'near-limit' : ''}`}>
            {text.length}/{MAX_LENGTH}
          </span>
        )}
      </div>
      <button
        className="composer-send-btn"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
