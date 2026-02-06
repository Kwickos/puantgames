import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { Player } from '../shared/types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = resolve(__dirname, 'data', 'puantgames.db')

let db: Database.Database

export function initDb(): void {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  db.prepare(`
    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discordId TEXT NOT NULL,
      username TEXT NOT NULL,
      avatarUrl TEXT NOT NULL,
      gameId TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      won INTEGER NOT NULL DEFAULT 0,
      playedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run()

  db.prepare(`CREATE INDEX IF NOT EXISTS idx_game_results_discordId ON game_results(discordId)`).run()
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_game_results_gameId ON game_results(gameId)`).run()

  console.log('[db] SQLite initialized')
}

export function recordGameResult(
  players: Player[],
  finalScores: Record<string, number>,
  gameId: string,
  gameData: Record<string, unknown>
): void {
  const connectedPlayers = players.filter(p => p.connected)
  if (connectedPlayers.length === 0) return

  const winners = determineWinners(connectedPlayers, finalScores, gameId, gameData)

  const insert = db.prepare(`
    INSERT INTO game_results (discordId, username, avatarUrl, gameId, score, won)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertMany = db.transaction(() => {
    for (const player of connectedPlayers) {
      const score = finalScores[player.id] ?? 0
      const won = winners.has(player.id) ? 1 : 0
      insert.run(player.discordId, player.name, player.avatar, gameId, score, won)
    }
  })

  insertMany()
  console.log(`[db] Recorded ${connectedPlayers.length} results for ${gameId}`)
}

function determineWinners(
  players: Player[],
  finalScores: Record<string, number>,
  gameId: string,
  gameData: Record<string, unknown>
): Set<string> {
  const winners = new Set<string>()

  if (gameId === 'undercover') {
    const winningSide = gameData.winner as string | undefined
    if (!winningSide) return winners

    for (const player of players) {
      const role = gameData[`role_${player.id}`] as string | undefined
      if (!role) continue

      if (winningSide === 'civilians' && role === 'civilian') {
        winners.add(player.id)
      } else if (winningSide === 'undercover' && role === 'undercover') {
        winners.add(player.id)
      }
    }
  } else {
    // Score-based games (click-race, horse-race): highest score wins
    let maxScore = -Infinity
    for (const player of players) {
      const score = finalScores[player.id] ?? 0
      if (score > maxScore) maxScore = score
    }
    if (maxScore > -Infinity) {
      for (const player of players) {
        if ((finalScores[player.id] ?? 0) === maxScore) {
          winners.add(player.id)
        }
      }
    }
  }

  return winners
}

export interface LeaderboardEntry {
  discordId: string
  username: string
  avatarUrl: string
  wins: number
  played: number
  winrate: number
}

export function getLeaderboard(gameId?: string): LeaderboardEntry[] {
  const whereClause = gameId ? 'WHERE gameId = ?' : ''
  const params = gameId ? [gameId] : []

  const rows = db.prepare(`
    SELECT
      discordId,
      username,
      avatarUrl,
      SUM(won) as wins,
      COUNT(*) as played
    FROM game_results
    ${whereClause}
    GROUP BY discordId
    ORDER BY wins DESC, played ASC
  `).all(...params) as Array<{
    discordId: string
    username: string
    avatarUrl: string
    wins: number
    played: number
  }>

  return rows.map(row => ({
    ...row,
    winrate: row.played > 0 ? Math.round((row.wins / row.played) * 100) : 0,
  }))
}
