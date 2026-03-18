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
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  // Redirect to Discord login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Save the room code so we can rejoin after auth
      if (code) saveRoomCode(code.toUpperCase())
      window.location.href = '/api/auth/discord'
    }
  }, [authLoading, user, code])

  // Auto-join when connected and we have a saved room code
  useEffect(() => {
    if (!user || !connected || !code) return
    if (room && room.code === code.toUpperCase()) return
    if (joining) return

    // Save room code for reconnection
    saveRoomCode(code.toUpperCase())

    setJoining(true)
    joinRoom(code).then(res => {
      setJoining(false)
      if (!res.ok) {
        reset()
        setError(res.error ?? 'Impossible de rejoindre')
        setTimeout(() => navigate('/'), 2000)
      }
    })
  }, [user, connected, code, room, joining, joinRoom, navigate, reset])

  if (authLoading || !user) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-accent-red text-lg mb-2">{error}</p>
        <p className="text-text-muted text-sm">Redirection vers l'accueil...</p>
      </div>
    )
  }

  if (!room || room.code !== code?.toUpperCase()) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Connexion a la room...</p>
      </div>
    )
  }

  if (room.gameState.status === 'lobby') {
    return <RoomLobby />
  }

  return <GameWrapper />
}
