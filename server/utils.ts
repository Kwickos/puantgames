const AVATARS = ['😎', '🤠', '👻', '🦊', '🐸', '🎃', '🤖', '👾', '🦄', '🐲', '🧙', '🥷']
const COLORS = ['neon-green', 'neon-pink', 'neon-blue', 'neon-yellow', 'neon-purple', 'neon-orange']
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export function randomAvatar(used: string[]): string {
  const available = AVATARS.filter(a => !used.includes(a))
  const pool = available.length > 0 ? available : AVATARS
  return pool[Math.floor(Math.random() * pool.length)]
}

export function randomColor(used: string[]): string {
  const available = COLORS.filter(c => !used.includes(c))
  const pool = available.length > 0 ? available : COLORS
  return pool[Math.floor(Math.random() * pool.length)]
}
