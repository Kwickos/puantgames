import { Router, type Request, type Response, type NextFunction } from 'express'
import { verifyToken, ADMIN_DISCORD_ID } from './auth.js'
import {
  getCustomWords,
  addCustomWord,
  deleteCustomWord,
  getBannedUsers,
  banUser,
  unbanUser,
  clearLeaderboard,
} from './db.js'
import type { RoomManager } from './roomManager.js'

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.['puantgames-token']
  if (!token) {
    res.status(401).json({ error: 'Non authentifié' })
    return
  }

  const payload = verifyToken(token)
  if (!payload || payload.discordId !== ADMIN_DISCORD_ID) {
    res.status(403).json({ error: 'Accès refusé' })
    return
  }

  next()
}

export function createAdminRouter(roomManager: RoomManager): Router {
  const router = Router()
  router.use(requireAdmin)

  // ─── Custom Words ───

  router.get('/words/:gameId', async (req, res) => {
    const words = await getCustomWords(req.params.gameId)
    res.json(words)
  })

  router.post('/words/:gameId', async (req, res) => {
    const { word, word2 } = req.body
    if (!word || typeof word !== 'string') {
      res.status(400).json({ error: 'Mot requis' })
      return
    }
    const id = await addCustomWord(req.params.gameId, word.trim(), word2?.trim() || undefined)
    res.json({ id })
  })

  router.delete('/words/:id', async (req, res) => {
    await deleteCustomWord(parseInt(req.params.id, 10))
    res.json({ ok: true })
  })

  // ─── Banned Users ───

  router.get('/bans', async (_req, res) => {
    const bans = await getBannedUsers()
    res.json(bans)
  })

  router.post('/bans', async (req, res) => {
    const { discordId, username, reason } = req.body
    if (!discordId || !username) {
      res.status(400).json({ error: 'discordId et username requis' })
      return
    }
    await banUser(discordId, username, reason || undefined)
    res.json({ ok: true })
  })

  router.delete('/bans/:discordId', async (req, res) => {
    await unbanUser(req.params.discordId)
    res.json({ ok: true })
  })

  // ─── Leaderboard ───

  router.delete('/leaderboard', async (_req, res) => {
    await clearLeaderboard()
    res.json({ ok: true })
  })

  router.delete('/leaderboard/:gameId', async (req, res) => {
    await clearLeaderboard(req.params.gameId)
    res.json({ ok: true })
  })

  // ─── Rooms ───

  router.get('/rooms', (_req, res) => {
    const rooms = roomManager.getAllRooms()
    res.json(rooms)
  })

  return router
}
