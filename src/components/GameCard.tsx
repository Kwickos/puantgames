import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import type { GameDefinition } from '@/types/game'

export default function GameCard({ game, index, selected }: { game: GameDefinition; index: number; selected?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
    >
      <div
        className={`relative bg-card rounded-[12px] p-[14px] flex flex-col gap-[6px] transition-colors duration-200 ${
          selected
            ? 'border-2 border-accent'
            : 'border border-border-subtle hover:border-border'
        }`}
      >
        {/* Selected checkmark (absolute positioned) */}
        {selected && (
          <div className="absolute top-[12px] right-[14px] w-[20px] h-[20px] rounded-full bg-accent flex items-center justify-center">
            <Check className="w-[12px] h-[12px] text-text-inverted" />
          </div>
        )}

        {/* Header: emoji + name */}
        <div className="flex items-center gap-[8px]">
          <span className="text-[18px]">{game.emoji}</span>
          <span className="font-display text-[14px] font-bold text-text-primary">
            {game.name}
          </span>
        </div>

        {/* Description */}
        <p className="text-[12px] font-medium text-text-secondary font-body leading-relaxed">
          {game.description}
        </p>

        {/* Tag: player count */}
        <div className="flex">
          <span
            className={`text-[10px] font-mono rounded-full px-[8px] py-[3px] ${
              selected
                ? 'bg-accent/15 text-accent'
                : 'bg-elevated text-text-muted'
            }`}
          >
            {game.config.minPlayers}-{game.config.maxPlayers} joueurs
          </span>
        </div>
      </div>
    </motion.div>
  )
}
