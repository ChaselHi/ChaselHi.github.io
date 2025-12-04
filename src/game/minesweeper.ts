export type GameState = 'playing' | 'won' | 'lost'

export interface Cell {
  id: number
  r: number
  c: number
  mine: boolean
  revealed: boolean
  flag: boolean
  adjacent: number
}

export interface Board {
  rows: number
  cols: number
  mines: number
  cells: Cell[]
  state: GameState
  revealedCount: number
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
  return { rows, cols, mines, cells, state: 'playing', revealedCount: 0 }
}

export function reveal(board: Board, r: number, c: number): Board {
  const idx = r * board.cols + c
  const cell = board.cells[idx]
  if (cell.revealed || cell.flag) return board
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
