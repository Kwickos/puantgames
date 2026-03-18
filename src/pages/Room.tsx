import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoomStore, getSavedRoomCode, saveRoomCode } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoom } from '@/hooks/useRoom'
import RoomLobby from '@/components/RoomLobby'
import GameWrapper from '@/components/GameWrapper'

export default function Room() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const room = useRoomStore(s => s.room)
  const connected = useRoomStore(s => s.connected)
  const reset = useRoomStore(s => s.reset)
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)
  const { joinRoom } = useRoom()
  const [joining, setJoining] = useState(false)
  const [ready, setReady] = useState(false)

  // Redirect to Discord login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      if (code) saveRoomCode(code.toUpperCase())
      window.location.href = '/api/auth/discord'
    }
  }, [authLoading, user, code])

  // Auto-join when connected
  useEffect(() => {
    if (!user || !connected || !code) return
    if (room && room.code === code.toUpperCase()) {
      setReady(true)
      return
    }
    if (joining) return

    saveRoomCode(code.toUpperCase())

    setJoining(true)
    joinRoom(code).then(res => {
      setJoining(false)
      if (res.ok) {
        setReady(true)
      } else {
        // Room introuvable — redirect immédiatement
        reset()
        navigate('/', { replace: true })
      }
    })
  }, [user, connected, code, room, joining, joinRoom, navigate, reset])

  // Don't render anything until we're ready — avoids flash
  if (!ready || !room || room.code !== code?.toUpperCase()) {
    return null
  }

  if (room.gameState.status === 'lobby') {
    return <RoomLobby />
  }

  return <GameWrapper />
}
