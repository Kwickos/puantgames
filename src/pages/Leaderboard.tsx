import { useState, useEffect } from 'react'
import { motion } from 'motion/react'

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
  { id: 'horse-race', label: 'Horse Race' },
  { id: 'undercover', label: 'Undercover' },
  { id: 'codenames', label: 'Codenames' },
  { id: 'aim-trainer', label: 'Aim Trainer' },
] as const

function getWinRateColor(winrate: number) {
  if (winrate >= 60) return { text: 'text-accent-green', bg: 'bg-accent-green/[0.125]' }
  if (winrate >= 40) return { text: 'text-accent-orange', bg: 'bg-accent-orange/[0.125]' }
  return { text: 'text-accent-red', bg: 'bg-accent-red/[0.125]' }
}

function getRankDisplay(index: number) {
  if (index === 0) return <span className="text-[20px]">&#x1F947;</span>
  if (index === 1) return <span className="text-[20px]">&#x1F948;</span>
  if (index === 2) return <span className="text-[20px]">&#x1F949;</span>
  return (
    <span className="font-display text-[14px] font-semibold text-text-secondary">
      {index + 1}
    </span>
  )
}

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
    <div className="flex flex-col items-center gap-[24px] py-[32px] px-[80px] h-full w-full">
      {/* Title section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-[8px]"
      >
        <div className="flex items-center gap-[12px]">
          <span className="text-[32px]">&#x1F3C6;</span>
          <h1 className="font-display text-[32px] font-[800] text-text-primary">
            CLASSEMENT
          </h1>
        </div>
        <p className="font-body text-[16px] font-medium text-text-secondary">
          Qui est le plus puant ?
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-[8px] rounded-[14px] bg-card p-[4px]"
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-[20px] py-[10px] rounded-[10px] font-display text-[13px] transition-all ${
              tab === t.id
                ? 'bg-accent font-bold text-text-inverted'
                : 'font-semibold text-text-secondary hover:text-text-primary'
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
        className="w-full flex-1 rounded-[16px] bg-card border border-border-subtle overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-[48px]">
            <div className="w-[32px] h-[32px] border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[48px] gap-[12px]">
            <span className="text-[48px] opacity-30">&#x1F3C6;</span>
            <p className="font-body text-[14px] text-text-muted">
              Aucune partie jouee pour le moment.
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="flex items-center h-[48px] px-[24px] bg-elevated">
              <div className="w-[60px] flex items-center justify-center">
                <span className="font-mono text-[12px] font-medium text-text-muted">#</span>
              </div>
              <div className="flex-1 flex items-center">
                <span className="font-mono text-[11px] font-medium text-text-muted tracking-[1px]">
                  JOUEUR
                </span>
              </div>
              <div className="w-[100px] flex items-center justify-center">
                <span className="font-mono text-[11px] font-medium text-text-muted tracking-[1px]">
                  VICTOIRES
                </span>
              </div>
              <div className="w-[100px] flex items-center justify-center">
                <span className="font-mono text-[11px] font-medium text-text-muted tracking-[1px]">
                  PARTIES
                </span>
              </div>
              <div className="w-[100px] flex items-center justify-center">
                <span className="font-mono text-[11px] font-medium text-text-muted tracking-[1px]">
                  WIN RATE
                </span>
              </div>
            </div>

            {/* Rows */}
            {entries.map((entry, i) => {
              const wr = getWinRateColor(entry.winrate)
              return (
                <motion.div
                  key={entry.discordId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className={`flex items-center h-[56px] px-[24px] ${
                    i < entries.length - 1 ? 'border-b border-border-subtle' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-[60px] flex items-center justify-center">
                    {getRankDisplay(i)}
                  </div>

                  {/* Player */}
                  <div className="flex-1 flex items-center gap-[12px] min-w-0">
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className="w-[32px] h-[32px] rounded-full shrink-0"
                    />
                    <span className={`font-body text-[14px] text-text-primary truncate ${
                      i === 0 ? 'font-bold' : 'font-semibold'
                    }`}>
                      {entry.username}
                    </span>
                  </div>

                  {/* Wins */}
                  <div className="w-[100px] flex items-center justify-center">
                    <span className="font-display text-[16px] font-bold text-accent">
                      {entry.wins}
                    </span>
                  </div>

                  {/* Games played */}
                  <div className="w-[100px] flex items-center justify-center">
                    <span className="font-display text-[14px] font-semibold text-text-primary">
                      {entry.played}
                    </span>
                  </div>

                  {/* Win rate badge */}
                  <div className="w-[100px] flex items-center justify-center">
                    <span className={`inline-flex items-center rounded-full px-[12px] py-[4px] font-mono text-[13px] font-semibold ${wr.bg} ${wr.text}`}>
                      {entry.winrate}%
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </>
        )}
      </motion.div>
    </div>
  )
}
