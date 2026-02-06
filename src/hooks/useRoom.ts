import { useCallback } from 'react'
import { socket } from '@/lib/socket'
import { useRoomStore } from '@/stores/roomStore'
import type { RoomResponse, GameStatus } from '@shared/types'

export function useRoom() {
  const setRoom = useRoomStore(s => s.setRoom)
  const reset = useRoomStore(s => s.reset)

  const createRoom = useCallback((): Promise<RoomResponse> => {
    return new Promise((resolve) => {
      socket.emit('room:create', {} as Record<string, never>, (res) => {
        if (res.ok && res.state) {
          setRoom(res.state)
        }
        resolve(res)
      })
    })
  }, [setRoom])

  const joinRoom = useCallback((code: string): Promise<RoomResponse> => {
    return new Promise((resolve) => {
      socket.emit('room:join', { code }, (res) => {
        if (res.ok && res.state) {
          setRoom(res.state)
        }
        resolve(res)
      })
    })
  }, [setRoom])

  const leaveRoom = useCallback(() => {
    socket.emit('room:leave')
    reset()
  }, [reset])

  const selectGame = useCallback((gameId: string) => {
    socket.emit('room:selectGame', { gameId })
  }, [])

  const updateSettings = useCallback((settings: Record<string, number>) => {
    socket.emit('room:settings', { settings })
  }, [])

  const startGame = useCallback(() => {
    socket.emit('game:start')
  }, [])

  const restartGame = useCallback(() => {
    socket.emit('game:restart')
  }, [])

  const backToLobby = useCallback(() => {
    socket.emit('game:backToLobby')
  }, [])

  const kickPlayer = useCallback((playerId: string) => {
    socket.emit('room:kick', { playerId })
  }, [])

  const updateScore = useCallback((playerId: string, delta: number) => {
    socket.emit('game:action', {
      type: 'updateScore',
      payload: { playerId, delta },
    })
  }, [])

  const updateGameData = useCallback((data: Record<string, unknown>) => {
    socket.emit('game:action', {
      type: 'updateGameData',
      payload: { data },
    })
  }, [])

  const setStatus = useCallback((status: GameStatus) => {
    socket.emit('game:action', {
      type: 'setStatus',
      payload: { status },
    })
  }, [])

  const nextRound = useCallback(() => {
    socket.emit('game:action', {
      type: 'nextRound',
      payload: {},
    })
  }, [])

  const endGame = useCallback(() => {
    socket.emit('game:action', {
      type: 'endGame',
      payload: {},
    })
  }, [])

  return {
    createRoom, joinRoom, leaveRoom,
    selectGame, updateSettings, startGame, restartGame, backToLobby, kickPlayer,
    updateScore, updateGameData, setStatus, nextRound, endGame,
  }
}
