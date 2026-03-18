import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, User, Users } from 'lucide-react'
import { registry } from '@/lib/registry'

interface PublicRoom {
  code: string
  gameId: string | null
  gameName: string | null
  hostName: string
  playerCount: number
  maxPlayers: number
  status: string // 'lobby' | 'playing' | 'paused' | 'finished'
}

function statusLabel(status: string): string {
  if (status === 'lobby') return 'En attente'
  if (status === 'playing') return 'En cours'
  return status
}

function statusColor(status: string): {
  dot: string
  text: string
  bg: string
  border: string
} {
  if (status === 'lobby') {
    return {
      dot: 'bg-accent',
      text: 'text-accent',
      bg: 'bg-accent/[0.08]',
      border: 'border-accent/25',
    }
  }
  return {
    dot: 'bg-accent-orange',
    text: 'text-accent-orange',
    bg: 'bg-accent-orange/[0.08]',
    border: 'border-accent-orange/25',
  }
}

function gameDisplay(room: PublicRoom): { emoji: string; name: string } {
  if (!room.gameId) return { emoji: '🎮', name: 'Aucun jeu' }
  const def = registry.get(room.gameId)
  if (!def) return { emoji: '🎮', name: room.gameId }
  return { emoji: def.emoji, name: def.name }
}

function canJoin(room: PublicRoom): boolean {
  return room.status === 'lobby' && room.playerCount < room.maxPlayers
}

function joinLabel(room: PublicRoom): string {
  if (room.status !== 'lobby') return 'En cours'
  if (room.playerCount >= room.maxPlayers) return 'Complet'
  return 'Rejoindre'
}

// ───────────────── RoomCard ─────────────────

function RoomCard({ room }: { room: PublicRoom }) {
  const navigate = useNavigate()
  const sc = statusColor(room.status)
  const game = gameDisplay(room)
  const joinable = canJoin(room)

  return (
    <div className="flex flex-col gap-3.5 rounded-xl bg-card border border-border p-5">
      {/* Top row: code + status badge */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-text-muted">
          #{room.code}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${sc.bg} ${sc.border} border`}
        >
          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
          <span className={sc.text}>{statusLabel(room.status)}</span>
        </span>
      </div>

      {/* Game name */}
      <p className="font-display text-lg font-bold text-text-primary">
        {game.emoji} {game.name}
      </p>

      {/* Info row: host + player count */}
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary font-medium">
          <User className="w-3.5 h-3.5 text-text-muted" />
          {room.hostName}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary font-mono font-semibold">
          <Users className="w-3.5 h-3.5 text-text-muted" />
          {room.playerCount}/{room.maxPlayers}
        </span>
      </div>

      {/* Join button */}
      <button
        disabled={!joinable}
        onClick={() => joinable && navigate(`/room/${room.code}`)}
        className={`flex items-center justify-center h-10 rounded-lg font-body text-sm font-bold transition-colors ${
          joinable
            ? 'bg-accent text-page cursor-pointer hover:brightness-110'
            : 'bg-elevated border border-border text-text-muted cursor-default'
        }`}
      >
        {joinLabel(room)}
      </button>
    </div>
  )
}

// ───────────────── Rooms Page ─────────────────

export default function Rooms() {
  const [rooms, setRooms] = useState<PublicRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState<string>('all')
  const [playerFilter, setPlayerFilter] = useState<string>('all')

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data: PublicRoom[] = await res.json()
        setRooms(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + auto-refresh every 5s
  useEffect(() => {
    fetchRooms()
    const id = setInterval(fetchRooms, 5000)
    return () => clearInterval(id)
  }, [fetchRooms])

  // Get unique game IDs for filter dropdown
  const allGames = registry.getAll()

  // Apply filters
  const filtered = rooms.filter(room => {
    // Search: match code, host name, or game name
    if (search) {
      const q = search.toLowerCase()
      const game = gameDisplay(room)
      const haystack = `${room.code} ${room.hostName} ${game.name}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    // Game type filter
    if (gameFilter !== 'all' && room.gameId !== gameFilter) return false
    // Player availability filter
    if (playerFilter === 'available' && !canJoin(room)) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col gap-6 px-12 py-8">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-text-primary">
          Trouver une Room
        </h1>
        <span className="text-sm text-text-muted font-medium">
          {rooms.length} room{rooms.length !== 1 ? 's' : ''} disponible{rooms.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="flex items-center gap-2 flex-1 h-11 rounded-lg bg-elevated border border-border px-4">
          <Search className="w-[18px] h-[18px] text-text-muted shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une room..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted font-body outline-none"
          />
        </div>

        {/* Game type dropdown */}
        <div className="relative">
          <select
            value={gameFilter}
            onChange={e => setGameFilter(e.target.value)}
            className="appearance-none h-11 rounded-lg bg-elevated border border-border pl-4 pr-9 text-sm text-text-secondary font-medium font-body outline-none cursor-pointer"
          >
            <option value="all">Type de jeu</option>
            {allGames.map(g => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        </div>

        {/* Player availability dropdown */}
        <div className="relative">
          <select
            value={playerFilter}
            onChange={e => setPlayerFilter(e.target.value)}
            className="appearance-none h-11 rounded-lg bg-elevated border border-border pl-4 pr-9 text-sm text-text-secondary font-medium font-body outline-none cursor-pointer"
          >
            <option value="all">Joueurs</option>
            <option value="available">Places dispo</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        </div>
      </div>

      {/* Room card grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm">
            {rooms.length === 0
              ? 'Aucune room active pour le moment.'
              : 'Aucune room ne correspond aux filtres.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => (
            <RoomCard key={room.code} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}
