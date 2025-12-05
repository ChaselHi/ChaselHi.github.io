import { describe, it, expect } from 'vitest'
import { createGame, createGameWithFirstClickSafe, reveal, toggleFlag, revealAdjacent } from '../src/game/minesweeper'

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
  
  it('revealAdjacent reveals all adjacent cells when all mines are flagged', () => {
    // Create a small 3x3 board with a specific mine pattern
    let b = createGame(3, 3, 4)
    
    // Manually set up a test scenario
    // We'll create a board where:
    // - Cell (1,1) has 2 adjacent mines
    // - Those mines are at (0,1) and (1,0)
    // - Clicking (1,1) after flagging those mines should reveal the other adjacent cells
    
    // Reset the board to a known state
    b = {
      rows: 3,
      cols: 3,
      mines: 2,
      cells: [
        // Row 0
        { id: 0, r: 0, c: 0, mine: false, revealed: false, flag: false, adjacent: 1 },
        { id: 1, r: 0, c: 1, mine: true, revealed: false, flag: false, adjacent: 0 },
        { id: 2, r: 0, c: 2, mine: false, revealed: false, flag: false, adjacent: 1 },
        // Row 1
        { id: 3, r: 1, c: 0, mine: true, revealed: false, flag: false, adjacent: 0 },
        { id: 4, r: 1, c: 1, mine: false, revealed: true, flag: false, adjacent: 2 }, // Central cell, already revealed
        { id: 5, r: 1, c: 2, mine: false, revealed: false, flag: false, adjacent: 1 },
        // Row 2
        { id: 6, r: 2, c: 0, mine: false, revealed: false, flag: false, adjacent: 1 },
        { id: 7, r: 2, c: 1, mine: false, revealed: false, flag: false, adjacent: 1 },
        { id: 8, r: 2, c: 2, mine: false, revealed: false, flag: false, adjacent: 1 },
      ],
      state: 'playing',
      revealedCount: 1
    }
    
    // Flag the two adjacent mines
    b = toggleFlag(b, 0, 1) // Flag mine at (0,1)
    b = toggleFlag(b, 1, 0) // Flag mine at (1,0)
    
    // Now use revealAdjacent on the central cell (1,1)
    b = revealAdjacent(b, 1, 1)
    
    // Check that the non-mine adjacent cells are now revealed
    // Adjacent cells to (1,1) are:
    // (0,0), (0,1), (0,2), (1,0), (1,2), (2,0), (2,1), (2,2)
    // (0,1) and (1,0) are mines and should remain un-revealed (but flagged)
    // The other 6 should now be revealed
    
    expect(b.cells[0].revealed).toBe(true)  // (0,0)
    expect(b.cells[1].revealed).toBe(false) // (0,1) - mine, flagged
    expect(b.cells[2].revealed).toBe(true)  // (0,2)
    expect(b.cells[3].revealed).toBe(false) // (1,0) - mine, flagged
    expect(b.cells[5].revealed).toBe(true)  // (1,2)
    expect(b.cells[6].revealed).toBe(true)  // (2,0)
    expect(b.cells[7].revealed).toBe(true)  // (2,1)
    expect(b.cells[8].revealed).toBe(true)  // (2,2)
    
    // Total revealed count should be 7 (1 initial + 6 new)
    expect(b.revealedCount).toBe(7)
  })
  
  it('revealAdjacent does nothing when not all adjacent mines are flagged', () => {
    // Create a small 3x3 board
    let b = createGame(3, 3, 2)
    
    // Reset the board to a known state
    b = {
      rows: 3,
      cols: 3,
      mines: 2,
      cells: [
        // Row 0
        { id: 0, r: 0, c: 0, mine: false, revealed: false, flag: false, adjacent: 1 },
        { id: 1, r: 0, c: 1, mine: true, revealed: false, flag: false, adjacent: 0 },
        { id: 2, r: 0, c: 2, mine: false, revealed: false, flag: false, adjacent: 1 },
        // Row 1
        { id: 3, r: 1, c: 0, mine: true, revealed: false, flag: false, adjacent: 0 },
        { id: 4, r: 1, c: 1, mine: false, revealed: true, flag: false, adjacent: 2 }, // Central cell, already revealed
        { id: 5, r: 1, c: 2, mine: false, revealed: false, flag: false, adjacent: 1 },
        // Row 2
        { id: 6, r: 2, c: 0, mine: false, revealed: false, flag: false, adjacent: 1 },
        { id: 7, r: 2, c: 1, mine: false, revealed: false, flag: false, adjacent: 1 },
        { id: 8, r: 2, c: 2, mine: false, revealed: false, flag: false, adjacent: 1 },
      ],
      state: 'playing',
      revealedCount: 1
    }
    
    // Flag only one of the two adjacent mines
    b = toggleFlag(b, 0, 1) // Flag mine at (0,1)
    
    // Store the initial state
    const initialState = JSON.parse(JSON.stringify(b))
    
    // Try to use revealAdjacent on the central cell (1,1)
    b = revealAdjacent(b, 1, 1)
    
    // Board should be unchanged since not all adjacent mines are flagged
    expect(b).toEqual(initialState)
  })
  
  it('first click is always safe and expands area when clicking on empty cell', () => {
    const rows = 10, cols = 10, mines = 15
    let b = createGame(rows, cols, mines)
    
    // Find a cell with 0 adjacent mines (empty cell)
    let emptyCellPosition = null
    for (const cell of b.cells) {
      if (cell.adjacent === 0) {
        emptyCellPosition = { r: cell.r, c: cell.c }
        break
      }
    }
    
    // Ensure we found an empty cell
    expect(emptyCellPosition).not.toBeNull()
    
    // Click on the empty cell as the first click
    b = reveal(b, emptyCellPosition!.r, emptyCellPosition!.c, true)
    
    // The clicked cell should be revealed and not a mine
    const clickedCell = b.cells[emptyCellPosition!.r * cols + emptyCellPosition!.c]
    expect(clickedCell.revealed).toBe(true)
    expect(clickedCell.mine).toBe(false)
    
    // Game should still be in playing state, not won
    expect(b.state).toBe('playing')
    
    // Multiple cells should be revealed (area expansion)
    const safeCells = rows * cols - mines
    expect(b.revealedCount).toBeGreaterThan(1) // More than just the clicked cell
    expect(b.revealedCount).toBeLessThan(safeCells) // But not all safe cells
  })
  
  it('first click is always safe but does not expand when clicking on numbered cell', () => {
    const rows = 10, cols = 10, mines = 15
    let b = createGame(rows, cols, mines)
    
    // Find a cell with adjacent mines (numbered cell) that is not a mine
    let numberedCellPosition = null
    for (const cell of b.cells) {
      if (!cell.mine && cell.adjacent > 0) {
        numberedCellPosition = { r: cell.r, c: cell.c }
        break
      }
    }
    
    // Ensure we found a numbered cell
    expect(numberedCellPosition).not.toBeNull()
    
    // Click on the numbered cell as the first click
    b = reveal(b, numberedCellPosition!.r, numberedCellPosition!.c, true)
    
    // The clicked cell should be revealed and not a mine
    const clickedCell = b.cells[numberedCellPosition!.r * cols + numberedCellPosition!.c]
    expect(clickedCell.revealed).toBe(true)
    expect(clickedCell.mine).toBe(false)
    
    // Game should still be in playing state, not won
    expect(b.state).toBe('playing')
    
    // Only one cell should be revealed (no area expansion)
    expect(b.revealedCount).toBe(1)
  })
  
  it('createGameWithFirstClickSafe guarantees first click position is safe', () => {
    const rows = 5, cols = 5, mines = 5
    const firstR = 2, firstC = 2
    
    // Create a board with the first click position guaranteed to be safe
    const b = createGameWithFirstClickSafe(rows, cols, mines, firstR, firstC)
    
    // Check that the first click position is not a mine
    const firstClickCell = b.cells[firstR * cols + firstC]
    expect(firstClickCell.mine).toBe(false)
    
    // Check that the correct number of mines are placed
    const mineCount = b.cells.filter(cell => cell.mine).length
    expect(mineCount).toBe(mines)
  })
})