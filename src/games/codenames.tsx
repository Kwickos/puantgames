import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Send, SkipForward, Skull, Eye, EyeOff } from 'lucide-react'
import { registry } from '@/lib/registry'
import type { GameComponentProps } from '@/types/game'

const WORDS = [
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

type Phase = 'setup' | 'clue' | 'guessing' | 'gameover'
type CardColor = 'blue' | 'red' | 'neutral' | 'assassin' | 'team'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function CodenamesGame({ players, myPlayerId, gameState, updateGameData, endGame }: GameComponentProps) {
  const data = gameState.data
  const phase = data.phase as Phase | undefined
  const mode = (data.mode as number) ?? 0
  const isClassic = mode === 0

  // Grid
  const words = data.words as string[] | undefined
  const colors = data.colors as string[] | undefined
  const revealed = data.revealed as boolean[] | undefined

  // Classic mode
  const currentTeam = data.currentTeam as 'blue' | 'red' | undefined
  const blueRemaining = data.blueRemaining as number | undefined
  const redRemaining = data.redRemaining as number | undefined

  // Simplified mode
  const teamRemaining = data.teamRemaining as number | undefined
  const turnsLeft = data.turnsLeft as number | undefined

  // Clue
  const clueWord = data.clueWord as string | undefined
  const clueNumber = data.clueNumber as number | undefined
  const guessesRemaining = data.guessesRemaining as number | undefined

  // End
  const winner = data.winner as string | undefined
  const winReason = data.winReason as string | undefined

  // My role
  const myRole = data[`role_${myPlayerId}`] as string | undefined
  const myTeam = data[`team_${myPlayerId}`] as string | undefined

  const isSpymaster = myRole?.startsWith('spymaster')
  const advancer = players[0]?.id

  const [clueInput, setClueInput] = useState('')
  const [clueNumInput, setClueNumInput] = useState(1)
  const [spymasterView, setSpymasterView] = useState(true)

  // Initialize game
  useEffect(() => {
    if (phase || players[0]?.id !== myPlayerId) return

    const settings = gameState.data
    let gameMode = (settings.mode as number) ?? 0
    if (gameMode === 0 && players.length < 4) gameMode = 1

    // Pick 25 random words
    const picked = shuffle(WORDS).slice(0, 25)

    // Generate colors
    let cardColors: CardColor[]
    let firstTeam: 'blue' | 'red' = Math.random() > 0.5 ? 'blue' : 'red'
    const secondTeam = firstTeam === 'blue' ? 'red' : 'blue'

    if (gameMode === 0) {
      // Classic: 9 first, 8 second, 7 neutral, 1 assassin
      cardColors = [
        ...Array(9).fill(firstTeam),
        ...Array(8).fill(secondTeam),
        ...Array(7).fill('neutral' as CardColor),
        'assassin' as CardColor,
      ]
    } else {
      // Simplified: 8 team, 16 neutral, 1 assassin
      cardColors = [
        ...Array(8).fill('team' as CardColor),
        ...Array(16).fill('neutral' as CardColor),
        'assassin' as CardColor,
      ]
    }
    cardColors = shuffle(cardColors)

    const init: Record<string, unknown> = {
      phase: 'setup',
      mode: gameMode,
      words: picked,
      colors: cardColors,
      revealed: Array(25).fill(false),
    }

    if (gameMode === 0) {
      // Classic: assign teams
      const shuffledPlayers = shuffle(players.map(p => p.id))
      const half = Math.ceil(shuffledPlayers.length / 2)
      const teamBlue = shuffledPlayers.slice(0, half)
      const teamRed = shuffledPlayers.slice(half)

      const spymasterBlue = teamBlue[0]
      const spymasterRed = teamRed[0]

      init.teamA = teamBlue
      init.teamB = teamRed
      init.spymasterA = spymasterBlue
      init.spymasterB = spymasterRed
      init.currentTeam = firstTeam
      init.firstTeam = firstTeam
      init.blueRemaining = firstTeam === 'blue' ? 9 : 8
      init.redRemaining = firstTeam === 'red' ? 9 : 8

      teamBlue.forEach(id => {
        init[`team_${id}`] = 'blue'
        init[`role_${id}`] = id === spymasterBlue ? 'spymaster_blue' : 'guesser_blue'
      })
      teamRed.forEach(id => {
        init[`team_${id}`] = 'red'
        init[`role_${id}`] = id === spymasterRed ? 'spymaster_red' : 'guesser_red'
      })
    } else {
      // Simplified: one spymaster, rest are guessers
      const shuffledPlayers = shuffle(players.map(p => p.id))
      const spymaster = shuffledPlayers[0]

      init.spymaster = spymaster
      init.teamRemaining = 8
      init.turnsLeft = 9
      init.maxTurns = 9

      players.forEach(p => {
        init[`team_${p.id}`] = 'team'
        init[`role_${p.id}`] = p.id === spymaster ? 'spymaster' : 'guesser'
      })
    }

    updateGameData(init)
  }, [phase, players, myPlayerId, gameState.data, updateGameData])

  const startGame = () => {
    if (players[0]?.id !== myPlayerId) return
    updateGameData({ phase: 'clue' })
  }

  const submitClue = () => {
    const word = clueInput.trim()
    if (!word || clueNumInput < 0) return

    const maxGuesses = clueNumInput === 0 ? 25 : clueNumInput + 1

    updateGameData({
      clueWord: word,
      clueNumber: clueNumInput,
      guessesRemaining: maxGuesses,
      guessesUsed: 0,
      phase: 'guessing',
    })
    setClueInput('')
    setClueNumInput(1)
  }

  const revealCard = (index: number) => {
    if (phase !== 'guessing' || !colors || !revealed || revealed[index]) return
    if (isSpymaster) return
    if (guessesRemaining !== undefined && guessesRemaining <= 0) return

    // Check it's my team's turn
    if (isClassic && myTeam !== currentTeam) return
    if (!isClassic && myRole === 'spymaster') return

    const cardColor = colors[index] as CardColor
    const newRevealed = [...revealed]
    newRevealed[index] = true

    const update: Record<string, unknown> = {
      revealed: newRevealed,
      guessesUsed: ((data.guessesUsed as number) ?? 0) + 1,
    }

    if (isClassic) {
      // Classic mode logic
      let newBlue = blueRemaining ?? 0
      let newRed = redRemaining ?? 0

      if (cardColor === 'blue') newBlue--
      if (cardColor === 'red') newRed--

      update.blueRemaining = newBlue
      update.redRemaining = newRed

      if (cardColor === 'assassin') {
        const otherTeam = currentTeam === 'blue' ? 'red' : 'blue'
        update.phase = 'gameover'
        update.winner = otherTeam
        update.winReason = 'assassin'
      } else if (newBlue === 0) {
        update.phase = 'gameover'
        update.winner = 'blue'
        update.winReason = 'all_found'
      } else if (newRed === 0) {
        update.phase = 'gameover'
        update.winner = 'red'
        update.winReason = 'all_found'
      } else if (cardColor !== currentTeam) {
        // Wrong color → end turn
        update.phase = 'clue'
        update.currentTeam = currentTeam === 'blue' ? 'red' : 'blue'
        update.clueWord = null
        update.clueNumber = null
        update.guessesRemaining = null
      } else {
        // Correct guess
        const remaining = (guessesRemaining ?? 1) - 1
        update.guessesRemaining = remaining
        if (remaining <= 0) {
          // Used all guesses → end turn
          update.phase = 'clue'
          update.currentTeam = currentTeam === 'blue' ? 'red' : 'blue'
          update.clueWord = null
          update.clueNumber = null
          update.guessesRemaining = null
        }
      }
    } else {
      // Simplified mode logic
      let newTeamRemaining = teamRemaining ?? 0
      let newTurnsLeft = turnsLeft ?? 0

      if (cardColor === 'team') {
        newTeamRemaining--
        update.teamRemaining = newTeamRemaining

        if (newTeamRemaining === 0) {
          update.phase = 'gameover'
          update.winner = 'team'
          update.winReason = 'all_found'
        } else {
          const remaining = (guessesRemaining ?? 1) - 1
          update.guessesRemaining = remaining
          if (remaining <= 0) {
            newTurnsLeft--
            update.turnsLeft = newTurnsLeft
            if (newTurnsLeft <= 0) {
              update.phase = 'gameover'
              update.winner = 'lost'
              update.winReason = 'no_turns'
            } else {
              update.phase = 'clue'
              update.clueWord = null
              update.clueNumber = null
              update.guessesRemaining = null
            }
          }
        }
      } else if (cardColor === 'assassin') {
        update.phase = 'gameover'
        update.winner = 'lost'
        update.winReason = 'assassin'
      } else {
        // Neutral → end turn
        newTurnsLeft--
        update.turnsLeft = newTurnsLeft
        if (newTurnsLeft <= 0) {
          update.phase = 'gameover'
          update.winner = 'lost'
          update.winReason = 'no_turns'
        } else {
          update.phase = 'clue'
          update.clueWord = null
          update.clueNumber = null
          update.guessesRemaining = null
        }
      }
    }

    updateGameData(update)
  }

  const endTurn = () => {
    if (phase !== 'guessing') return

    if (isClassic) {
      updateGameData({
        phase: 'clue',
        currentTeam: currentTeam === 'blue' ? 'red' : 'blue',
        clueWord: null,
        clueNumber: null,
        guessesRemaining: null,
      })
    } else {
      const newTurnsLeft = (turnsLeft ?? 1) - 1
      if (newTurnsLeft <= 0) {
        updateGameData({
          phase: 'gameover',
          winner: 'lost',
          winReason: 'no_turns',
        })
      } else {
        updateGameData({
          phase: 'clue',
          turnsLeft: newTurnsLeft,
          clueWord: null,
          clueNumber: null,
          guessesRemaining: null,
        })
      }
    }
  }

  const finishGame = () => {
    endGame()
  }

  // Helpers
  const getPlayerName = (id: string) => {
    if (id === myPlayerId) return 'Toi'
    return players.find(p => p.id === id)?.name ?? '?'
  }

  const isMyTurnToClue = () => {
    if (phase !== 'clue') return false
    if (isClassic) {
      if (currentTeam === 'blue') return myRole === 'spymaster_blue'
      if (currentTeam === 'red') return myRole === 'spymaster_red'
    } else {
      return myRole === 'spymaster'
    }
    return false
  }

  const canIGuess = () => {
    if (phase !== 'guessing') return false
    if (isSpymaster) return false
    if (isClassic) return myTeam === currentTeam
    return true
  }

  const getCurrentSpymasterName = () => {
    if (isClassic) {
      const smId = currentTeam === 'blue' ? data.spymasterA : data.spymasterB
      return getPlayerName(smId as string)
    }
    return getPlayerName(data.spymaster as string)
  }

  const getMaxClueNumber = () => {
    if (isClassic) {
      return currentTeam === 'blue' ? (blueRemaining ?? 0) : (redRemaining ?? 0)
    }
    return teamRemaining ?? 0
  }

  // ──────── Card color helpers ────────
  const getCardBg = (index: number) => {
    if (!colors || !revealed) return 'bg-surface-light'
    if (revealed[index]) {
      const c = colors[index]
      if (c === 'blue') return 'bg-neon-blue/20 border-neon-blue/40'
      if (c === 'red') return 'bg-neon-pink/20 border-neon-pink/40'
      if (c === 'team') return 'bg-neon-blue/20 border-neon-blue/40'
      if (c === 'assassin') return 'bg-white/10 border-white/30'
      return 'bg-surface-light/50 border-border/20'
    }
    // Spymaster sees borders
    if (isSpymaster && spymasterView) {
      const c = colors[index]
      if (c === 'blue') return 'bg-surface-light border-neon-blue/30'
      if (c === 'red') return 'bg-surface-light border-neon-pink/30'
      if (c === 'team') return 'bg-surface-light border-neon-blue/30'
      if (c === 'assassin') return 'bg-surface-light border-white/30'
      return 'bg-surface-light border-border/20'
    }
    return 'bg-surface-light border-border/20 hover:border-border/50'
  }

  const getCardTextColor = (index: number) => {
    if (!colors || !revealed) return 'text-text-primary'
    if (revealed[index]) {
      const c = colors[index]
      if (c === 'blue' || c === 'team') return 'text-neon-blue'
      if (c === 'red') return 'text-neon-pink'
      if (c === 'assassin') return 'text-white'
      return 'text-text-muted line-through'
    }
    return 'text-text-primary'
  }

  // ──────── Loading ────────
  if (!phase) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Préparation de la partie...</p>
      </div>
    )
  }

  // ──────── Setup Phase ────────
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <h3 className="font-display text-lg tracking-wide text-center">
          {isClassic ? 'ÉQUIPES' : 'RÔLES'}
        </h3>

        {isClassic ? (
          <div className="grid grid-cols-2 gap-4">
            {(['blue', 'red'] as const).map(team => {
              const teamIds = (team === 'blue' ? data.teamA : data.teamB) as string[] | undefined
              const smId = (team === 'blue' ? data.spymasterA : data.spymasterB) as string | undefined
              const colorClass = team === 'blue' ? 'neon-blue' : 'neon-pink'
              return (
                <div key={team} className={`rounded-xl border border-${colorClass}/20 bg-${colorClass}/5 p-4 space-y-3`}>
                  <h4 className={`font-display text-sm tracking-wide text-${colorClass} text-center`}>
                    {team === 'blue' ? '🔵 BLEU' : '🔴 ROUGE'}
                  </h4>
                  <div className="space-y-2">
                    {teamIds?.map(id => {
                      const p = players.find(pl => pl.id === id)
                      if (!p) return null
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <img src={p.avatar} alt="" className="w-6 h-6 rounded-full" />
                          <span className="text-sm text-text-primary flex-1 truncate">
                            {getPlayerName(id)}
                          </span>
                          {id === smId && (
                            <span className={`text-[10px] font-display px-1.5 py-0.5 rounded bg-${colorClass}/15 text-${colorClass}`}>
                              ESPION
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {players.map(p => {
              const role = data[`role_${p.id}`] as string
              const isSm = role === 'spymaster'
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl p-3 border ${
                    isSm ? 'bg-neon-blue/10 border-neon-blue/30' : 'bg-surface-light border-border/30'
                  }`}
                >
                  <img src={p.avatar} alt="" className="w-7 h-7 rounded-full" />
                  <span className="text-sm font-medium flex-1">{getPlayerName(p.id)}</span>
                  <span className={`text-xs font-display px-2 py-0.5 rounded-md ${
                    isSm ? 'bg-neon-blue/15 text-neon-blue' : 'bg-surface-light text-text-muted'
                  }`}>
                    {isSm ? '🔍 Maître-espion' : '🕵️ Devineur'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {players[0]?.id === myPlayerId ? (
          <div className="text-center">
            <button
              onClick={startGame}
              className="bg-neon-blue/10 border border-neon-blue/20 text-neon-blue rounded-xl px-6 py-3 font-medium hover:bg-neon-blue/20 transition-colors"
            >
              Commencer
            </button>
          </div>
        ) : (
          <p className="text-center text-text-muted text-sm">
            En attente de {players[0]?.name}...
          </p>
        )}
      </div>
    )
  }

  // ──────── Main game (clue / guessing / gameover) ────────
  return (
    <div className="space-y-4">
      {/* Score bar */}
      <div className="flex items-center justify-between gap-4">
        {isClassic ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-neon-blue">{blueRemaining}</span>
              <span className="text-xs text-text-muted">🔵 restants</span>
            </div>
            <div className="flex-1 text-center">
              {phase === 'guessing' && clueWord && (
                <div>
                  <span className="font-display text-base tracking-wide text-text-primary">
                    {clueWord}
                  </span>
                  <span className="text-text-muted text-sm ml-2">({clueNumber})</span>
                </div>
              )}
              {phase === 'clue' && (
                <span className={`text-sm font-medium ${currentTeam === 'blue' ? 'text-neon-blue' : 'text-neon-pink'}`}>
                  Tour {currentTeam === 'blue' ? '🔵 Bleu' : '🔴 Rouge'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">🔴 restants</span>
              <span className="font-display text-lg text-neon-pink">{redRemaining}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-neon-blue">{teamRemaining}</span>
              <span className="text-xs text-text-muted">mots restants</span>
            </div>
            <div className="flex-1 text-center">
              {phase === 'guessing' && clueWord && (
                <div>
                  <span className="font-display text-base tracking-wide text-text-primary">
                    {clueWord}
                  </span>
                  <span className="text-text-muted text-sm ml-2">({clueNumber})</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">tours restants</span>
              <span className="font-display text-lg text-neon-pink">{turnsLeft}</span>
            </div>
          </>
        )}
      </div>

      {/* Spymaster toggle */}
      {isSpymaster && phase !== 'gameover' && (
        <div className="flex justify-center">
          <button
            onClick={() => setSpymasterView(v => !v)}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors px-3 py-1.5 rounded-lg bg-surface-light border border-border/30"
          >
            {spymasterView ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {spymasterView ? 'Masquer les couleurs' : 'Voir les couleurs'}
          </button>
        </div>
      )}

      {/* Grid 5x5 */}
      {words && (
        <div className="grid grid-cols-5 gap-1.5">
          {words.map((word, i) => {
            const isRevealed = revealed?.[i] ?? false
            const clickable = canIGuess() && !isRevealed && phase === 'guessing'
            const cardColor = colors?.[i] as CardColor | undefined

            return (
              <motion.button
                key={i}
                onClick={() => clickable && revealCard(i)}
                disabled={!clickable}
                whileTap={clickable ? { scale: 0.95 } : undefined}
                className={`relative rounded-lg border p-1.5 sm:p-2 text-center transition-all min-h-[3rem] sm:min-h-[3.5rem] flex items-center justify-center ${
                  getCardBg(i)
                } ${clickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              >
                <span className={`text-[10px] sm:text-xs font-medium leading-tight break-words ${getCardTextColor(i)}`}>
                  {isRevealed && cardColor === 'assassin' && '💀 '}
                  {word}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Clue input (spymaster) */}
      {phase === 'clue' && isMyTurnToClue() && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-neon-blue text-sm font-medium text-center">
            Donne un indice à ton équipe !
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={clueInput}
              onChange={e => setClueInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && clueInput.trim() && submitClue()}
              placeholder="Un seul mot..."
              maxLength={30}
              autoFocus
              className="flex-1 bg-surface-light border border-neon-blue/30 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-blue/50 transition-colors"
            />
            <button
              onClick={submitClue}
              disabled={!clueInput.trim()}
              className="bg-neon-blue/10 border border-neon-blue/20 text-neon-blue rounded-xl px-4 py-3 hover:bg-neon-blue/20 transition-colors disabled:opacity-30"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {/* Number pills */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: Math.min(getMaxClueNumber() + 1, 10) }, (_, n) => (
              <button
                key={n}
                onClick={() => setClueNumInput(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  clueNumInput === n
                    ? 'bg-neon-blue/20 border border-neon-blue/40 text-neon-blue'
                    : 'bg-surface-light border border-border/30 text-text-secondary hover:border-border/60'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-text-muted text-xs text-center">
            0 = indice sans limite de réponses
          </p>
        </motion.div>
      )}

      {/* Waiting for clue */}
      {phase === 'clue' && !isMyTurnToClue() && (
        <p className="text-center text-text-muted text-sm">
          {getCurrentSpymasterName()} réfléchit à un indice...
        </p>
      )}

      {/* Guessing phase info */}
      {phase === 'guessing' && (
        <div className="space-y-2">
          {canIGuess() && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neon-blue">
                Clique sur un mot ! ({guessesRemaining} essai{(guessesRemaining ?? 0) > 1 ? 's' : ''} restant{(guessesRemaining ?? 0) > 1 ? 's' : ''})
              </p>
              <button
                onClick={endTurn}
                className="flex items-center gap-1.5 text-xs bg-surface-light border border-border/30 text-text-secondary rounded-lg px-3 py-1.5 hover:border-border/60 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Fin du tour
              </button>
            </div>
          )}
          {isSpymaster && phase === 'guessing' && (
            <p className="text-center text-text-muted text-sm">
              Ton équipe devine... ({guessesRemaining} essai{(guessesRemaining ?? 0) > 1 ? 's' : ''} restant{(guessesRemaining ?? 0) > 1 ? 's' : ''})
            </p>
          )}
          {!canIGuess() && !isSpymaster && isClassic && (
            <p className="text-center text-text-muted text-sm">
              C'est au tour de l'équipe {currentTeam === 'blue' ? '🔵 Bleu' : '🔴 Rouge'}...
            </p>
          )}
        </div>
      )}

      {/* Game Over */}
      {phase === 'gameover' && (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3"
          >
            {winner === 'lost' ? (
              <>
                <Skull className="w-10 h-10 text-text-muted mx-auto mb-2" />
                <p className="font-display text-2xl text-neon-pink">Perdu !</p>
                <p className="text-text-muted text-sm mt-1">
                  {winReason === 'assassin' ? "L'assassin a été révélé !" : 'Plus de tours !'}
                </p>
              </>
            ) : winner === 'blue' ? (
              <>
                <p className="font-display text-2xl text-neon-blue">🔵 L'équipe Bleu gagne !</p>
                <p className="text-text-muted text-sm mt-1">
                  {winReason === 'assassin' ? "L'équipe Rouge a touché l'assassin !" : 'Tous les mots bleus trouvés !'}
                </p>
              </>
            ) : winner === 'red' ? (
              <>
                <p className="font-display text-2xl text-neon-pink">🔴 L'équipe Rouge gagne !</p>
                <p className="text-text-muted text-sm mt-1">
                  {winReason === 'assassin' ? "L'équipe Bleu a touché l'assassin !" : 'Tous les mots rouges trouvés !'}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl text-neon-blue">Victoire ! 🎉</p>
                <p className="text-text-muted text-sm mt-1">Tous les mots trouvés !</p>
              </>
            )}
          </motion.div>

          {/* Finish button */}
          <div className="text-center">
            <button
              onClick={finishGame}
              className="bg-neon-blue/10 border border-neon-blue/20 text-neon-blue rounded-xl px-6 py-3 font-medium hover:bg-neon-blue/20 transition-colors"
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      {/* Role reminder */}
      {phase !== 'gameover' && (
        <div className="border-t border-border/20 pt-3">
          <p className="text-xs text-text-muted text-center">
            {isSpymaster ? '🔍 Tu es Maître-espion' : '🕵️ Tu es Devineur'}
            {isClassic && myTeam && (
              <span className={myTeam === 'blue' ? ' text-neon-blue' : ' text-neon-pink'}>
                {' '}— Équipe {myTeam === 'blue' ? '🔵 Bleu' : '🔴 Rouge'}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

registry.register({
  id: 'codenames',
  name: 'CODENAMES',
  description: 'Donne des indices pour faire deviner les mots de ton équipe. Évite l\'assassin !',
  emoji: '🔍',
  color: 'neon-blue',
  config: {
    minPlayers: 4,
    maxPlayers: 8,
  },
  tags: ['social', 'deduction'],
  settings: [
    {
      id: 'mode',
      label: 'Mode',
      options: [
        { label: 'Classique', value: 0 },
        { label: 'Simplifié', value: 1 },
      ],
      default: 0,
    },
  ],
  component: CodenamesGame,
})
