import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Crown, X, Copy, Check, Users, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useRoomStore } from '@/stores/roomStore'
import { useRoom } from '@/hooks/useRoom'
import { registry } from '@/lib/registry'
import type { GameSetting } from '@/types/game'
import GameCard from './GameCard'

const colorRingMap: Record<string, string> = {
  'neon-green': 'ring-neon-green/60',
  'neon-pink': 'ring-neon-pink/60',
  'neon-blue': 'ring-neon-blue/60',
  'neon-yellow': 'ring-neon-yellow/60',
  'neon-purple': 'ring-neon-purple/60',
  'neon-orange': 'ring-neon-orange/60',
}

const colorDotMap: Record<string, string> = {
  'neon-green': 'bg-neon-green',
  'neon-pink': 'bg-neon-pink',
  'neon-blue': 'bg-neon-blue',
  'neon-yellow': 'bg-neon-yellow',
  'neon-purple': 'bg-neon-purple',
  'neon-orange': 'bg-neon-orange',
}

export default function RoomLobby() {
  const navigate = useNavigate()
  const room = useRoomStore(s => s.room)!
  const isHost = useRoomStore(s => s.isHost())
  const { selectGame, updateSettings, startGame, kickPlayer, leaveRoom } = useRoom()
  const [copied, setCopied] = useState(false)

  const handleLeave = () => {
    navigate('/')
    leaveRoom()
  }

  const games = registry.getAll()
  const selectedGame = room.gameId ? registry.get(room.gameId) : null
  const connectedCount = room.players.filter(p => p.connected).length
  const canStart = selectedGame && connectedCount >= (selectedGame?.config.minPlayers ?? 2)

  const inviteLink = `${window.location.origin}/room/${room.code}`
  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

      {/* ─── LEFT: Room info + Players ─── */}
      <div className="lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">

        {/* Room code */}
        <div className="gradient-border">
          <div className="p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted font-medium mb-3">
              Code de la room
            </p>
            <div className="flex items-center gap-3">
              <p className="font-display text-4xl tracking-[0.25em] text-neon-green text-glow-green">
                {room.code}
              </p>
              <button
                onClick={copyLink}
                className="ml-auto p-2.5 rounded-lg bg-surface-light border border-border/50 text-text-muted hover:text-neon-green hover:border-neon-green/30 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <p className="text-neon-green text-xs font-medium mt-2">Lien copie !</p>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="gradient-border flex-1">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-text-muted" />
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-text-muted font-medium">
                Joueurs
              </h2>
            </div>
            <span className="text-xs tabular-nums font-medium text-text-secondary bg-surface-light px-2 py-0.5 rounded-md">
              {connectedCount}/{room.players.length}
            </span>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {room.players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl group hover:bg-surface-light/60 transition-colors"
              >
                <div className="relative">
                  <img
                    src={player.avatar}
                    alt=""
                    className={`w-9 h-9 rounded-full ring-2 ${colorRingMap[player.color] ?? 'ring-border'} ${!player.connected ? 'opacity-40 grayscale' : ''}`}
                  />
                  {player.connected && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${colorDotMap[player.color] ?? 'bg-neon-green'} border-2 border-surface`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium block truncate ${player.connected ? 'text-text-primary' : 'text-text-muted line-through'}`}>
                    {player.name}
                  </span>
                  {player.id === room.hostId && (
                    <span className="flex items-center gap-1 text-[10px] text-neon-yellow font-medium">
                      <Crown className="w-2.5 h-2.5" />
                      Host
                    </span>
                  )}
                </div>

                {isHost && player.id !== room.hostId && (
                  <button
                    onClick={() => kickPlayer(player.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-text-muted hover:text-neon-pink hover:bg-neon-pink/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Leave */}
        <button
          onClick={handleLeave}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface text-text-secondary text-sm hover:text-neon-pink hover:border-neon-pink/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Quitter la room
        </button>
      </div>

      {/* ─── RIGHT: Game selection + Settings + Launch ─── */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-text-secondary tracking-wide">
            {isHost ? 'CHOISIS UN JEU' : 'JEU SELECTIONNE'}
          </h2>
          {selectedGame && (
            <span className="text-xs text-neon-green bg-neon-green/10 border border-neon-green/20 px-2.5 py-1 rounded-full font-medium">
              {selectedGame.emoji} {selectedGame.name}
            </span>
          )}
        </div>

        {/* Games */}
        {isHost ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {games.map((game, i) => (
              <div
                key={game.id}
                onClick={() => selectGame(game.id)}
                className="cursor-pointer"
              >
                <GameCard game={game} index={i} selected={room.gameId === game.id} />
              </div>
            ))}
          </div>
        ) : selectedGame ? (
          <div className="gradient-border">
            <div className="p-8 text-center">
              <span className="text-5xl">{selectedGame.emoji}</span>
              <p className="font-display text-xl mt-3">{selectedGame.name}</p>
              <p className="text-text-muted text-sm mt-2">En attente du lancement par l'hote...</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted">
            L'hote choisit un jeu...
          </div>
        )}

        {/* Settings */}
        {selectedGame?.settings && selectedGame.settings.length > 0 && (
          <div className="space-y-2">
            {selectedGame.settings.filter((s) => {
              if (!s.visibleWhen) return true
              const depValue = room.settings[s.visibleWhen.settingId] ??
                selectedGame.settings?.find(d => d.id === s.visibleWhen!.settingId)?.default
              return depValue === s.visibleWhen.value
            }).map((setting) => (
              <SettingRow
                key={setting.id}
                setting={setting}
                value={room.settings[setting.id] ?? setting.default}
                onChange={isHost ? (v) => updateSettings({ [setting.id]: v }) : undefined}
              />
            ))}
          </div>
        )}

        {/* Launch */}
        <div className="flex gap-3 mt-auto pt-4">
          {isHost && (
            <button
              onClick={startGame}
              disabled={!canStart}
              className="flex-1 py-3.5 rounded-xl font-display tracking-wide text-lg bg-neon-green/10 border border-neon-green/20 text-neon-green hover:bg-neon-green/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              LANCER LA PARTIE
            </button>
          )}
        </div>

        {isHost && selectedGame && !canStart && (
          <p className="text-center text-text-muted text-xs">
            Il faut au moins {selectedGame.config.minPlayers} joueurs connectes pour lancer
          </p>
        )}
      </div>
    </div>
  )
}

function SettingRow({ setting, value, onChange }: {
  setting: GameSetting
  value: number
  onChange?: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-4 bg-surface-light border border-border/30 rounded-xl p-3">
      <span className="text-sm text-text-secondary font-medium min-w-20">{setting.label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {setting.options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              onClick={() => onChange?.(opt.value)}
              disabled={!onChange}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
                  : onChange
                    ? 'bg-surface border border-border/50 text-text-muted hover:text-text-secondary hover:border-border-light'
                    : 'bg-surface border border-border/50 text-text-muted cursor-default'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
