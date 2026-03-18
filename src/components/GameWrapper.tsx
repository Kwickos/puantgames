import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { RotateCcw, DoorOpen, Trophy } from 'lucide-react'
import { registry } from '@/lib/registry'
import { useRoomStore } from '@/stores/roomStore'
import { useRoom } from '@/hooks/useRoom'
import Scoreboard from './Scoreboard'

export default function GameWrapper() {
  const navigate = useNavigate()
  const room = useRoomStore(s => s.room)!
  const isHost = useRoomStore(s => s.isHost())
  const socketId = useRoomStore(s => s.socketId)
  const { updateScore, updateGameData, setStatus, nextRound, endGame, restartGame, backToLobby, leaveRoom } = useRoom()

  const game = room.gameId ? registry.get(room.gameId) : undefined
  const { gameState, players } = room

  if (!game) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-lg mb-4">Jeu introuvable</p>
      </div>
    )
  }

  const GameComponent = game.component

  const handleRestart = () => {
    restartGame()
  }

  const handleBackToLobby = () => {
    backToLobby()
  }

  const handleLeave = () => {
    navigate('/')
    leaveRoom()
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Game area - fills remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Game component */}
        {gameState.status !== 'finished' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex items-center justify-center"
          >
            <GameComponent
              players={players}
              myPlayerId={socketId ?? ''}
              gameState={gameState}
              updateGameData={updateGameData}
              updateScore={updateScore}
              setStatus={setStatus}
              nextRound={nextRound}
              endGame={endGame}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-[16px] px-[20px]"
          >
            <Trophy className="w-[40px] h-[40px] text-accent-orange" />
            <h2 className="font-display text-[22px] font-bold tracking-wide text-text-primary">
              Partie terminee !
            </h2>
            {isHost && (
              <div className="flex items-center gap-[12px] mt-[8px]">
                <button
                  onClick={handleBackToLobby}
                  className="flex items-center gap-[8px] bg-elevated border border-border rounded-[8px] px-[16px] py-[10px] text-[13px] font-semibold font-body text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                >
                  <DoorOpen className="w-[16px] h-[16px]" />
                  Lobby
                </button>
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-[8px] bg-accent/10 border border-accent/20 text-accent rounded-[8px] px-[16px] py-[10px] text-[13px] font-semibold font-body hover:bg-accent/20 transition-colors"
                >
                  <RotateCcw className="w-[16px] h-[16px]" />
                  Rejouer
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Side panel */}
      <div className="w-[320px] shrink-0 bg-card border-l border-border flex flex-col gap-[16px] p-[20px] overflow-y-auto">
        {/* Game info row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-[8px]">
            <span className="text-[16px]">{game.emoji}</span>
            <span className="font-display text-[12px] font-bold tracking-[1px] text-text-primary uppercase">
              {game.name}
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="font-mono text-[10px] text-text-muted bg-elevated rounded-[5px] px-[8px] py-[3px]">
              {room.code}
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {players.length} joueur{players.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Round info / Stats overlay */}
        <div className="flex items-center gap-[32px] bg-elevated rounded-[8px] px-[14px] py-[12px] w-full">
          <div className="flex flex-col gap-[2px]">
            <span className="font-display text-[10px] font-semibold tracking-[2px] text-text-muted">
              ROUND
            </span>
            <span className="font-mono text-[22px] font-bold text-accent">
              {gameState.round}
              {game.config.defaultRounds ? `/${game.config.defaultRounds}` : ''}
            </span>
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="font-display text-[10px] font-semibold tracking-[2px] text-text-muted">
              JOUEURS
            </span>
            <span className="font-mono text-[22px] font-bold text-text-primary">
              {players.length}
            </span>
          </div>
        </div>

        {/* Scoreboard title */}
        <div className="flex items-center justify-between w-full">
          <span className="font-display text-[12px] font-bold tracking-[1px] text-accent">
            CLASSEMENT
          </span>
        </div>

        {/* Scoreboard */}
        {gameState.status === 'finished' ? (
          <Scoreboard players={players} scores={gameState.scores} />
        ) : (
          <Scoreboard players={players} scores={gameState.scores} compact />
        )}
      </div>
    </div>
  )
}
