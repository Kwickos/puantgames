import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Shield, BookOpen, Users, Trophy, Monitor, Trash2, Plus, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

type Tab = 'words' | 'players' | 'leaderboard' | 'rooms'

const GAME_OPTIONS = [
  { id: 'codenames', label: 'Codenames' },
  { id: 'undercover', label: 'Undercover' },
] as const

interface CustomWord {
  id: number
  word: string
  word2: string | null
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

export default function Admin() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('words')

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/')
  }, [user, navigate])

  if (!user?.isAdmin) return null

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'words', label: 'Mots', icon: BookOpen },
    { id: 'players', label: 'Joueurs', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'rooms', label: 'Rooms', icon: Monitor },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-neon-pink" />
          <h1 className="font-display text-3xl tracking-wide">
            <span className="text-text-primary">ADMIN</span>
            <span className="text-neon-pink">PANEL</span>
          </h1>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 justify-center flex-wrap"
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-neon-pink/10 border border-neon-pink/30 text-neon-pink'
                : 'bg-surface-light border border-border text-text-secondary hover:text-text-primary hover:border-border/80'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="gradient-border"
      >
        <div className="p-6">
          {tab === 'words' && <WordsTab />}
          {tab === 'players' && <PlayersTab />}
          {tab === 'leaderboard' && <LeaderboardTab />}
          {tab === 'rooms' && <RoomsTab />}
        </div>
      </motion.div>
    </div>
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
    <div className="space-y-5">
      {/* Game selector */}
      <div className="flex gap-2">
        {GAME_OPTIONS.map(g => (
          <button
            key={g.id}
            onClick={() => setGameId(g.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              gameId === g.id
                ? 'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue'
                : 'bg-surface-light border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="space-y-2">
        <p className="text-text-muted text-xs uppercase tracking-wider font-medium">Ajouter un mot</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWord()}
            placeholder={gameId === 'undercover' ? 'Mot civil...' : 'Nouveau mot...'}
            className="flex-1 bg-surface-light border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-blue/50"
          />
          {gameId === 'undercover' && (
            <input
              type="text"
              value={word2}
              onChange={e => setWord2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWord()}
              placeholder="Mot undercover..."
              className="flex-1 bg-surface-light border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-pink/50"
            />
          )}
          <button
            onClick={addWord}
            disabled={!word.trim() || (gameId === 'undercover' && !word2.trim())}
            className="bg-neon-blue/10 border border-neon-blue/20 text-neon-blue rounded-xl px-4 py-2.5 hover:bg-neon-blue/20 transition-colors disabled:opacity-30"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Word list */}
      <div className="space-y-1.5">
        <p className="text-text-muted text-xs uppercase tracking-wider font-medium">
          Mots custom ({words.length})
        </p>
        {loading ? (
          <div className="text-center py-6">
            <div className="w-6 h-6 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : words.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">Aucun mot custom pour ce jeu.</p>
        ) : (
          words.map(w => (
            <div key={w.id} className="flex items-center gap-3 bg-surface-light/50 border border-border/20 rounded-xl px-4 py-2.5">
              <span className="text-sm text-text-primary flex-1">
                {w.word}
                {w.word2 && (
                  <span className="text-text-muted"> / <span className="text-neon-pink">{w.word2}</span></span>
                )}
              </span>
              <button onClick={() => deleteWord(w.id)} className="text-text-muted hover:text-neon-pink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Players Tab ───

function PlayersTab() {
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

  return (
    <div className="space-y-5">
      {/* Ban form */}
      <div className="space-y-2">
        <p className="text-text-muted text-xs uppercase tracking-wider font-medium">Bannir un joueur</p>
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input
            type="text"
            value={discordId}
            onChange={e => setDiscordId(e.target.value)}
            placeholder="Discord ID"
            className="bg-surface-light border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-pink/50"
          />
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            className="bg-surface-light border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-pink/50"
          />
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ban()}
            placeholder="Raison (optionnel)"
            className="bg-surface-light border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-pink/50"
          />
          <button
            onClick={ban}
            disabled={!discordId.trim() || !username.trim()}
            className="bg-neon-pink/10 border border-neon-pink/20 text-neon-pink rounded-xl px-4 py-2.5 hover:bg-neon-pink/20 transition-colors disabled:opacity-30"
          >
            Bannir
          </button>
        </div>
      </div>

      {/* Ban list */}
      <div className="space-y-1.5">
        <p className="text-text-muted text-xs uppercase tracking-wider font-medium">
          Joueurs bannis ({bans.length})
        </p>
        {loading ? (
          <div className="text-center py-6">
            <div className="w-6 h-6 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : bans.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">Aucun joueur banni.</p>
        ) : (
          bans.map(b => (
            <div key={b.discordId} className="flex items-center gap-3 bg-neon-pink/5 border border-neon-pink/15 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium">{b.username}</p>
                <p className="text-xs text-text-muted truncate">
                  {b.discordId}
                  {b.reason && <span> — {b.reason}</span>}
                </p>
              </div>
              <button onClick={() => unban(b.discordId)} className="text-text-muted hover:text-neon-blue transition-colors text-xs">
                Debannir
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Leaderboard Tab ───

function LeaderboardTab() {
  const [confirm, setConfirm] = useState<string | null>(null)

  const GAMES = [
    { id: 'click-race', label: 'Click Race' },
    { id: 'horse-race', label: 'Course de Chevaux' },
    { id: 'undercover', label: 'Undercover' },
    { id: 'codenames', label: 'Codenames' },
  ]

  const reset = async (gameId?: string) => {
    const url = gameId ? `/api/admin/leaderboard/${gameId}` : '/api/admin/leaderboard'
    await fetch(url, { method: 'DELETE' })
    setConfirm(null)
  }

  return (
    <div className="space-y-5">
      <p className="text-text-muted text-xs uppercase tracking-wider font-medium">Reset leaderboard</p>

      {/* Global reset */}
      <div className="flex items-center justify-between bg-neon-pink/5 border border-neon-pink/15 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm text-text-primary font-medium">Reset global</p>
          <p className="text-xs text-text-muted">Supprime toutes les statistiques</p>
        </div>
        {confirm === 'global' ? (
          <div className="flex gap-2">
            <button onClick={() => reset()} className="bg-neon-pink/20 border border-neon-pink/30 text-neon-pink rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-neon-pink/30 transition-colors">
              Confirmer
            </button>
            <button onClick={() => setConfirm(null)} className="bg-surface-light border border-border text-text-muted rounded-lg px-3 py-1.5 text-xs hover:text-text-primary transition-colors">
              Annuler
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm('global')} className="text-neon-pink hover:bg-neon-pink/10 rounded-lg p-2 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Per-game reset */}
      <div className="space-y-2">
        {GAMES.map(g => (
          <div key={g.id} className="flex items-center justify-between bg-surface-light/50 border border-border/20 rounded-xl px-4 py-3">
            <p className="text-sm text-text-primary">{g.label}</p>
            {confirm === g.id ? (
              <div className="flex gap-2">
                <button onClick={() => reset(g.id)} className="bg-neon-pink/20 border border-neon-pink/30 text-neon-pink rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-neon-pink/30 transition-colors">
                  Confirmer
                </button>
                <button onClick={() => setConfirm(null)} className="bg-surface-light border border-border text-text-muted rounded-lg px-3 py-1.5 text-xs hover:text-text-primary transition-colors">
                  Annuler
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirm(g.id)} className="text-text-muted hover:text-neon-pink rounded-lg p-2 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs uppercase tracking-wider font-medium">
          Rooms actives ({rooms.length})
        </p>
        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" title="Auto-refresh 5s" />
      </div>

      {loading ? (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : rooms.length === 0 ? (
        <p className="text-text-muted text-sm py-4 text-center">Aucune room active.</p>
      ) : (
        rooms.map(r => (
          <div key={r.code} className="bg-surface-light/50 border border-border/20 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm tracking-wider text-text-primary">{r.code}</span>
              <div className="flex items-center gap-2">
                {r.gameId && (
                  <span className="text-xs bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded-md">
                    {r.gameId}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-md ${
                  r.status === 'playing'
                    ? 'bg-neon-green/10 text-neon-green'
                    : r.status === 'finished'
                      ? 'bg-neon-pink/10 text-neon-pink'
                      : 'bg-surface-light text-text-muted'
                }`}>
                  {r.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.players.map((p, i) => (
                <span key={i} className={`text-xs px-2 py-1 rounded-md ${
                  p.connected ? 'bg-neon-green/10 text-neon-green' : 'bg-surface-light text-text-muted'
                }`}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
