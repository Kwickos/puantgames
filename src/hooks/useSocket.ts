import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '@/lib/socket'
import { useRoomStore, getSavedRoomCode } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoom } from '@/hooks/useRoom'
import type { RoomState, GameState } from '@shared/types'

export function useSocketLifecycle() {
  const setConnected = useRoomStore(s => s.setConnected)
  const setRoom = useRoomStore(s => s.setRoom)
  const setSocketId = useRoomStore(s => s.setSocketId)
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const { joinRoom } = useRoom()

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (user && !socket.connected) {
      socket.connect()
    }
    if (!user && socket.connected) {
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    function onConnect() {
      setConnected(true)
      setSocketId(socket.id ?? null)

      // Auto-rejoin saved room on reconnect
      const savedCode = getSavedRoomCode()
      if (savedCode) {
        joinRoom(savedCode)
      }
    }

    function onDisconnect() {
      setConnected(false)
    }

    function onRoomState(state: RoomState) {
      setRoom(state)
    }

    function onGameState(gameState: GameState) {
      const room = useRoomStore.getState().room
      if (room) {
        setRoom({ ...room, gameState })
      }
    }

    function onRoomClosed() {
      setRoom(null)
      navigate('/', { replace: true })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('room:state', onRoomState)
    socket.on('game:state', onGameState)
    socket.on('room:closed', onRoomClosed)

    if (socket.connected) {
      setConnected(true)
      setSocketId(socket.id ?? null)
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room:state', onRoomState)
      socket.off('game:state', onGameState)
      socket.off('room:closed', onRoomClosed)
    }
  }, [setConnected, setRoom, setSocketId, navigate, joinRoom])
}
