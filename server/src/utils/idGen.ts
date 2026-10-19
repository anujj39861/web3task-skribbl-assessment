// generates a room code like "AX7K2P" that players can share
// Exclude ambiguous chars like 0/O and 1/I so people don't mix them up when typing
export function generateRoomId(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// quick and dirty unique id generator
// not cryptographically secure but fine for player ids
// TODO: maybe switch to uuid or nanoid if we ever need something more robust
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
