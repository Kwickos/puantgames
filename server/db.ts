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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_words (
      id SERIAL PRIMARY KEY,
      game_id TEXT NOT NULL,
      word TEXT NOT NULL,
      word2 TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS banned_users (
      discord_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      reason TEXT,
      banned_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await seedDefaultWords()

  console.log('[db] PostgreSQL initialized')
}

// ─── Default words seed ───

const DEFAULT_CODENAMES_WORDS = [
  'Avion', 'Arbre', 'Banane', 'Ballon', 'Bougie', 'Camion', 'Chapeau', 'Chat',
  'Château', 'Cheval', 'Ciseaux', 'Clé', 'Cochon', 'Couteau', 'Crayon', 'Diamant',
  'Dragon', 'Éléphant', 'Étoile', 'Fantôme', 'Fleur', 'Forêt', 'Fromage', 'Fusée',
  'Gâteau', 'Girafe', 'Glace', 'Guitare', 'Hamster', 'Île', 'Jardin', 'Kangourou',
  'Lapin', 'Lion', 'Loup', 'Lunettes', 'Maison', 'Marteau', 'Miroir', 'Montagne',
  'Mouton', 'Neige', 'Nuage', 'Orange', 'Ours', 'Pain', 'Papillon', 'Parapluie',
  'Perroquet', 'Piano', 'Pierre', 'Pirate', 'Plage', 'Plume', 'Poisson', 'Pomme',
  'Pont', 'Prince', 'Princesse', 'Robot', 'Roi', 'Rose', 'Sable', 'Serpent',
  'Sirène', 'Soleil', 'Souris', 'Tigre', 'Tortue', 'Tour', 'Train', 'Trésor',
  'Vampire', 'Voiture', 'Volcan', 'Zèbre', 'Ancre', 'Bague', 'Bombe', 'Café',
  'Carotte', 'Cerise', 'Cinéma', 'Cirque', 'Clown', 'Coeur', 'Crabe', 'Drapeau',
  'Échelle', 'Éclair', 'Épée', 'Escargot', 'Feu', 'Feuille', 'Flamme', 'Globe',
  'Hélicoptère', 'Hibou', 'Horloge', 'Iceberg', 'Jumelles', 'Jungle', 'Lampe',
  'Licorne', 'Lune', 'Méduse', 'Monstre', 'Ninja', 'Oiseau', 'Panda', 'Parachute',
  'Phare', 'Pingouin', 'Pizza', 'Radar', 'Renard', 'Requin', 'Rivière', 'Sabre',
  'Satellite', 'Sorcier', 'Squelette', 'Tambour', 'Tonnerre', 'Trompette', 'Tulipe',
  'Tunnel', 'Vélo', 'Vague', 'Astronaute', 'Baleine', 'Bouclier', 'Brouillard',
  'Cascade', 'Cathédrale', 'Cheminée', 'Chocolat', 'Cigogne', 'Coffre', 'Colombe',
  'Comète', 'Continent', 'Couronne', 'Cygne', 'Désert', 'Dinosaure', 'Domino',
  'Fontaine', 'Fossile', 'Galaxie', 'Grotte', 'Harmonica', 'Horizon', 'Igloo',
  'Inventeur', 'Joyau', 'Kayak', 'Lanterne', 'Légende', 'Magicien', 'Mammouth',
  'Masque', 'Météore', 'Microscope', 'Momie', 'Moustache', 'Mystère', 'Neptune',
  'Oasis', 'Océan', 'Orchidée', 'Palais', 'Palmier', 'Panthère', 'Paradis',
  'Pélican', 'Pendule', 'Pharaon', 'Phénix', 'Planète', 'Prairie', 'Pyramide',
  'Reine', 'Safari', 'Scarabée', 'Sphinx', 'Statue', 'Temple', 'Tornade',
  'Trophée', 'Viking', 'Volcan',
]

const DEFAULT_UNDERCOVER_PAIRS: [string, string][] = [
  ['Chat', 'Chien'], ['Pizza', 'Burger'], ['Coca-Cola', 'Pepsi'],
  ['Netflix', 'YouTube'], ['Facebook', 'Instagram'], ['Guitare', 'Ukulélé'],
  ['Dentiste', 'Médecin'], ['Avion', 'Hélicoptère'], ['Bus', 'Tramway'],
  ['Soleil', 'Lune'], ['Paris', 'Londres'], ['Chocolat', 'Caramel'],
  ['Football', 'Rugby'], ['Sushi', 'Maki'], ['Piano', 'Orgue'],
  ['Croissant', 'Pain au chocolat'], ['Café', 'Thé'], ['Pomme', 'Poire'],
  ['Cinéma', 'Théâtre'], ['Ski', 'Snowboard'], ['Vélo', 'Trottinette'],
  ['Baleine', 'Dauphin'], ['Aigle', 'Faucon'], ['Chaussette', 'Chaussure'],
  ['Couteau', 'Ciseaux'], ['Écharpe', 'Foulard'], ['Bougie', 'Lampe'],
  ['Rivière', 'Fleuve'], ['Montagne', 'Colline'], ['Crêpe', 'Gaufre'],
  ['Fraise', 'Framboise'], ['Batman', 'Superman'], ['Mario', 'Sonic'],
  ['Camping', 'Glamping'], ['Piscine', 'Plage'], ['Beurre', 'Margarine'],
  ['Tigre', 'Lion'], ['Violon', 'Violoncelle'], ['Glace', 'Sorbet'],
  ['Canapé', 'Fauteuil'],
  ['Karmine Corp', 'Solary'], ['G2', 'Fnatic'], ['Vitality', 'MAD KOI'],
  ['Team Heretics', 'SK Gaming'], ['NAVI', 'GX'], ['Shifters', 'Los Ratones'],
]

async function seedDefaultWords(): Promise<void> {
  const { rows } = await pool.query('SELECT COUNT(*)::int as count FROM custom_words')
  if (rows[0].count > 0) return

  console.log('[db] Seeding default words...')

  // Seed codenames words
  const cnValues: unknown[] = []
  const cnPlaceholders: string[] = []
  let idx = 1
  for (const word of DEFAULT_CODENAMES_WORDS) {
    cnPlaceholders.push(`($${idx}, $${idx + 1})`)
    cnValues.push('codenames', word)
    idx += 2
  }
  await pool.query(
    `INSERT INTO custom_words (game_id, word) VALUES ${cnPlaceholders.join(', ')}`,
    cnValues
  )

  // Seed undercover pairs
  const ucValues: unknown[] = []
  const ucPlaceholders: string[] = []
  idx = 1
  for (const [w1, w2] of DEFAULT_UNDERCOVER_PAIRS) {
    ucPlaceholders.push(`($${idx}, $${idx + 1}, $${idx + 2})`)
    ucValues.push('undercover', w1, w2)
    idx += 3
  }
  await pool.query(
    `INSERT INTO custom_words (game_id, word, word2) VALUES ${ucPlaceholders.join(', ')}`,
    ucValues
  )

  console.log(`[db] Seeded ${DEFAULT_CODENAMES_WORDS.length} codenames words + ${DEFAULT_UNDERCOVER_PAIRS.length} undercover pairs`)
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

// ─── Custom Words ───

export async function getCustomWords(gameId: string): Promise<{ id: number; word: string; word2: string | null }[]> {
  const { rows } = await pool.query(
    'SELECT id, word, word2 FROM custom_words WHERE game_id = $1 ORDER BY id',
    [gameId]
  )
  return rows
}

export async function addCustomWord(gameId: string, word: string, word2?: string): Promise<number> {
  const { rows } = await pool.query(
    'INSERT INTO custom_words (game_id, word, word2) VALUES ($1, $2, $3) RETURNING id',
    [gameId, word, word2 ?? null]
  )
  return rows[0].id
}

export async function deleteCustomWord(id: number): Promise<void> {
  await pool.query('DELETE FROM custom_words WHERE id = $1', [id])
}

// ─── Banned Users ───

export async function getBannedUsers(): Promise<{ discordId: string; username: string; reason: string | null; bannedAt: string }[]> {
  const { rows } = await pool.query('SELECT discord_id, username, reason, banned_at FROM banned_users ORDER BY banned_at DESC')
  return rows.map((r: { discord_id: string; username: string; reason: string | null; banned_at: string }) => ({
    discordId: r.discord_id,
    username: r.username,
    reason: r.reason,
    bannedAt: r.banned_at,
  }))
}

export async function banUser(discordId: string, username: string, reason?: string): Promise<void> {
  await pool.query(
    'INSERT INTO banned_users (discord_id, username, reason) VALUES ($1, $2, $3) ON CONFLICT (discord_id) DO UPDATE SET username = $2, reason = $3',
    [discordId, username, reason ?? null]
  )
}

export async function unbanUser(discordId: string): Promise<void> {
  await pool.query('DELETE FROM banned_users WHERE discord_id = $1', [discordId])
}

export async function isUserBanned(discordId: string): Promise<boolean> {
  const { rows } = await pool.query('SELECT 1 FROM banned_users WHERE discord_id = $1', [discordId])
  return rows.length > 0
}

// ─── Leaderboard management ───

export async function clearLeaderboard(gameId?: string): Promise<void> {
  if (gameId) {
    await pool.query('DELETE FROM game_results WHERE game_id = $1', [gameId])
  } else {
    await pool.query('DELETE FROM game_results')
  }
}
