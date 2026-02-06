import type { ComponentType } from 'react'
export type { Player, GameStatus, GameState, GameConfig } from '@shared/types'
import type { Player, GameStatus, GameState, GameConfig } from '@shared/types'

export interface GameSetting {
  id: string
  label: string
  options: { label: string; value: number }[]
  default: number
}

export interface GameDefinition {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  config: GameConfig
  tags: string[]
  settings?: GameSetting[]
  component: ComponentType<GameComponentProps>
}

export interface GameComponentProps {
  players: Player[]
  myPlayerId: string
  gameState: GameState
  updateGameData: (data: Record<string, unknown>) => void
  updateScore: (playerId: string, delta: number) => void
  setStatus: (status: GameStatus) => void
  nextRound: () => void
  endGame: () => void
}
