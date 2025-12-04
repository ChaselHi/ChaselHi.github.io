import { describe, it, expect } from 'vitest'
import { createGame, reveal, toggleFlag } from '../src/game/minesweeper'

describe('minesweeper core', () => {
  it('creates board with correct size and mines', () => {
    const b = createGame(9, 9, 10)
    expect(b.cells.length).toBe(81)
    expect(b.mines).toBe(10)
  })
  it('toggle flag works', () => {
    let b = createGame(5, 5, 5)
    b = toggleFlag(b, 0, 0)
    expect(b.cells[0].flag).toBe(true)
    b = toggleFlag(b, 0, 0)
    expect(b.cells[0].flag).toBe(false)
  })
  it('reveal updates state on mine hit', () => {
    let b = createGame(3, 3, 8)
    for (let i = 0; i < 9; i++) {
      const cell = b.cells[i]
      if (!cell.mine) {
        b = reveal(b, cell.r, cell.c)
        break
      }
    }
    expect(['playing', 'lost', 'won']).toContain(b.state)
  })
})
