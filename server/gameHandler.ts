import type { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  DiscordUser,
  GameState,
} from '../shared/types.js'
import type { RoomManager } from './roomManager.js'
import { recordGameResult } from './db.js'

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export function registerGameHandlers(
  io: IOServer,
  socket: IOSocket,
  rooms: RoomManager
): void {

  socket.on('room:create', (_data, cb) => {
    const user = socket.data.user as DiscordUser
    const prev = rooms.getRoomByPlayer(socket.id)
    if (prev) {
      socket.leave(prev.code)
      rooms.removePlayer(socket.id)
    }

    const state = rooms.createRoom(socket.id, user)
    socket.join(state.code)
    cb({ ok: true, code: state.code, state })
  })

  socket.on('room:join', ({ code }, cb) => {
    const user = socket.data.user as DiscordUser
    // Track player count before join to detect reconnection vs new join
    const stateBefore = rooms.getState(code.toUpperCase())
    const playerCountBefore = stateBefore?.players.length ?? 0

    const result = rooms.joinRoom(code, socket.id, user)

    if (typeof result === 'string') {
      cb({ ok: false, error: result })
      return
    }

    socket.join(result.code)

    // Only emit player:joined for genuinely new players (not reconnections)
    const isReconnection = result.players.length === playerCountBefore
    if (!isReconnection) {
      const newPlayer = result.players.find(p => p.id === socket.id)!
      socket.to(result.code).emit('player:joined', newPlayer)
    }

    cb({ ok: true, code: result.code, state: result })
    io.to(result.code).emit('room:state', result)
  })

  socket.on('room:leave', () => {
    const code = rooms.getRoomCodeByPlayer(socket.id)
    if (!code) return

    socket.leave(code)
    rooms.removePlayer(socket.id)

    socket.to(code).emit('player:left', {
      playerId: socket.id,
      reason: 'left',
    })

    const updatedState = rooms.getState(code)
    if (updatedState) {
      io.to(code).emit('room:state', updatedState)
    }
  })

  socket.on('room:selectGame', ({ gameId }) => {
    const code = rooms.getRoomCodeByPlayer(socket.id)
    if (!code) return
    if (!rooms.isHost(socket.id, code)) return

    rooms.selectGame(code, gameId)
    io.to(code).emit('room:state', rooms.getState(code)!)
  })

  socket.on('room:settings', ({ settings }) => {
    const code = rooms.getRoomCodeByPlayer(socket.id)
    if (!code) return
    if (!rooms.isHost(socket.id, code)) return

    rooms.updateSettings(code, settings)
    io.to(code).emit('room:state', rooms.getState(code)!)
  })

  socket.on('room:kick', ({ playerId }) => {
    const code = rooms.getRoomCodeByPlayer(socket.id)
    if (!code) return
    if (!rooms.isHost(socket.id, code)) return
    if (playerId === socket.id) return

    rooms.removePlayer(playerId)
    io.to(playerId).emit('room:closed')

    const updatedState = rooms.getState(code)
    if (updatedState) {
      io.to(code).emit('room:state', updatedState)
    }
  })

  socket.on('game:start', () => {
    const code = rooms.getRoomCodeByPlayer(socket.id)
    if (!code) return
    if (!rooms.isHost(socket.id, code)) return

    const result = rooms.startGame(code)
    if (typeof result === 'string') {
      socket.emit('room:error', { message: result })
      return
    }

    io.to(code).emit('game:started')
    io.to(code).emit('game:state', result)
    io.to(code).emit('room:state', rooms.getState(code)!)
  })

  socket.on('game:restart', () => {
    const code = rooms.getRoomCodeByPlayer(socket.id)
    if (!code) return
    if (!rooms.isHost(socket.id, code)) return

    rooms.resetGame(code)
    const result = rooms.startGame(code)
    if (typeof result === 'string') {
      socket.emit('room:error', { message: result })
      return
    }

    io.to(code).emit('game:state', result)
    io.to(code).emit('room:state', rooms.getState(code)!)
  })

  socket.on('game:backToLobby', () => {
    const code = rooms.getRoomCodeByPlayer(socket.id)
    if (!code) return
    if (!rooms.isHost(socket.id, code)) return

    rooms.resetGame(code)
    io.to(code).emit('game:state', rooms.getState(code)!.gameState)
    io.to(code).emit('room:state', rooms.getState(code)!)
  })

  socket.on('game:action', ({ type, payload }) => {
    const room = rooms.getRoomByPlayer(socket.id)
    if (!room) return
    if (room.gameState.status !== 'playing') return

    const code = room.code

    switch (type) {
      case 'updateScore': {
        const { playerId, delta } = payload as { playerId: string; delta: number }
        if (playerId !== socket.id) return

        const newState = rooms.updateGameState(code, (gs) => ({
          ...gs,
          scores: {
            ...gs.scores,
            [playerId]: (gs.scores[playerId] ?? 0) + delta,
          },
        }))
        if (newState) io.to(code).emit('game:state', newState)
        break
      }

      case 'updateGameData': {
        const { data } = payload as { data: Record<string, unknown> }
        const newState = rooms.updateGameState(code, (gs) => ({
          ...gs,
          data: { ...gs.data, ...data },
        }))
        if (newState) io.to(code).emit('game:state', newState)
        break
      }

      case 'setStatus': {
        const { status } = payload as { status: GameState['status'] }
        const newState = rooms.updateGameState(code, (gs) => ({
          ...gs,
          status,
        }))
        if (newState) {
          io.to(code).emit('game:state', newState)
          if (status === 'finished') {
            io.to(code).emit('game:finished', { finalScores: newState.scores })
            if (room.gameId) {
              recordGameResult(room.players, newState.scores, room.gameId, newState.data as Record<string, unknown>)
            }
          }
        }
        break
      }

      case 'nextRound': {
        const newState = rooms.updateGameState(code, (gs) => ({
          ...gs,
          round: gs.round + 1,
        }))
        if (newState) io.to(code).emit('game:state', newState)
        break
      }

      case 'endGame': {
        const newState = rooms.updateGameState(code, (gs) => ({
          ...gs,
          status: 'finished' as const,
        }))
        if (newState) {
          io.to(code).emit('game:state', newState)
          io.to(code).emit('game:finished', { finalScores: newState.scores })
          io.to(code).emit('room:state', rooms.getState(code)!)
          if (room.gameId) {
            recordGameResult(room.players, newState.scores, room.gameId, newState.data as Record<string, unknown>)
          }
        }
        break
      }
    }
  })
}
