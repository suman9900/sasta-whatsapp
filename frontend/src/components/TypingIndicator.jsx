export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.size === 0) {
    return <div className="typing-indicator" />;
  }

  const names = Array.from(typingUsers.values());
  let text;
  if (names.length === 1) {
    text = `${names[0]} is typing…`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing…`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing…`;
  }

  return <div className="typing-indicator">{text}</div>;
}
