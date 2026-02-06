import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Crown, X, Wifi, WifiOff } from 'lucide-react'
import { useRoomStore } from '@/stores/roomStore'
import { useRoom } from '@/hooks/useRoom'
import { registry } from '@/lib/registry'
import type { GameSetting } from '@/types/game'
import RoomCodeDisplay from './RoomCodeDisplay'
import GameCard from './GameCard'

const colorBgMap: Record<string, string> = {
  'neon-green': 'bg-neon-green/10',
  'neon-pink': 'bg-neon-pink/10',
  'neon-blue': 'bg-neon-blue/10',
  'neon-yellow': 'bg-neon-yellow/10',
  'neon-purple': 'bg-neon-purple/10',
  'neon-orange': 'bg-neon-orange/10',
}

const colorBorderMap: Record<string, string> = {
  'neon-green': 'border-neon-green/30',
  'neon-pink': 'border-neon-pink/30',
  'neon-blue': 'border-neon-blue/30',
  'neon-yellow': 'border-neon-yellow/30',
  'neon-purple': 'border-neon-purple/30',
  'neon-orange': 'border-neon-orange/30',
}

export default function RoomLobby() {
  const navigate = useNavigate()
  const room = useRoomStore(s => s.room)!
  const isHost = useRoomStore(s => s.isHost())
  const { selectGame, updateSettings, startGame, kickPlayer, leaveRoom } = useRoom()

  const handleLeave = () => {
    navigate('/')
    leaveRoom()
  }
  const games = registry.getAll()

  const selectedGame = room.gameId ? registry.get(room.gameId) : null
  const connectedCount = room.players.filter(p => p.connected).length
  const canStart = selectedGame && connectedCount >= (selectedGame?.config.minPlayers ?? 2)

  return (
    <div className="space-y-8">
      <RoomCodeDisplay code={room.code} />

      {/* Players */}
      <div>
        <h2 className="font-display text-lg text-text-secondary mb-4 tracking-wide">
          JOUEURS ({room.players.length})
        </h2>
        <div className="space-y-2">
          {room.players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 ${colorBgMap[player.color] ?? 'bg-surface'} border ${colorBorderMap[player.color] ?? 'border-border/50'} rounded-xl p-3 group`}
            >
              <img src={player.avatar} alt="" className="w-8 h-8 rounded-full" />
              <span className={`font-medium flex-1 ${player.connected ? 'text-text-primary' : 'text-text-muted line-through'}`}>
                {player.name}
              </span>
              {player.id === room.hostId && (
                <span className="flex items-center gap-1 text-xs bg-neon-yellow/10 text-neon-yellow px-2 py-0.5 rounded-md">
                  <Crown className="w-3 h-3" />
                  Host
                </span>
              )}
              {player.connected ? (
                <Wifi className="w-3.5 h-3.5 text-neon-green" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-text-muted" />
              )}
              {isHost && player.id !== room.hostId && (
                <button
                  onClick={() => kickPlayer(player.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-neon-pink transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Game selection */}
      <div>
        <h2 className="font-display text-lg text-text-secondary mb-4 tracking-wide">
          {isHost ? 'CHOISIS UN JEU' : 'JEU SELECTIONNE'}
        </h2>

        {isHost ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game, i) => (
              <div
                key={game.id}
                onClick={() => selectGame(game.id)}
                className={`cursor-pointer rounded-2xl transition-all ${
                  room.gameId === game.id
                    ? 'ring-2 ring-neon-green ring-offset-2 ring-offset-midnight'
                    : ''
                }`}
              >
                <GameCard game={game} index={i} />
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

        {/* Game settings */}
        {selectedGame?.settings && selectedGame.settings.length > 0 && (
          <div className="mt-4 space-y-3">
            {selectedGame.settings.map((setting) => (
              <SettingRow
                key={setting.id}
                setting={setting}
                value={room.settings[setting.id] ?? setting.default}
                onChange={isHost ? (v) => updateSettings({ [setting.id]: v }) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleLeave}
          className="px-6 py-3 bg-surface border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-border-light transition-all"
        >
          Quitter
        </button>
        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="px-8 py-3 bg-neon-green/10 border border-neon-green/20 text-neon-green rounded-xl font-display tracking-wide hover:bg-neon-green/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
