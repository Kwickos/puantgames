import type { GameDefinition } from '@/types/game'

class GameRegistry {
  private games: Map<string, GameDefinition> = new Map()

  register(game: GameDefinition) {
    if (this.games.has(game.id)) {
      console.warn(`Game "${game.id}" is already registered. Overwriting.`)
    }
    this.games.set(game.id, game)
  }

  get(id: string): GameDefinition | undefined {
    return this.games.get(id)
  }

  getAll(): GameDefinition[] {
    return Array.from(this.games.values())
  }

  getByTag(tag: string): GameDefinition[] {
    return this.getAll().filter(g => g.tags.includes(tag))
  }
}

export const registry = new GameRegistry()
