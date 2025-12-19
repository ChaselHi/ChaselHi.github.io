export type GameState = 'playing' | 'won' | 'lost'

export interface Cell {
  id: number
  r: number
  c: number
  mine: boolean
  revealed: boolean
  flag: boolean
  adjacent: number
  cheatRevealed?: boolean  // For cheat mode: reveal mine position without triggering game over
}

export interface Board {
  rows: number
  cols: number
  mines: number
  cells: Cell[]
  state: GameState
  revealedCount: number
  cheatMode: boolean       // Whether cheat mode is active
  cheatUsed: boolean       // Whether cheat has been used
}

export function createGame(rows: number, cols: number, mines: number): Board {
  const size = rows * cols
  const indices = Array.from({ length: size }, (_, i) => i)
  shuffle(indices)
  const mineSet = new Set(indices.slice(0, mines))
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c
      const mine = mineSet.has(id)
      cells.push({ id, r, c, mine, revealed: false, flag: false, adjacent: 0 })
    }
  }
  for (const cell of cells) {
    cell.adjacent = countAdjacent(cells, rows, cols, cell.r, cell.c)
  }
  return { rows, cols, mines, cells, state: 'playing', revealedCount: 0, cheatMode: false, cheatUsed: false }
}

/**
 * Create a new board with the first click guaranteed to be safe and expanded
 */
export function createGameWithFirstClickSafe(rows: number, cols: number, mines: number, firstR: number, firstC: number, ensureNumbered: boolean = false): Board {
  const size = rows * cols
  const firstId = firstR * cols + firstC
  
  // Create all possible positions except the first click position
  const indices = Array.from({ length: size }, (_, i) => i).filter(id => id !== firstId)
  shuffle(indices)
  
  // Select mine positions from the shuffled indices
  const mineSet = new Set(indices.slice(0, mines))
  
  // Create cells
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c
      const mine = mineSet.has(id)
      cells.push({ id, r, c, mine, revealed: false, flag: false, adjacent: 0 })
    }
  }
  
  // Calculate adjacent mine counts
  for (const cell of cells) {
    cell.adjacent = countAdjacent(cells, rows, cols, cell.r, cell.c)
  }
  
  if (ensureNumbered) {
    const firstCell = cells[firstId]
    if (firstCell.adjacent === 0) {
      const neighbors: number[] = []
      forEachNeighbor(cells, rows, cols, firstR, firstC, n => { neighbors.push(n.id) })
      const candidate = neighbors.find(id => !mineSet.has(id))
      if (candidate !== undefined) {
        const removeId = Array.from(mineSet).find(id => id !== candidate)!
        mineSet.delete(removeId)
        mineSet.add(candidate)
        for (const cell of cells) {
          cell.mine = mineSet.has(cell.id)
        }
        for (const cell of cells) {
          cell.adjacent = countAdjacent(cells, rows, cols, cell.r, cell.c)
        }
      }
    }
  }
  
  return { rows, cols, mines, cells, state: 'playing', revealedCount: 0, cheatMode: false, cheatUsed: false }
}

export function reveal(board: Board, r: number, c: number, isFirstClick: boolean = false): Board {
  const idx = r * board.cols + c
  const cell = board.cells[idx]
  if (cell.revealed || cell.flag) return board
  
  // If this is the first click, ensure it's not a mine and expand a large area
  if (isFirstClick) {
    return revealFirstClick(board, r, c)
  }
  
  const next: Board = { ...board, cells: board.cells.slice() }
  const queue: Cell[] = []
  function doReveal(target: Cell) {
    if (target.revealed || target.flag) return
    target.revealed = true
    next.revealedCount++
    if (!target.mine && target.adjacent === 0) queue.push(target)
  }
  const target = next.cells[idx]
  doReveal(target)
  if (target.mine) {
    next.state = 'lost'
    return next
  }
  while (queue.length) {
    const cur = queue.shift()!
    forEachNeighbor(next.cells, next.rows, next.cols, cur.r, cur.c, n => {
      if (n.revealed || n.flag || n.mine) return
      doReveal(n)
    })
  }
  const safeCells = next.rows * next.cols - next.mines
  if (next.revealedCount >= safeCells) next.state = 'won'
  return next
}

/**
 * Handle the first click to ensure it's safe and expands a large area
 */
