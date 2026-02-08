import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Trophy, Crown, Medal } from 'lucide-react'

interface LeaderboardEntry {
  discordId: string
  username: string
  avatarUrl: string
  wins: number
  played: number
  winrate: number
}

const TABS = [
  { id: '', label: 'Global' },
  { id: 'click-race', label: 'Click Race' },
  { id: 'horse-race', label: 'Course de Chevaux' },
  { id: 'undercover', label: 'Undercover' },
  { id: 'codenames', label: 'Codenames' },
  { id: 'aim-trainer', label: 'Aim Trainer' },
] as const

export default function Leaderboard() {
  const [tab, setTab] = useState('')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = tab ? `/api/leaderboard?game=${tab}` : '/api/leaderboard'
    fetch(url)
      .then(r => r.json())
      .then((data: LeaderboardEntry[]) => {
        setEntries(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tab])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-neon-green" />
          <h1 className="font-display text-3xl tracking-wide">
            <span className="text-text-primary">CLASSE</span>
            <span className="text-neon-green">MENT</span>
          </h1>
        </div>
        <p className="text-text-muted text-sm">Qui est le plus puant ?</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 justify-center flex-wrap"
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                : 'bg-surface-light border border-border text-text-secondary hover:text-text-primary hover:border-border/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="gradient-border"
      >
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-muted text-sm">Chargement...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucune partie jouee pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_80px_80px_80px] gap-2 px-3 py-2 text-text-muted text-xs font-medium uppercase tracking-wider">
                <span>#</span>
                <span>Joueur</span>
                <span className="text-right">Victoires</span>
                <span className="text-right">Parties</span>
                <span className="text-right">Winrate</span>
              </div>

              {entries.map((entry, i) => (
                <motion.div
                  key={entry.discordId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={`grid grid-cols-[40px_1fr_80px_80px_80px] gap-2 items-center px-3 py-3 rounded-xl transition-colors ${
                    i === 0
                      ? 'bg-neon-green/5 border border-neon-green/10'
                      : i === 1
                        ? 'bg-neon-blue/5 border border-neon-blue/10'
                        : i === 2
                          ? 'bg-neon-purple/5 border border-neon-purple/10'
                          : 'bg-surface-light/50 border border-transparent'
                  }`}
                >
                  {/* Position */}
                  <div className="flex items-center justify-center">
                    {i === 0 ? (
                      <Crown className="w-5 h-5 text-neon-green" />
                    ) : i === 1 ? (
                      <Medal className="w-5 h-5 text-neon-blue" />
                    ) : i === 2 ? (
                      <Medal className="w-5 h-5 text-neon-purple" />
                    ) : (
                      <span className="text-text-muted text-sm font-medium">{i + 1}</span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full shrink-0"
                    />
                    <span className="text-text-primary font-medium truncate">
                      {entry.username}
                    </span>
                  </div>

                  {/* Wins */}
                  <span className="text-right text-neon-green font-display text-lg">
                    {entry.wins}
                  </span>

                  {/* Played */}
                  <span className="text-right text-text-secondary text-sm">
                    {entry.played}
                  </span>

                  {/* Winrate */}
                  <span className={`text-right text-sm font-medium ${
                    entry.winrate >= 60
                      ? 'text-neon-green'
                      : entry.winrate >= 40
                        ? 'text-text-secondary'
                        : 'text-neon-pink'
                  }`}>
                    {entry.winrate}%
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
