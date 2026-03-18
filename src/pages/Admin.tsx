import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Users, DoorOpen, BookOpen, Settings,
  Plus, Search, Trash2, Ban, CircleX, RefreshCw,
  Activity, Trophy, DoorClosed, Megaphone, TriangleAlert,
  MousePointerClick, Flag, EyeOff, Grid3X3,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

type Tab = 'dashboard' | 'users' | 'rooms' | 'words' | 'settings'

const GAME_OPTIONS = [
  { id: 'codenames', label: 'Codenames' },
  { id: 'undercover', label: 'Undercover' },
] as const

interface CustomWord {
  id: number
  word: string
  word2: string | null
  createdAt?: string
}

interface BannedUser {
  discordId: string
  username: string
  reason: string | null
  bannedAt: string
}

interface RoomInfo {
  code: string
  players: { name: string; connected: boolean }[]
  gameId: string | null
  status: string
}

const NAV_ITEMS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'rooms', label: 'Salons', icon: DoorOpen },
  { id: 'words', label: 'Mots', icon: BookOpen },
  { id: 'settings', label: 'Parametres', icon: Settings },
]

export default function Admin() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('dashboard')

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/')
  }, [user, navigate])

  if (!user?.isAdmin) return null

  return (
    <div className="flex h-screen bg-page overflow-hidden">
      {/* Sidebar — 240px fixed */}
      <aside className="w-[240px] shrink-0 bg-card border-r border-border flex flex-col">
        <div className="flex flex-col gap-[4px] px-[16px] py-[24px]">
          <span className="font-mono text-[10px] font-medium tracking-[2px] text-text-muted mb-[8px]">
            NAVIGATION
          </span>
          {NAV_ITEMS.map(item => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-[12px] rounded-[8px] px-[12px] py-[10px] w-full text-left transition-colors ${
                  active
                    ? 'bg-accent text-text-inverted font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="font-body text-[14px]" style={{ fontWeight: active ? 600 : 500 }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-[32px] flex flex-col gap-[24px]">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'rooms' && <RoomsTab />}
        {tab === 'words' && <WordsTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}

// ─── Dashboard Tab ───

function DashboardTab() {
  const [rooms, setRooms] = useState<RoomInfo[]>([])

  useEffect(() => {
    fetch('/api/admin/rooms')
      .then(r => r.json())
      .then(setRooms)
      .catch(() => {})
  }, [])

  const stats = [
    { label: 'Joueurs en ligne', value: '—', sub: '', icon: Activity },
    { label: 'Rooms actives', value: String(rooms.length), sub: '', icon: DoorOpen },
    { label: "Parties aujourd'hui", value: '—', sub: '', icon: Trophy },
    { label: 'Utilisateurs total', value: '—', sub: '', icon: Users },
  ]

  return (
    <>
      {/* Stats row */}
      <div className="flex gap-[16px]">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex-1 bg-card rounded-[12px] border border-border-subtle p-[20px] flex flex-col gap-[12px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-text-secondary">{s.label}</span>
              <s.icon className="w-[18px] h-[18px] text-text-secondary" />
            </div>
            <span className="font-display text-[32px] font-bold text-text-primary leading-none">
              {s.value}
            </span>
            {s.sub && (
              <span className="font-body text-[12px] text-accent-green">{s.sub}</span>
            )}
          </div>
        ))}
      </div>

      {/* Bottom section: Activity table + Quick actions */}
      <div className="flex gap-[16px] flex-1 min-h-0">
        {/* Activity table */}
        <div className="flex-1 bg-card rounded-[12px] border border-border-subtle flex flex-col overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-[20px] py-[16px]">
            <span className="font-display text-[16px] font-semibold text-text-primary">
              Activite recente
            </span>
            <span className="font-mono text-[11px] text-accent bg-accent/10 px-[10px] py-[4px] rounded-full">
              En direct
            </span>
          </div>

          {/* Column headers */}
          <div className="flex items-center h-[40px] px-[20px] bg-elevated">
            <span className="flex-1 font-mono text-[11px] text-text-muted">Jeu</span>
            <span className="flex-1 font-mono text-[11px] text-text-muted">Room</span>
            <span className="w-[80px] font-mono text-[11px] text-text-muted">Joueurs</span>
            <span className="flex-1 font-mono text-[11px] text-text-muted">Gagnant</span>
            <span className="w-[100px] font-mono text-[11px] text-text-muted">Date</span>
          </div>

          {/* Placeholder rows */}
          <div className="flex-1 flex items-center justify-center text-text-muted text-[13px] font-body">
            Aucune activite recente
          </div>
        </div>

        {/* Quick actions */}
        <div className="w-[300px] bg-card rounded-[12px] border border-border-subtle p-[20px] flex flex-col gap-[16px]">
          <span className="font-display text-[16px] font-semibold text-text-primary">
            Actions rapides
          </span>
          <button
            onClick={() => {}}
            className="flex items-center gap-[10px] rounded-[8px] bg-accent-red/10 border border-accent-red/20 px-[16px] py-[12px] text-accent-red transition-colors hover:bg-accent-red/20"
          >
            <Ban className="w-[18px] h-[18px]" />
            <span className="font-body text-[13px] font-semibold">Bannir un joueur</span>
          </button>
          <button
            onClick={() => {}}
            className="flex items-center gap-[10px] rounded-[8px] bg-accent-orange/10 border border-accent-orange/20 px-[16px] py-[12px] text-accent-orange transition-colors hover:bg-accent-orange/20"
          >
            <DoorClosed className="w-[18px] h-[18px]" />
            <span className="font-body text-[13px] font-semibold">Fermer une room</span>
          </button>
          <button
            onClick={() => {}}
            className="flex items-center gap-[10px] rounded-[8px] bg-accent px-[16px] py-[12px] text-text-inverted transition-colors hover:bg-accent/90"
          >
            <Megaphone className="w-[18px] h-[18px]" />
            <span className="font-body text-[13px] font-semibold">Envoyer une annonce</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Words Tab ───

function WordsTab() {
  const [gameId, setGameId] = useState('codenames')
  const [words, setWords] = useState<CustomWord[]>([])
  const [loading, setLoading] = useState(true)
  const [word, setWord] = useState('')
  const [word2, setWord2] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/words/${gameId}`)
      .then(r => r.json())
      .then(setWords)
      .finally(() => setLoading(false))
  }, [gameId])

  useEffect(() => { load() }, [load])

  const addWord = async () => {
    const w = word.trim()
    if (!w) return
    if (gameId === 'undercover' && !word2.trim()) return

    await fetch(`/api/admin/words/${gameId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: w, word2: gameId === 'undercover' ? word2.trim() : undefined }),
    })
    setWord('')
    setWord2('')
    load()
  }

  const deleteWord = async (id: number) => {
    await fetch(`/api/admin/words/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      {/* Title */}
      <h1 className="font-display text-[24px] font-bold text-text-primary">
        Gestion des Mots
      </h1>

      {/* Game tabs */}
      <div className="flex items-end border-b border-border-subtle">
        {GAME_OPTIONS.map(g => {
          const active = gameId === g.id
          return (
            <button
              key={g.id}
              onClick={() => setGameId(g.id)}
              className={`flex items-center gap-[8px] px-[20px] py-[10px] font-body text-[14px] transition-colors ${
                active
                  ? 'text-accent font-semibold border-b-2 border-accent'
                  : 'text-text-muted font-medium border-b border-border-subtle hover:text-text-secondary'
              }`}
            >
              {g.id === 'codenames' ? (
                <Grid3X3 className="w-[16px] h-[16px]" />
              ) : (
                <EyeOff className="w-[16px] h-[16px]" />
              )}
              {g.label}
              <span
                className={`text-[11px] font-mono px-[8px] py-[2px] rounded-[10px] ${
                  active ? 'bg-accent text-text-inverted' : 'bg-elevated text-text-muted'
                }`}
              >
                {words.length}
              </span>
            </button>
          )
        })}
        <div className="flex-1 border-b border-border-subtle" />
      </div>

      {/* Add form */}
      <div className="flex items-center gap-[12px]">
        <div className="flex-1 flex items-center gap-[10px] h-[44px] bg-card rounded-[8px] border border-border px-[14px]">
          <Search className="w-[16px] h-[16px] text-text-muted shrink-0" />
          <input
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWord()}
            placeholder={gameId === 'undercover' ? 'Mot civil...' : 'Ajouter un mot...'}
            className="flex-1 bg-transparent font-body text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
        {gameId === 'undercover' && (
          <div className="flex-1 flex items-center gap-[10px] h-[44px] bg-card rounded-[8px] border border-border px-[14px]">
            <input
              type="text"
              value={word2}
              onChange={e => setWord2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWord()}
              placeholder="Mot undercover..."
              className="flex-1 bg-transparent font-body text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        )}
        <button
          onClick={addWord}
          disabled={!word.trim() || (gameId === 'undercover' && !word2.trim())}
          className="flex items-center gap-[8px] h-[44px] bg-accent rounded-[8px] px-[20px] text-text-inverted font-body text-[14px] font-semibold transition-colors hover:bg-accent/90 disabled:opacity-30"
        >
          <Plus className="w-[16px] h-[16px]" />
          Ajouter
        </button>
      </div>

      {/* Word table */}
      <div className="bg-card rounded-[12px] border border-border-subtle flex-1 flex flex-col overflow-hidden">
        {/* Table head */}
        <div className="flex items-center h-[44px] px-[20px] bg-elevated gap-[12px]">
          <span className="flex-1 font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">
            Mot
          </span>
          <span className="w-[140px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">
            Ajoute le
          </span>
          <span className="w-[80px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">
            Actions
          </span>
        </div>

        {/* Table body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-[24px]">
              <div className="w-[24px] h-[24px] border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : words.length === 0 ? (
            <div className="flex items-center justify-center py-[24px] text-text-muted font-body text-[14px]">
              Aucun mot pour ce jeu.
            </div>
          ) : (
            words.map(w => (
              <div
                key={w.id}
                className="flex items-center h-[48px] px-[20px] gap-[12px] border-b border-border-subtle last:border-b-0"
              >
                <span className="flex-1 font-body text-[14px] font-medium text-text-primary">
                  {w.word}
                  {w.word2 && (
                    <span className="text-text-muted"> / <span className="text-accent-red">{w.word2}</span></span>
                  )}
                </span>
                <span className="w-[140px] font-body text-[13px] text-text-muted">
                  {w.createdAt ? new Date(w.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
                <div className="w-[80px] flex items-center justify-center">
                  <button
                    onClick={() => deleteWord(w.id)}
                    className="text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 className="w-[16px] h-[16px]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ─── Users Tab ───

function UsersTab() {
  const [bans, setBans] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [discordId, setDiscordId] = useState('')
  const [username, setUsername] = useState('')
  const [reason, setReason] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/bans')
      .then(r => r.json())
      .then(setBans)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const ban = async () => {
    if (!discordId.trim() || !username.trim()) return
    await fetch('/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId: discordId.trim(), username: username.trim(), reason: reason.trim() || undefined }),
    })
    setDiscordId('')
    setUsername('')
    setReason('')
    load()
  }

  const unban = async (id: string) => {
    await fetch(`/api/admin/bans/${id}`, { method: 'DELETE' })
    load()
  }

  // Random avatar colors for banned users
  const avatarColors = ['#7C3AED', '#2563EB', '#F97316', '#EC4899', '#06B6D4', '#22C55E']

  return (
    <>
      {/* Title */}
      <h1 className="font-display text-[24px] font-bold text-text-primary">
        Gestion des Utilisateurs
      </h1>

      {/* Ban form card */}
      <div className="bg-card rounded-[12px] border border-border-subtle p-[20px] flex flex-col gap-[16px]">
        <span className="font-display text-[16px] font-semibold text-text-primary">
          Bannir un joueur
        </span>
        <div className="flex items-end gap-[12px]">
          {/* Discord ID */}
          <div className="flex-1 flex flex-col gap-[6px]">
            <label className="font-body text-[12px] font-medium text-text-secondary">Discord ID</label>
            <div className="flex items-center h-[40px] bg-elevated rounded-[8px] border border-border px-[12px]">
              <input
                type="text"
                value={discordId}
                onChange={e => setDiscordId(e.target.value)}
                placeholder="123456789012345678"
                className="flex-1 bg-transparent font-body text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
          {/* Pseudo */}
          <div className="flex-1 flex flex-col gap-[6px]">
            <label className="font-body text-[12px] font-medium text-text-secondary">Pseudo</label>
            <div className="flex items-center h-[40px] bg-elevated rounded-[8px] border border-border px-[12px]">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Pseudo du joueur"
                className="flex-1 bg-transparent font-body text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
          {/* Reason */}
          <div className="flex-1 flex flex-col gap-[6px]">
            <label className="font-body text-[12px] font-medium text-text-secondary">Raison (optionnel)</label>
            <div className="flex items-center h-[40px] bg-elevated rounded-[8px] border border-border px-[12px]">
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ban()}
                placeholder="Raison du ban..."
                className="flex-1 bg-transparent font-body text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
          {/* Ban button */}
          <button
            onClick={ban}
            disabled={!discordId.trim() || !username.trim()}
            className="flex items-center justify-center gap-[8px] h-[40px] bg-accent-red rounded-[8px] px-[20px] text-text-primary font-body text-[14px] font-semibold transition-colors hover:bg-accent-red/90 disabled:opacity-30"
          >
            <Ban className="w-[16px] h-[16px]" />
            Bannir
          </button>
        </div>
      </div>

      {/* Banned users table */}
      <div className="bg-card rounded-[12px] border border-border-subtle flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-[20px] py-[16px]">
          <span className="font-display text-[16px] font-semibold text-text-primary">
            Joueurs bannis
          </span>
          <span className="font-mono text-[12px] text-text-secondary bg-elevated px-[10px] py-[4px] rounded-[10px]">
            {bans.length}
          </span>
        </div>

        {/* Column headers */}
        <div className="flex items-center h-[40px] px-[20px] bg-elevated">
          <span className="flex-1 font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Joueur</span>
          <span className="w-[200px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Discord ID</span>
          <span className="w-[200px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Raison</span>
          <span className="w-[120px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Date</span>
          <span className="w-[80px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Actions</span>
        </div>

        {/* Table body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-[24px]">
              <div className="w-[24px] h-[24px] border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bans.length === 0 ? (
            <div className="flex items-center justify-center py-[24px] text-text-muted font-body text-[14px]">
              Aucun joueur banni.
            </div>
          ) : (
            bans.map((b, idx) => (
              <div
                key={b.discordId}
                className="flex items-center h-[52px] px-[20px] border-b border-border-subtle last:border-b-0"
              >
                {/* User with avatar dot */}
                <div className="flex-1 flex items-center gap-[10px]">
                  <div
                    className="w-[28px] h-[28px] rounded-full shrink-0"
                    style={{ backgroundColor: avatarColors[idx % avatarColors.length] }}
                  />
                  <span className="font-body text-[14px] font-medium text-text-primary">{b.username}</span>
                </div>
                {/* Discord ID */}
                <span className="w-[200px] font-mono text-[13px] text-text-muted truncate">
                  {b.discordId}
                </span>
                {/* Reason */}
                <span className="w-[200px] font-body text-[13px] text-accent-red truncate">
                  {b.reason || '—'}
                </span>
                {/* Date */}
                <span className="w-[120px] font-body text-[13px] text-text-muted">
                  {new Date(b.bannedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                {/* Unban action */}
                <div className="w-[80px] flex items-center justify-center">
                  <button
                    onClick={() => unban(b.discordId)}
                    className="h-[28px] px-[12px] rounded-[8px] border border-accent-green/20 text-accent-green font-body text-[11px] font-semibold transition-colors hover:bg-accent-green/10"
                  >
                    Unban
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ─── Rooms Tab ───

function RoomsTab() {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    fetch('/api/admin/rooms')
      .then(r => r.json())
      .then((data: RoomInfo[]) => {
        setRooms(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const playingCount = rooms.filter(r => r.status === 'playing').length
  const totalPlayers = rooms.reduce((sum, r) => sum + r.players.length, 0)

  const stats = [
    { value: String(rooms.length), label: 'Rooms actives' },
    { value: String(totalPlayers), label: 'Joueurs connectes' },
    { value: String(playingCount), label: 'En jeu' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing': return 'text-accent-green'
      case 'waiting': return 'text-accent-orange'
      case 'finished': return 'text-accent-red'
      default: return 'text-text-muted'
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'playing': return 'bg-accent-green'
      case 'waiting': return 'bg-accent-orange'
      case 'finished': return 'bg-accent-red'
      default: return 'bg-text-muted'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'playing': return 'En jeu'
      case 'waiting': return 'En attente'
      case 'finished': return 'Termine'
      default: return status
    }
  }

  return (
    <>
      {/* Title row */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[24px] font-bold text-text-primary">
          Monitoring des Salons
        </h1>
        <div className="flex items-center gap-[8px] bg-elevated rounded-[8px] border border-border px-[14px] py-[8px]">
          <RefreshCw className="w-[14px] h-[14px] text-accent" />
          <span className="font-mono text-[12px] text-text-secondary">Auto-refresh 5s</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-[16px]">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex-1 bg-card rounded-[12px] border border-border-subtle p-[16px] flex flex-col gap-[8px]"
          >
            <span className="font-display text-[28px] font-bold text-text-primary leading-none">
              {s.value}
            </span>
            <span className="font-body text-[12px] text-text-secondary">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Room table */}
      <div className="bg-card rounded-[12px] border border-border-subtle flex-1 flex flex-col overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center h-[40px] px-[20px] bg-elevated">
          <span className="w-[100px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Code</span>
          <span className="flex-1 font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Jeu</span>
          <span className="w-[120px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Joueurs</span>
          <span className="w-[120px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Statut</span>
          <span className="w-[80px] font-mono text-[12px] font-semibold tracking-[1px] text-text-secondary">Actions</span>
        </div>

        {/* Table body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-[24px]">
              <div className="w-[24px] h-[24px] border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex items-center justify-center py-[24px] text-text-muted font-body text-[14px]">
              Aucune room active.
            </div>
          ) : (
            rooms.map(r => (
              <div
                key={r.code}
                className="flex items-center h-[48px] px-[20px] border-b border-border-subtle last:border-b-0"
              >
                {/* Code */}
                <span className="w-[100px] font-mono text-[13px] font-semibold text-accent">
                  {r.code}
                </span>
                {/* Game */}
                <span className="flex-1 font-body text-[14px] font-medium text-text-primary">
                  {r.gameId || '—'}
                </span>
                {/* Players */}
                <span className="w-[120px] font-body text-[14px] text-text-primary">
                  {r.players.length}/8
                </span>
                {/* Status */}
                <div className={`w-[120px] flex items-center gap-[6px] ${getStatusColor(r.status)}`}>
                  <div className={`w-[8px] h-[8px] rounded-full ${getStatusDotColor(r.status)}`} />
                  <span className="font-body text-[13px]">{getStatusLabel(r.status)}</span>
                </div>
                {/* Close action */}
                <div className="w-[80px] flex items-center justify-center">
                  <button className="text-accent-red hover:text-accent-red/80 transition-colors">
                    <CircleX className="w-[16px] h-[16px]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ─── Settings Tab ───

function SettingsTab() {
  const [confirm, setConfirm] = useState<string | null>(null)

  const GAMES = [
    { id: 'click-race', label: 'Click Race', icon: MousePointerClick },
    { id: 'horse-race', label: 'Horse Race', icon: Flag },
    { id: 'undercover', label: 'Undercover', icon: EyeOff },
    { id: 'codenames', label: 'Codenames', icon: Grid3X3 },
  ]

  const reset = async (gameId?: string) => {
    const url = gameId ? `/api/admin/leaderboard/${gameId}` : '/api/admin/leaderboard'
    await fetch(url, { method: 'DELETE' })
    setConfirm(null)
  }

  return (
    <>
      {/* Title */}
      <h1 className="font-display text-[24px] font-bold text-text-primary">
        Parametres
      </h1>

      {/* Danger zone */}
      <div className="bg-card rounded-[12px] border border-accent-red/20 p-[24px] flex flex-col gap-[16px]">
        <div className="flex items-center gap-[10px]">
          <TriangleAlert className="w-[20px] h-[20px] text-accent-red" />
          <span className="font-display text-[18px] font-semibold text-accent-red">
            Zone dangereuse
          </span>
        </div>
        <p className="font-body text-[14px] text-text-secondary">
          Ces actions sont irreversibles. Les classements seront definitivement supprimes.
        </p>

        {/* Reset all card */}
        <div className="bg-elevated rounded-[8px] border border-border p-[20px] flex flex-col gap-[12px]">
          <Trash2 className="w-[24px] h-[24px] text-accent-red" />
          <span className="font-display text-[16px] font-semibold text-text-primary">Reset global</span>
          <p className="font-body text-[13px] text-text-muted">
            Supprimer tous les classements de tous les jeux
          </p>
          {confirm === 'global' ? (
            <div className="flex gap-[8px]">
              <button
                onClick={() => reset()}
                className="flex-1 h-[36px] bg-accent-red rounded-[8px] font-body text-[13px] font-semibold text-text-primary transition-colors hover:bg-accent-red/90"
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 h-[36px] bg-elevated rounded-[8px] border border-border font-body text-[13px] text-text-muted transition-colors hover:text-text-primary"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm('global')}
              className="h-[36px] bg-accent-red rounded-[8px] font-body text-[13px] font-semibold text-text-primary transition-colors hover:bg-accent-red/90"
            >
              Reinitialiser tout
            </button>
          )}
        </div>
      </div>

      {/* Per-game reset */}
      <div className="flex flex-col gap-[16px]">
        <span className="font-display text-[18px] font-semibold text-text-primary">
          Reset par jeu
        </span>
        <div className="grid grid-cols-4 gap-[16px]">
          {GAMES.map(g => (
            <div
              key={g.id}
              className="bg-card rounded-[12px] border border-border-subtle p-[20px] flex flex-col gap-[12px]"
            >
              <g.icon className="w-[24px] h-[24px] text-text-secondary" />
              <span className="font-display text-[15px] font-semibold text-text-primary">{g.label}</span>
              <span className="font-body text-[12px] text-text-muted">—</span>
              {confirm === g.id ? (
                <div className="flex gap-[6px]">
                  <button
                    onClick={() => reset(g.id)}
                    className="flex-1 h-[32px] rounded-[8px] border border-accent-red/25 font-body text-[12px] font-semibold text-accent-red transition-colors hover:bg-accent-red/10"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => setConfirm(null)}
                    className="flex-1 h-[32px] rounded-[8px] border border-border font-body text-[12px] text-text-muted transition-colors hover:text-text-primary"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirm(g.id)}
                  className="h-[32px] rounded-[8px] border border-accent-red/25 font-body text-[12px] font-semibold text-accent-red transition-colors hover:bg-accent-red/10"
                >
                  Reinitialiser
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