function revealFirstClick(board: Board, r: number, c: number): Board {
  // Create a new board with the first click position guaranteed to be safe
  const original = board.cells[r * board.cols + c]
  const ensureNumbered = original.adjacent > 0
  const safeBoard = createGameWithFirstClickSafe(board.rows, board.cols, board.mines, r, c, ensureNumbered)
  
  // Now reveal the clicked cell and its neighbors using the standard reveal logic
  const next: Board = { ...safeBoard, cells: safeBoard.cells.slice() }
  const queue: Cell[] = []
  
  function doReveal(target: Cell) {
    if (target.revealed || target.flag) return
    target.revealed = true
    next.revealedCount++
    // Standard behavior: only expand empty cells (0 adjacent mines)
    if (!target.mine && target.adjacent === 0) queue.push(target)
  }
  
  // Reveal the clicked cell
  const idx = r * next.cols + c
  const target = next.cells[idx]
  doReveal(target)
  
  // If the clicked cell is empty (0 adjacent mines), expand the area
  if (!target.mine && target.adjacent === 0) {
    // Process the queue to reveal connected cells
    while (queue.length) {
      const cur = queue.shift()!
      forEachNeighbor(next.cells, next.rows, next.cols, cur.r, cur.c, n => {
        if (n.revealed || n.flag || n.mine) return
        doReveal(n)
      })
    }
  }
  
  const safeCells = next.rows * next.cols - next.mines
  if (next.revealedCount >= safeCells) next.state = 'won'
  return next
}

/**
 * Reveal adjacent cells when clicking on a revealed cell with all adjacent mines flagged
 */
export function revealAdjacent(board: Board, r: number, c: number): Board {
  const idx = r * board.cols + c
  const cell = board.cells[idx]
  
  // Only works on revealed cells with adjacent mines
  if (!cell.revealed || cell.adjacent === 0) return board
  
  // Count flagged and unflagged neighbors
  let flaggedCount = 0
  let unflaggedNeighbors: Cell[] = []
  
  forEachNeighbor(board.cells, board.rows, board.cols, r, c, neighbor => {
    if (neighbor.flag) {
      flaggedCount++
    } else {
      unflaggedNeighbors.push(neighbor)
    }
  })
  
  // Only proceed if all adjacent mines are flagged
  if (flaggedCount !== cell.adjacent) return board
  
  // Create a new board state
  const next: Board = { ...board, cells: board.cells.slice() }
  
  // Reveal all unflagged neighbors
  let hitMine = false
  for (const neighbor of unflaggedNeighbors) {
    if (neighbor.revealed || neighbor.flag) continue
    
    // Update the cell in the new board state
    const neighborIndex = neighbor.r * board.cols + neighbor.c
    const updatedNeighbor = { ...neighbor, revealed: true }
    next.cells[neighborIndex] = updatedNeighbor
    next.revealedCount++
    
    if (updatedNeighbor.mine) {
      hitMine = true
    }
  }
  
  if (hitMine) {
    next.state = 'lost'
  } else {
    // Check win condition
    const safeCells = next.rows * next.cols - next.mines
    if (next.revealedCount >= safeCells) next.state = 'won'
  }
  
  return next
}

export function toggleFlag(board: Board, r: number, c: number): Board {
  const idx = r * board.cols + c
  const cell = board.cells[idx]
  if (cell.revealed) return board
  const next = { ...board, cells: board.cells.slice() }
  const t = next.cells[idx]
  t.flag = !t.flag
  return next
}

function countAdjacent(cells: Cell[], rows: number, cols: number, r: number, c: number): number {
  let count = 0
  forEachNeighbor(cells, rows, cols, r, c, n => { if (n.mine) count++ })
  return count
}

function forEachNeighbor(cells: Cell[], rows: number, cols: number, r: number, c: number, fn: (n: Cell) => void) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
      fn(cells[nr * cols + nc])
    }
  }
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

/**
 * Activate cheat mode (can only be used once per game)
 */
export function activateCheatMode(board: Board): Board {
  if (board.cheatUsed || board.state !== 'playing') return board
  return { ...board, cheatMode: true }
}

/**
 * Use cheat on a revealed number cell to see mines in surrounding 8 cells
 */
export function useCheat(board: Board, r: number, c: number): Board {
  if (!board.cheatMode || board.cheatUsed || board.state !== 'playing') return board
  
  const idx = r * board.cols + c
  const cell = board.cells[idx]
  
  // Can only cheat on revealed cells with a number (adjacent > 0)
  if (!cell.revealed || cell.mine || cell.adjacent === 0) return board
  
  // Create new board state
  const next: Board = { ...board, cells: board.cells.slice(), cheatMode: false, cheatUsed: true }
  
  // Reveal mines in the 8 surrounding cells
  forEachNeighbor(next.cells, next.rows, next.cols, r, c, neighbor => {
    if (neighbor.mine && !neighbor.revealed) {
      const neighborIdx = neighbor.r * board.cols + neighbor.c
      next.cells[neighborIdx] = { ...neighbor, cheatRevealed: true }
    }
  })
  
  return next
}
