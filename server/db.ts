import pg from 'pg'
import type { Player } from '../shared/types.js'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_results (
      id SERIAL PRIMARY KEY,
      discord_id TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      game_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      won INTEGER NOT NULL DEFAULT 0,
      played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_game_results_discord_id ON game_results(discord_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_game_results_game_id ON game_results(game_id)`)

  console.log('[db] PostgreSQL initialized')
}

export async function recordGameResult(
  players: Player[],
  finalScores: Record<string, number>,
  gameId: string,
  gameData: Record<string, unknown>
): Promise<void> {
  const connectedPlayers = players.filter(p => p.connected)
  if (connectedPlayers.length === 0) return

  const winners = determineWinners(connectedPlayers, finalScores, gameId, gameData)

  const values: unknown[] = []
  const placeholders: string[] = []
  let idx = 1

  for (const player of connectedPlayers) {
    const score = finalScores[player.id] ?? 0
    const won = winners.has(player.id) ? 1 : 0
    placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`)
    values.push(player.discordId, player.name, player.avatar, gameId, score, won)
    idx += 6
  }

  await pool.query(
    `INSERT INTO game_results (discord_id, username, avatar_url, game_id, score, won) VALUES ${placeholders.join(', ')}`,
    values
  )

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
  } else if (gameId === 'codenames') {
    const w = gameData.winner as string | undefined
    if (!w || w === 'lost') return winners

    for (const player of players) {
      const team = gameData[`team_${player.id}`] as string | undefined
      if (team === w) winners.add(player.id)
    }
  } else {
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

export async function getLeaderboard(gameId?: string): Promise<LeaderboardEntry[]> {
  const whereClause = gameId ? 'WHERE game_id = $1' : ''
  const params = gameId ? [gameId] : []

  const { rows } = await pool.query(
    `SELECT
      discord_id,
      username,
      avatar_url,
      SUM(won)::int as wins,
      COUNT(*)::int as played
    FROM game_results
    ${whereClause}
    GROUP BY discord_id, username, avatar_url
    ORDER BY wins DESC, played ASC`,
    params
  )

  return rows.map((row: { discord_id: string; username: string; avatar_url: string; wins: number; played: number }) => ({
    discordId: row.discord_id,
    username: row.username,
    avatarUrl: row.avatar_url,
    wins: row.wins,
    played: row.played,
    winrate: row.played > 0 ? Math.round((row.wins / row.played) * 100) : 0,
  }))
}
