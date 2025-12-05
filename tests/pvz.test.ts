import { describe, it, expect } from 'vitest'
import { createPvzGame, placePlant, tick } from '../src/game/pvz'

describe('pvz basic', () => {
  it('place plant and shoot zombie', () => {
    let g = createPvzGame(1, 5)
    g = placePlant(g, 0, 0)
    g.waveTotal = 1
    g.waveSpawned = 0
    for (let i = 0; i < 25; i++) {
      g = tick(g)
    }
    expect(g.zombies.length).toBeGreaterThanOrEqual(0)
    for (let i = 0; i < 100; i++) {
      g = tick(g)
      if (g.state !== 'playing') break
    }
    expect(['won', 'playing', 'lost']).toContain(g.state)
  })
  it('lose when zombie reaches left', () => {
    let g = createPvzGame(1, 3)
    g.waveTotal = 0
    g.zombies.push({ id: 1, r: 0, x: 0.2, hp: 1, speed: 0.3 })
    g = tick(g)
    expect(g.state).toBe('lost')
  })
})

