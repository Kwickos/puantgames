export interface DiscordUser {
  discordId: string
  username: string
  avatar: string | null
  globalName: string | null
}

export interface Player {
  id: string
  discordId: string
  name: string
  avatar: string
  color: string
  connected: boolean
}

export type GameStatus = 'lobby' | 'playing' | 'paused' | 'finished'

export interface GameState {
  status: GameStatus
  scores: Record<string, number>
  round: number
  data: Record<string, unknown>
}

export interface GameConfig {
  minPlayers: number
  maxPlayers: number
  defaultRounds?: number
}

export interface RoomState {
  code: string
  hostId: string
  gameId: string | null
  settings: Record<string, number>
  players: Player[]
  gameState: GameState
}

export interface ClientToServerEvents {
  'room:create': (data: Record<string, never>, cb: (res: RoomResponse) => void) => void
  'room:join': (data: { code: string }, cb: (res: RoomResponse) => void) => void
  'room:leave': () => void
  'room:selectGame': (data: { gameId: string }) => void
  'room:settings': (data: { settings: Record<string, number> }) => void
  'room:kick': (data: { playerId: string }) => void
  'game:start': () => void
  'game:restart': () => void
  'game:backToLobby': () => void
  'game:action': (data: { type: string; payload: Record<string, unknown> }) => void
}

export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void
  'room:error': (data: { message: string }) => void
  'room:closed': () => void
  'player:joined': (player: Player) => void
  'player:left': (data: { playerId: string; reason: string }) => void
  'game:state': (gameState: GameState) => void
  'game:started': () => void
  'game:finished': (data: { finalScores: Record<string, number> }) => void
}

export interface RoomResponse {
  ok: boolean
  code?: string
  error?: string
  state?: RoomState
}
