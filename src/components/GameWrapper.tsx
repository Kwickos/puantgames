import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Trophy, RotateCcw, DoorOpen } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Game header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLeave}
            className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-light transition-all"
            title="Quitter la room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.emoji}</span>
              <h1 className="font-display text-2xl tracking-wide">{game.name}</h1>
            </div>
            <p className="text-text-muted text-sm">
              Round {gameState.round}
              {game.config.defaultRounds ? ` / ${game.config.defaultRounds}` : ''}
              {' · Room '}
              {room.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState.status === 'finished' && isHost && (
            <>
              <button
                onClick={handleBackToLobby}
                className="flex items-center gap-2 bg-surface border border-border/50 text-text-secondary rounded-xl px-4 py-2.5 text-sm font-medium hover:text-text-primary hover:border-border-light transition-colors"
              >
                <DoorOpen className="w-4 h-4" />
                Lobby
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 bg-neon-green/10 border border-neon-green/20 text-neon-green rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-neon-green/20 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Rejouer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Finished overlay */}
      {gameState.status === 'finished' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gradient-border"
        >
          <div className="p-6 text-center">
            <Trophy className="w-10 h-10 text-neon-yellow mx-auto mb-3" />
            <h2 className="font-display text-xl mb-4">Partie terminee !</h2>
            <Scoreboard players={players} scores={gameState.scores} />
          </div>
        </motion.div>
      )}

      {/* Scoreboard (during game) */}
      {gameState.status === 'playing' && (
        <Scoreboard players={players} scores={gameState.scores} compact />
      )}

      {/* Game component */}
      {gameState.status !== 'finished' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="gradient-border"
        >
          <div className="p-6">
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
          </div>
        </motion.div>
      )}
    </div>
  )
}
