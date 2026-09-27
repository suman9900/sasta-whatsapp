export default function ParticipantList({ participants, currentParticipantId }) {
  if (!participants || participants.length === 0) return null;

  return (
    <div className="participants-panel">
      <div className="participants-panel-title">Participants ({participants.length})</div>
      <div className="participants-list">
        {participants.map(p => (
          <div
            key={p.participantId}
            className={`participant-chip ${p.participantId === currentParticipantId ? 'you' : ''}`}
          >
            <span className="online-dot" />
            {p.displayName}{p.participantId === currentParticipantId ? ' (You)' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
