export default function ConnectionStatus({ status }) {
  if (status === 'connected') return null;

  const labels = {
    reconnecting: 'Reconnecting…',
    disconnected: 'Disconnected — check your connection',
  };

  return (
    <div className={`connection-bar ${status}`}>
      <span className="connection-dot" />
      {labels[status] || status}
    </div>
  );
}
