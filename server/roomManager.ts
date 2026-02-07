import type { Player, RoomState, GameState, DiscordUser } from '../shared/types.js'
import { generateRoomCode, randomColor } from './utils.js'
import { discordAvatarUrl } from './auth.js'

interface InternalRoom {
  state: RoomState
}

const INITIAL_GAME_STATE: GameState = {
  status: 'lobby',
  scores: {},
  round: 1,
  data: {},
}

export class RoomManager {
  private rooms = new Map<string, InternalRoom>()
  private playerToRoom = new Map<string, string>()

  createRoom(hostSocketId: string, user: DiscordUser): RoomState {
    let code: string
    do {
      code = generateRoomCode()
    } while (this.rooms.has(code))

    const host: Player = {
      id: hostSocketId,
      discordId: user.discordId,
      name: user.globalName ?? user.username,
      avatar: discordAvatarUrl(user),
      color: randomColor([]),
      connected: true,
    }

    const state: RoomState = {
      code,
      hostId: hostSocketId,
      gameId: null,
      settings: {},
      players: [host],
      gameState: { ...INITIAL_GAME_STATE },
    }

    this.rooms.set(code, { state })
    this.playerToRoom.set(hostSocketId, code)
    return state
  }

  joinRoom(code: string, socketId: string, user: DiscordUser): RoomState | string {
    const upperCode = code.toUpperCase()
    const room = this.rooms.get(upperCode)
    if (!room) return 'Room introuvable'

    const { state } = room

    // Check if this is a reconnecting player (same Discord ID, any connection status)
    // Handles both: normal reconnect (disconnected) and fast refresh (still connected)
    const existing = state.players.find(p => p.discordId === user.discordId)
    if (existing) {
      // Clean up old socket mapping
      this.playerToRoom.delete(existing.id)

      const oldId = existing.id
      existing.id = socketId
      existing.connected = true
      // Update name/avatar in case they changed on Discord
      existing.name = user.globalName ?? user.username
      existing.avatar = discordAvatarUrl(user)
      this.playerToRoom.set(socketId, upperCode)

      // Update scores mapping if game is active
      if (state.gameState.scores[oldId] !== undefined) {
        state.gameState.scores[socketId] = state.gameState.scores[oldId]
        delete state.gameState.scores[oldId]
      }

      // Update hostId if this player was host
      if (state.hostId === oldId) {
        state.hostId = socketId
      }

      return state
    }

    // New player joining - only allowed in lobby
    if (state.gameState.status !== 'lobby') return 'Partie deja en cours'
    if (state.players.length >= 8) return 'Room pleine'

    const usedColors = state.players.map(p => p.color)

    const player: Player = {
      id: socketId,
      discordId: user.discordId,
      name: user.globalName ?? user.username,
      avatar: discordAvatarUrl(user),
      color: randomColor(usedColors),
      connected: true,
    }

    state.players.push(player)
    this.playerToRoom.set(socketId, upperCode)
    return state
  }

  removePlayer(socketId: string): string | null {
    const code = this.playerToRoom.get(socketId)
    if (!code) return null

    const room = this.rooms.get(code)
    if (!room) return null

    room.state.players = room.state.players.filter(p => p.id !== socketId)
    this.playerToRoom.delete(socketId)

    if (room.state.players.length === 0) {
      this.rooms.delete(code)
      return code
    }

    if (room.state.hostId === socketId) {
      const newHost = room.state.players.find(p => p.connected)
      if (newHost) {
        room.state.hostId = newHost.id
      }
    }

    return code
  }

  markDisconnected(socketId: string): void {
    const code = this.playerToRoom.get(socketId)
    if (!code) return
    const room = this.rooms.get(code)
    if (!room) return

    const player = room.state.players.find(p => p.id === socketId)
    if (player) player.connected = false
  }

  selectGame(code: string, gameId: string): void {
    const room = this.rooms.get(code)
    if (!room) return
    room.state.gameId = gameId
    room.state.settings = {}
  }

  updateSettings(code: string, settings: Record<string, number>): void {
    const room = this.rooms.get(code)
    if (!room) return
    room.state.settings = { ...room.state.settings, ...settings }
  }

  startGame(code: string): GameState | string {
    const room = this.rooms.get(code)
    if (!room) return 'Room introuvable'
    if (!room.state.gameId) return 'Aucun jeu selectionne'

    const connectedPlayers = room.state.players.filter(p => p.connected)
    if (connectedPlayers.length < 2) return 'Il faut au moins 2 joueurs connectes'

    const scores: Record<string, number> = {}
    connectedPlayers.forEach(p => { scores[p.id] = 0 })

    room.state.gameState = {
      status: 'playing',
      scores,
      round: 1,
      data: { ...room.state.settings },
    }

    return room.state.gameState
  }

  updateGameState(code: string, updater: (gs: GameState) => GameState): GameState | null {
    const room = this.rooms.get(code)
    if (!room) return null
    room.state.gameState = updater(room.state.gameState)
    return room.state.gameState
  }

  resetGame(code: string): void {
    const room = this.rooms.get(code)
    if (!room) return
    room.state.gameState = { ...INITIAL_GAME_STATE }
  }

  getState(code: string): RoomState | null {
    return this.rooms.get(code)?.state ?? null
  }

  getRoomByPlayer(socketId: string): RoomState | null {
    const code = this.playerToRoom.get(socketId)
    if (!code) return null
    return this.getState(code)
  }

  getRoomCodeByPlayer(socketId: string): string | null {
    return this.playerToRoom.get(socketId) ?? null
  }

  isHost(socketId: string, code: string): boolean {
    const room = this.rooms.get(code)
    return room?.state.hostId === socketId
  }

  getRoomCount(): number {
    return this.rooms.size
  }

  getAllRooms(): { code: string; players: { name: string; connected: boolean }[]; gameId: string | null; status: string }[] {
    const result: { code: string; players: { name: string; connected: boolean }[]; gameId: string | null; status: string }[] = []
    for (const [code, room] of this.rooms) {
      result.push({
        code,
        players: room.state.players.map(p => ({ name: p.name, connected: p.connected })),
        gameId: room.state.gameId,
        status: room.state.gameState.status,
      })
    }
    return result
  }

  cleanupIfAllDisconnected(code: string): boolean {
    const room = this.rooms.get(code)
    if (!room) return false

    const allDisconnected = room.state.players.every(p => !p.connected)
    if (!allDisconnected) return false

    // Clean up player mappings
    for (const player of room.state.players) {
      this.playerToRoom.delete(player.id)
    }
    this.rooms.delete(code)
    return true
  }
}
