const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export async function createRoom(roomName = '') {
  const res = await fetch(`${BACKEND_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create room');
  }
  return res.json();
}

export async function getRoom(roomId) {
  const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Room not found');
  }
  return res.json();
}
