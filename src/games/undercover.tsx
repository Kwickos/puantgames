import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff, Send, SkipForward } from 'lucide-react'
import { registry } from '@/lib/registry'
import type { GameComponentProps } from '@/types/game'

type Phase = 'describing' | 'voting' | 'result' | 'gameover'

function UndercoverGame({ players, myPlayerId, gameState, updateGameData, endGame }: GameComponentProps) {
  const data = gameState.data
  const phase = data.phase as Phase | undefined
  const eliminated = (data.eliminated as string[]) ?? []
  const descRound = (data.descRound as number) ?? 1
  const winner = data.winner as string | undefined
  const lastEliminated = data.lastEliminated as string | undefined
  const wasTie = data.wasTie as boolean | undefined

  const alivePlayers = players.filter(p => !eliminated.includes(p.id))
  const isAdvancer = alivePlayers[0]?.id === myPlayerId
  const isAlive = !eliminated.includes(myPlayerId)

  const myWord = data[`word_${myPlayerId}`] as string | undefined
  const myVote = data[`vote_${myPlayerId}_${descRound}`] as string | undefined

  const [descInput, setDescInput] = useState('')
  const [wordVisible, setWordVisible] = useState(true)
  const [allPairs, setAllPairs] = useState<[string, string][]>([])
  const [pairsLoaded, setPairsLoaded] = useState(false)

  // Load word pairs from database
  useEffect(() => {
    fetch('/api/words/undercover')
      .then(r => r.json())
      .then((words: { word: string; word2: string | null }[]) => {
        const pairs = words
          .filter(w => w.word2)
          .map(w => [w.word, w.word2!] as [string, string])
        setAllPairs(pairs)
        setPairsLoaded(true)
      })
      .catch(() => setPairsLoaded(true))
  }, [])

  // Initialize game (only first player in list)
  useEffect(() => {
    if (phase || players[0]?.id !== myPlayerId || !pairsLoaded) return

    const ucCount = Math.min((data.undercoverCount as number) ?? 1, Math.floor(players.length / 2))
    const pair = allPairs[Math.floor(Math.random() * allPairs.length)]
    const [civWord, ucWord] = Math.random() > 0.5 ? pair : [pair[1], pair[0]]

    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const undercovers = shuffled.slice(0, ucCount).map(p => p.id)

    const init: Record<string, unknown> = {
      phase: 'describing',
      descRound: 1,
      eliminated: [],
      wordCivilian: civWord,
      wordUndercover: ucWord,
    }

    players.forEach(p => {
      const isUC = undercovers.includes(p.id)
      init[`word_${p.id}`] = isUC ? ucWord : civWord
      init[`role_${p.id}`] = isUC ? 'undercover' : 'civilian'
    })

    updateGameData(init)
  }, [phase, players, myPlayerId, data, updateGameData, pairsLoaded, allPairs])

  // Derive current turn: count how many alive players have described
  const describedPlayers = alivePlayers.filter(p => data[`desc_${p.id}_${descRound}`])
  const currentTurnPlayer = alivePlayers[describedPlayers.length] ?? null
  const isMyTurn = currentTurnPlayer?.id === myPlayerId

  // Describing → Voting (all alive players have described)
  useEffect(() => {
    if (phase !== 'describing' || !isAdvancer) return
    const allDescribed = alivePlayers.every(p => data[`desc_${p.id}_${descRound}`])
    if (allDescribed) {
      updateGameData({ phase: 'voting' })
    }
  }, [phase, isAdvancer, alivePlayers, data, descRound, updateGameData])

  // Voting → Result
  useEffect(() => {
    if (phase !== 'voting' || !isAdvancer) return
    const allVoted = alivePlayers.every(p => data[`vote_${p.id}_${descRound}`])
    if (!allVoted) return

    const voteCounts: Record<string, number> = {}
    alivePlayers.forEach(p => {
      const target = data[`vote_${p.id}_${descRound}`] as string
      if (target) voteCounts[target] = (voteCounts[target] ?? 0) + 1
    })

    const maxVotes = Math.max(...Object.values(voteCounts))
    const topVoted = Object.entries(voteCounts).filter(([, c]) => c === maxVotes).map(([id]) => id)

    if (topVoted.length > 1) {
      // Tie → nobody eliminated
      updateGameData({ phase: 'result', lastEliminated: null, wasTie: true })
    } else {
      const eliminatedId = topVoted[0]
      updateGameData({
        phase: 'result',
        lastEliminated: eliminatedId,
        wasTie: false,
        eliminated: [...eliminated, eliminatedId],
      })
    }
  }, [phase, isAdvancer, alivePlayers, data, descRound, eliminated, updateGameData])

  const submitDescription = () => {
    const text = descInput.trim()
    if (!text || !isAlive) return
    updateGameData({ [`desc_${myPlayerId}_${descRound}`]: text })
    setDescInput('')
  }

  const submitVote = (targetId: string) => {
    if (myVote || !isAlive || targetId === myPlayerId) return
    updateGameData({ [`vote_${myPlayerId}_${descRound}`]: targetId })
  }

  const nextRound = () => {
    if (!isAdvancer) return

    // Recalculate alive players after this round's elimination
    const newEliminated = (data.eliminated as string[]) ?? []
    const newAlive = players.filter(p => !newEliminated.includes(p.id))
    const ucAlive = newAlive.filter(p => data[`role_${p.id}`] === 'undercover')
    const civAlive = newAlive.filter(p => data[`role_${p.id}`] === 'civilian')

    if (ucAlive.length === 0) {
      updateGameData({ phase: 'gameover', winner: 'civilians' })
    } else if (ucAlive.length >= civAlive.length) {
      updateGameData({ phase: 'gameover', winner: 'undercover' })
    } else {
      updateGameData({ phase: 'describing', descRound: descRound + 1, wasTie: false, lastEliminated: null })
    }
  }

  const finishGame = () => {
    endGame()
  }

  // ──────────── Rendering ────────────

  if (!phase) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Préparation de la partie...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Word card */}
      {myWord && phase !== 'gameover' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neon-purple/5 border border-neon-purple/20 rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-text-muted mb-1">
              {isAlive ? 'Ton mot secret' : 'Tu es éliminé — ton mot était'}
            </p>
            <p className={`font-display text-xl tracking-wide ${wordVisible ? 'text-neon-purple' : 'blur-md text-neon-purple select-none'}`}>
              {myWord}
            </p>
          </div>
          <button
            onClick={() => setWordVisible(v => !v)}
            className="text-text-muted hover:text-text-secondary transition-colors p-2"
          >
            {wordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </motion.div>
      )}

      {/* Player columns — describing & voting */}
      {(phase === 'describing' || phase === 'voting') && (
        <div className="space-y-4">
          <h3 className="font-display text-lg tracking-wide text-center">
            TOUR {descRound} — {phase === 'describing' ? 'INDICES' : 'VOTE'}
          </h3>

          {phase === 'voting' && isAlive && !myVote && (
            <p className="text-center text-neon-pink text-sm animate-pulse">
              Clique sur un joueur suspect pour voter
            </p>
          )}

          <div className="overflow-x-auto -mx-6 px-6 pb-1">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${alivePlayers.length}, minmax(80px, 1fr))` }}
            >
              {alivePlayers.map((p, colIdx) => {
                const isMe = p.id === myPlayerId
                const isCurrentTurn = phase === 'describing' && currentTurnPlayer?.id === p.id
                const canVote = phase === 'voting' && isAlive && !myVote && !isMe
                const wasVotedByMe = myVote === p.id
                const hasVoted = !!data[`vote_${p.id}_${descRound}`]
                const hasDescribed = !!data[`desc_${p.id}_${descRound}`]

                // Collect descriptions from all rounds
                const descriptions: { round: number; text: string }[] = []
                for (let r = 1; r <= descRound; r++) {
                  const desc = data[`desc_${p.id}_${r}`] as string
                  if (desc) descriptions.push({ round: r, text: desc })
                }

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: colIdx * 0.05 }}
                    onClick={() => canVote && submitVote(p.id)}
                    className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${
                      wasVotedByMe
                        ? 'bg-neon-pink/10 border-neon-pink/40 ring-2 ring-neon-pink/20'
                        : isCurrentTurn
                          ? 'bg-neon-purple/10 border-neon-purple/40'
                          : canVote
                            ? 'bg-surface-light border-border/30 hover:border-neon-pink/40 hover:bg-neon-pink/5 cursor-pointer'
                            : 'bg-surface-light border-border/30'
                    }`}
                  >
                    {/* Player header */}
                    <img src={p.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <p className={`text-xs font-medium truncate max-w-full ${
                      isMe ? 'text-neon-purple' : 'text-text-secondary'
                    }`}>
                      {isMe ? 'Toi' : p.name}
                    </p>

                    {/* Descriptions stack */}
                    <div className="w-full space-y-1.5 flex-1">
                      {descriptions.map(d => (
                        <div
                          key={d.round}
                          className="bg-surface/60 rounded-lg px-2 py-1.5"
                        >
                          <p className="text-xs text-text-primary text-center break-words">
                            {d.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Status indicator */}
                    {phase === 'describing' && (
                      isCurrentTurn ? (
                        <div className="w-4 h-4 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                      ) : hasDescribed ? (
                        <span className="text-[10px] text-neon-purple">✓</span>
                      ) : (
                        <span className="text-[10px] text-text-muted">en attente</span>
                      )
                    )}
                    {phase === 'voting' && (
                      hasVoted ? (
                        <span className="text-[10px] text-neon-pink">✓ a voté</span>
                      ) : (
                        <span className="text-[10px] text-text-muted">...</span>
                      )
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Input / status below the grid */}
          {phase === 'describing' && isMyTurn && isAlive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-neon-purple text-sm font-medium text-center">C'est ton tour !</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitDescription()}
                  placeholder="Un indice en quelques mots..."
                  maxLength={60}
                  autoFocus
                  className="flex-1 bg-surface-light border border-neon-purple/30 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-purple/50 transition-colors"
                />
                <button
                  onClick={submitDescription}
                  disabled={!descInput.trim()}
                  className="bg-neon-purple/10 border border-neon-purple/20 text-neon-purple rounded-xl px-4 py-3 hover:bg-neon-purple/20 transition-colors disabled:opacity-30"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'describing' && !isMyTurn && currentTurnPlayer && (
            <p className="text-center text-text-muted text-sm">
              C'est au tour de <img src={currentTurnPlayer.avatar} alt="" className="w-5 h-5 rounded-full inline align-middle" /> {currentTurnPlayer.name}
            </p>
          )}

          {phase === 'voting' && isAlive && myVote && (
            <p className="text-center text-neon-purple text-sm">
              A voté ! En attente des autres...
            </p>
          )}
          {phase === 'voting' && !isAlive && (
            <p className="text-center text-text-muted text-sm">
              Tu es éliminé. En attente des votes...
            </p>
          )}
        </div>
      )}

      {/* Phase: Result */}
      {phase === 'result' && (
        <div className="space-y-5">
          <h3 className="font-display text-lg tracking-wide text-center">
            RÉSULTAT DU VOTE
          </h3>

          {/* Vote breakdown */}
          <div className="space-y-2">
            {alivePlayers.map(p => {
              // Count votes received (before this elimination, so use alivePlayers pre-elimination)
              const playersWhoVoted = players.filter(
                pl => !eliminated.filter(e => e !== lastEliminated).includes(pl.id)
              )
              const votesReceived = playersWhoVoted.filter(
                v => data[`vote_${v.id}_${descRound}`] === p.id
              ).length

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl p-3 ${
                    p.id === lastEliminated
                      ? 'bg-neon-pink/10 border border-neon-pink/30'
                      : 'bg-surface-light border border-border/30'
                  }`}
                >
                  <img src={p.avatar} alt="" className="w-7 h-7 rounded-full" />
                  <span className="text-sm font-medium flex-1">{p.id === myPlayerId ? 'Toi' : p.name}</span>
                  <span className={`text-sm font-display ${
                    p.id === lastEliminated ? 'text-neon-pink' : 'text-text-muted'
                  }`}>
                    {votesReceived} vote{votesReceived !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Elimination announcement */}
          {wasTie ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-3"
            >
              <p className="font-display text-xl text-neon-yellow">Égalité !</p>
              <p className="text-text-muted text-sm mt-1">Personne n'est éliminé ce tour.</p>
            </motion.div>
          ) : lastEliminated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-3"
            >
              {(() => {
                const elim = players.find(p => p.id === lastEliminated)
                const role = data[`role_${lastEliminated}`] as string
                return (
                  <>
                    <p className="text-lg">
                      <img src={elim?.avatar} alt="" className="w-7 h-7 rounded-full inline align-middle" /> <span className="font-display text-xl">{elim?.name}</span> est éliminé !
                    </p>
                    <p className={`font-display text-lg mt-2 ${
                      role === 'undercover' ? 'text-neon-pink' : 'text-neon-blue'
                    }`}>
                      C'était un {role === 'undercover' ? 'UNDERCOVER 🕵️' : 'CIVIL 👤'}
                    </p>
                  </>
                )
              })()}
            </motion.div>
          ) : null}

          {/* Continue button (advancer only) */}
          {isAdvancer && (
            <div className="text-center">
              <button
                onClick={nextRound}
                className="flex items-center gap-2 mx-auto bg-neon-purple/10 border border-neon-purple/20 text-neon-purple rounded-xl px-6 py-3 font-medium hover:bg-neon-purple/20 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Continuer
              </button>
            </div>
          )}
          {!isAdvancer && (
            <p className="text-center text-text-muted text-sm">
              En attente de {alivePlayers[0]?.name}...
            </p>
          )}
        </div>
      )}

      {/* Phase: Game Over */}
      {phase === 'gameover' && (
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <p className="font-display text-2xl">
              {winner === 'civilians' ? (
                <span className="text-neon-blue">Les CIVILS ont gagné ! 🎉</span>
              ) : (
                <span className="text-neon-pink">L'UNDERCOVER a gagné ! 🕵️</span>
              )}
            </p>
          </motion.div>

          {/* Reveal words */}
          <div className="bg-surface-light border border-border/30 rounded-xl p-4 text-center space-y-2">
            <p className="text-text-muted text-sm">Les mots étaient :</p>
            <p className="text-lg">
              Civil : <span className="font-display text-neon-blue">{data.wordCivilian as string}</span>
              {' '} — {' '}
              Undercover : <span className="font-display text-neon-pink">{data.wordUndercover as string}</span>
            </p>
          </div>

          {/* Reveal all roles */}
          <div className="space-y-2">
            {players.map((p, i) => {
              const role = data[`role_${p.id}`] as string
              const isUC = role === 'undercover'
              const wasElim = eliminated.includes(p.id)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-3 rounded-xl p-3 border ${
                    isUC
                      ? 'bg-neon-pink/10 border-neon-pink/30'
                      : 'bg-neon-blue/5 border-neon-blue/20'
                  }`}
                >
                  <img src={p.avatar} alt="" className="w-7 h-7 rounded-full" />
                  <span className={`text-sm font-medium flex-1 ${wasElim && !isUC ? 'line-through text-text-muted' : ''}`}>
                    {p.id === myPlayerId ? 'Toi' : p.name}
                  </span>
                  <span className={`text-xs font-display px-2 py-0.5 rounded-md ${
                    isUC
                      ? 'bg-neon-pink/15 text-neon-pink'
                      : 'bg-neon-blue/10 text-neon-blue'
                  }`}>
                    {isUC ? '🕵️ Undercover' : '👤 Civil'}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {/* Finish button */}
          <div className="text-center">
            <button
              onClick={finishGame}
              className="bg-neon-purple/10 border border-neon-purple/20 text-neon-purple rounded-xl px-6 py-3 font-medium hover:bg-neon-purple/20 transition-colors"
            >
              Terminer
            </button>
          </div>
        </div>
      )}

      {/* Eliminated players sidebar */}
      {eliminated.length > 0 && phase !== 'gameover' && (
        <div className="border-t border-border/20 pt-4">
          <p className="text-xs text-text-muted mb-2">Éliminés :</p>
          <div className="flex flex-wrap gap-2">
            {eliminated.map(id => {
              const p = players.find(pl => pl.id === id)
              const role = data[`role_${id}`] as string
              if (!p) return null
              return (
                <span
                  key={id}
                  className={`text-xs px-2 py-1 rounded-md ${
                    role === 'undercover'
                      ? 'bg-neon-pink/10 text-neon-pink'
                      : 'bg-surface-light text-text-muted'
                  }`}
                >
                  <img src={p.avatar} alt="" className="w-5 h-5 rounded-full inline align-middle" /> {p.name} {role === 'undercover' ? '🕵️' : '👤'}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

registry.register({
  id: 'undercover',
  name: 'UNDERCOVER',
  description: 'Trouve qui a le mot différent ! Chaque tour, donne un indice et vote pour éliminer le suspect.',
  emoji: '🕵️',
  color: 'neon-purple',
  config: {
    minPlayers: 4,
    maxPlayers: 8,
  },
  tags: ['social', 'deduction'],
  settings: [
    {
      id: 'undercoverCount',
      label: 'Undercovers',
      options: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
      ],
      default: 1,
    },
  ],
  component: UndercoverGame,
})
