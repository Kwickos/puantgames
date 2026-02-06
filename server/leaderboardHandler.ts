import { Router } from 'express'
import { getLeaderboard } from './db.js'

export const leaderboardRouter = Router()

leaderboardRouter.get('/', async (req, res) => {
  const gameId = req.query.game as string | undefined
  const entries = await getLeaderboard(gameId || undefined)
  res.json(entries)
})
