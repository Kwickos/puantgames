import { Router } from 'express'
import { getLeaderboard } from './db.js'

export const leaderboardRouter = Router()

leaderboardRouter.get('/', (_req, res) => {
  const gameId = _req.query.game as string | undefined
  const entries = getLeaderboard(gameId || undefined)
  res.json(entries)
})
