import { create } from 'zustand'
import type { RoomState, Player, GameState } from '@shared/types'

const ROOM_KEY = 'puantgames-room'

export function getSavedRoomCode(): string | null {
  try {
    return sessionStorage.getItem(ROOM_KEY)
  } catch {
    return null
  }
}

export function saveRoomCode(code: string) {
  sessionStorage.setItem(ROOM_KEY, code)
}

export function clearRoomCode() {
  sessionStorage.removeItem(ROOM_KEY)
}

interface RoomStore {
  connected: boolean
  setConnected: (v: boolean) => void

  socketId: string | null
  setSocketId: (id: string | null) => void

  room: RoomState | null
  setRoom: (room: RoomState | null) => void

  myPlayer: () => Player | null
  isHost: () => boolean
  gameState: () => GameState | null

  reset: () => void
}

export const useRoomStore = create<RoomStore>()((set, get) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  socketId: null,
  setSocketId: (id) => set({ socketId: id }),

  room: null,
  setRoom: (room) => {
    if (room) {
      saveRoomCode(room.code)
    } else {
      clearRoomCode()
    }
    set({ room })
  },

  myPlayer: () => {
    const { room, socketId } = get()
    if (!room || !socketId) return null
    return room.players.find(p => p.id === socketId) ?? null
  },

  isHost: () => {
    const { room, socketId } = get()
    if (!room || !socketId) return false
    return room.hostId === socketId
  },

  gameState: () => {
    const { room } = get()
    return room?.gameState ?? null
  },

  reset: () => {
    clearRoomCode()
    set({ room: null })
  },
}))
