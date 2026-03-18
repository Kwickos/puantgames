import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '..', '.env') })
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { RoomManager } from './roomManager.js'
import { registerGameHandlers } from './gameHandler.js'
import { authRouter, verifyToken } from './auth.js'
import { initDb, getCustomWords, isUserBanned } from './db.js'
import { leaderboardRouter } from './leaderboardHandler.js'
import { createAdminRouter } from './adminHandler.js'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  DiscordUser,
} from '../shared/types.js'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(cookieParser())
app.use(express.json())

// Auth routes
app.use('/api/auth', authRouter)

// Leaderboard routes
app.use('/api/leaderboard', leaderboardRouter)

// Init database
await initDb()

const roomManager = new RoomManager()

// Admin routes
app.use('/api/admin', createAdminRouter(roomManager))

// Public custom words route (used by games to load custom words)
app.get('/api/words/:gameId', async (req, res) => {
  const words = await getCustomWords(req.params.gameId)
  res.json(words)
})

// Public rooms list
app.get('/api/rooms', (_req, res) => {
  const rooms = roomManager.getPublicRooms()
  res.json(rooms)
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rooms: roomManager.getRoomCount() })
})

const httpServer = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Socket.io auth middleware: parse cookie → verify JWT → attach user
io.use(async (socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie
  if (!cookieHeader) {
    next(new Error('Authentication required'))
    return
  }

  // Parse the puantgames-token from cookie header
  const match = cookieHeader.match(/puantgames-token=([^;]+)/)
  const token = match?.[1]
  if (!token) {
    next(new Error('Authentication required'))
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    next(new Error('Invalid token'))
    return
  }

  // Check if user is banned
  const banned = await isUserBanned(payload.discordId)
  if (banned) {
    next(new Error('Banned'))
    return
  }

  socket.data.user = {
    discordId: payload.discordId,
    username: payload.username,
    avatar: payload.avatar,
    globalName: payload.globalName,
  } as DiscordUser

  next()
})

io.on('connection', (socket) => {
  const user = socket.data.user as DiscordUser
  console.log(`[connect] ${socket.id} (${user.username})`)

  registerGameHandlers(io, socket, roomManager)

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id} (${user.username})`)
    const room = roomManager.getRoomByPlayer(socket.id)
    if (!room) return

    roomManager.markDisconnected(socket.id)

    const deleted = roomManager.cleanupIfAllDisconnected(room.code)
    if (deleted) {
      console.log(`[room:deleted] ${room.code} (all players disconnected)`)
      io.to(room.code).emit('room:closed')
      return
    }

    socket.to(room.code).emit('player:left', {
      playerId: socket.id,
      reason: 'disconnected',
    })

    io.to(room.code).emit('room:state', roomManager.getState(room.code)!)
  })
})

// Serve Vite build in production (same origin = no CORS issues)
const distPath = resolve(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.use((_req, res) => {
  res.sendFile(resolve(distPath, 'index.html'))
})

httpServer.listen(PORT, () => {
  console.log(`PuantGames server running on http://localhost:${PORT}`)
})
