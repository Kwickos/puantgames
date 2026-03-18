import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Copy, Check, X, LogOut, Play, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { useRoomStore } from '@/stores/roomStore'
import { useRoom } from '@/hooks/useRoom'
import { registry } from '@/lib/registry'
import type { GameSetting } from '@/types/game'
import GameCard from './GameCard'

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
    <div className="flex -mx-6 -my-8 min-h-[calc(100vh-56px)]">

      {/* ─── MAIN AREA (left, flex-1) ─── */}
      <div className="flex-1 flex flex-col gap-[20px] p-[24px] min-w-0">

        {/* Title */}
        <h2 className="font-display text-[20px] font-bold text-white">
          {isHost ? 'Choisir un jeu' : 'Jeu sélectionné'}
        </h2>

        {/* Games grid — 3 columns */}
        {isHost ? (
          <div className="flex gap-[10px]">
            {/* Column 1 */}
            <div className="flex-1 flex flex-col gap-[10px]">
              {games.filter((_, i) => i % 3 === 0).map((game, i) => (
                <div key={game.id} onClick={() => selectGame(game.id)} className="cursor-pointer">
                  <GameCard game={game} index={i * 3} selected={room.gameId === game.id} />
                </div>
              ))}
            </div>
            {/* Column 2 */}
            <div className="flex-1 flex flex-col gap-[10px]">
              {games.filter((_, i) => i % 3 === 1).map((game, i) => (
                <div key={game.id} onClick={() => selectGame(game.id)} className="cursor-pointer">
                  <GameCard game={game} index={i * 3 + 1} selected={room.gameId === game.id} />
                </div>
              ))}
            </div>
            {/* Column 3 */}
            <div className="flex-1 flex flex-col gap-[10px]">
              {games.filter((_, i) => i % 3 === 2).map((game, i) => (
                <div key={game.id} onClick={() => selectGame(game.id)} className="cursor-pointer">
                  <GameCard game={game} index={i * 3 + 2} selected={room.gameId === game.id} />
                </div>
              ))}
            </div>
          </div>
        ) : selectedGame ? (
          <div className="bg-card rounded-[12px] border border-border-subtle p-[14px] flex flex-col gap-[6px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-[18px]">{selectedGame.emoji}</span>
              <span className="font-display text-[14px] font-bold text-white">{selectedGame.name}</span>
            </div>
            <p className="font-body text-[12px] font-medium text-text-secondary">
              En attente du lancement par l'hôte...
            </p>
          </div>
        ) : (
          <div className="text-center py-[48px] text-text-muted text-[14px] font-body">
            L'hôte choisit un jeu...
          </div>
        )}

        {/* Launch section — pushed to bottom */}
        <div className="flex items-center justify-between mt-auto">
          {isHost && selectedGame && !canStart ? (
            <span className="font-body text-[12px] font-medium text-text-muted">
              Minimum {selectedGame.config.minPlayers} joueurs requis
            </span>
          ) : <span />}

          {isHost && (
            <button
              onClick={startGame}
              disabled={!canStart}
              className="flex items-center gap-[8px] bg-accent rounded-[12px] px-[32px] py-[12px] hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Play className="w-[16px] h-[16px] text-text-inverted" />
              <span className="font-display text-[13px] font-bold text-text-inverted">LANCER LA PARTIE</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── SIDEBAR (right, 300px) ─── */}
      <div className="w-[300px] shrink-0 bg-card border-l border-border-subtle flex flex-col gap-[16px] p-[16px]">

        {/* Room Code Section */}
        <div className="bg-elevated rounded-[12px] p-[14px] flex flex-col gap-[8px] border border-elevated">
          <span className="font-mono text-[10px] font-medium tracking-[1.5px] text-text-muted">
            CODE DE LA ROOM
          </span>
          <div className="flex items-center justify-between">
            <span className="font-display text-[28px] font-extrabold tracking-[6px] text-accent">
              {room.code}
            </span>
            <button
              onClick={copyLink}
              className="bg-elevated rounded-[6px] px-[10px] py-[6px] hover:bg-border-subtle transition-colors"
            >
              {copied
                ? <Check className="w-[14px] h-[14px] text-accent" />
                : <Copy className="w-[14px] h-[14px] text-text-secondary" />
              }
            </button>
          </div>
          {copied && (
            <span className="font-body text-[11px] text-accent font-medium">Lien copié !</span>
          )}
        </div>

        {/* Players Section */}
        <div className="flex flex-col gap-[8px] flex-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium tracking-[2px] text-text-muted">JOUEURS</span>
            <span className="font-mono text-[11px] font-medium text-accent">{connectedCount}/{room.players.length}</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            {room.players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-[10px] rounded-[10px] bg-elevated px-[10px] py-[8px] group ${
                  player.id === room.hostId
                    ? 'border border-[#C4F82A30]'
                    : 'border border-border-subtle'
                } ${!player.connected ? 'opacity-40' : ''}`}
              >
                <img src={player.avatar} alt="" className="w-[26px] h-[26px] rounded-full" />
                <span className={`font-body text-[13px] font-semibold flex-1 min-w-0 truncate ${
                  player.connected ? 'text-white' : 'text-text-muted line-through'
                }`}>
                  {player.name}
                </span>
                {player.id === room.hostId && <span className="text-[12px]">👑</span>}
                {isHost && player.id !== room.hostId && (
                  <button
                    onClick={() => kickPlayer(player.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-text-muted hover:text-accent-red transition-all"
                  >
                    <X className="w-[14px] h-[14px]" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Game Settings */}
        {selectedGame?.settings && selectedGame.settings.length > 0 && (
          <div className="bg-elevated rounded-[14px] p-[20px] flex flex-col gap-[16px]">
            <div className="flex items-center gap-[8px]">
              <Settings className="w-[16px] h-[16px] text-accent" />
              <span className="font-mono text-[11px] font-medium tracking-[1px] text-text-muted">
                PARAMÈTRES — {selectedGame.name.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col gap-[12px]">
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
          </div>
        )}

        {/* Leave button */}
        <button
          onClick={handleLeave}
          className="flex items-center justify-center gap-[8px] rounded-[10px] bg-elevated border border-[#EF444440] py-[10px] text-accent-red hover:bg-accent-red/10 transition-colors"
        >
          <LogOut className="w-[14px] h-[14px]" />
          <span className="font-body text-[12px] font-semibold">Quitter la room</span>
        </button>
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
    <div className="flex flex-col gap-[6px]">
      <span className="font-body text-[12px] font-semibold text-white">{setting.label}</span>
      <div className="flex gap-[6px]">
        {setting.options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              onClick={() => onChange?.(opt.value)}
              disabled={!onChange}
              className={`flex-1 flex items-center justify-center rounded-[8px] px-[14px] py-[8px] font-mono text-[12px] transition-all ${
                active
                  ? 'bg-accent text-text-inverted font-semibold'
                  : onChange
                    ? 'bg-card border border-border-subtle text-text-secondary hover:text-white'
                    : 'bg-card border border-border-subtle text-text-secondary cursor-default'
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
