export type PvzState = 'playing' | 'won' | 'lost'

export interface Plant {
  id: number
  r: number
  c: number
  type: 'peashooter'
  cooldown: number
}

export interface Zombie {
  id: number
  r: number
  x: number
  hp: number
  speed: number
}

export interface Projectile {
  id: number
  r: number
  x: number
  speed: number
  dmg: number
}

export interface PvzGame {
  rows: number
  cols: number
  plants: Plant[]
  zombies: Zombie[]
  projectiles: Projectile[]
  state: PvzState
  waveSpawned: number
  waveTotal: number
  tickCount: number
}

let nextId = 1

export function createPvzGame(rows = 5, cols = 9): PvzGame {
  return {
    rows,
    cols,
    plants: [],
    zombies: [],
    projectiles: [],
    state: 'playing',
    waveSpawned: 0,
    waveTotal: 10,
    tickCount: 0,
  }
}

export function placePlant(g: PvzGame, r: number, c: number): PvzGame {
  if (g.state !== 'playing') return g
  if (r < 0 || r >= g.rows || c < 0 || c >= g.cols) return g
  if (g.plants.some(p => p.r === r && p.c === c)) return g
  const next: PvzGame = { ...g, plants: g.plants.slice() }
  next.plants.push({ id: nextId++, r, c, type: 'peashooter', cooldown: 0 })
  return next
}

export function tick(g: PvzGame): PvzGame {
  if (g.state !== 'playing') return g
  let next: PvzGame = {
    ...g,
    plants: g.plants.map(p => ({ ...p })),
    zombies: g.zombies.map(z => ({ ...z })),
    projectiles: g.projectiles.map(b => ({ ...b })),
    tickCount: g.tickCount + 1,
  }

  if (next.tickCount % 20 === 0 && next.waveSpawned < next.waveTotal) {
    const lane = Math.floor(Math.random() * next.rows)
    next.zombies.push({ id: nextId++, r: lane, x: next.cols - 0.5, hp: 3, speed: 0.1 })
    next.waveSpawned++
  }

  for (const p of next.plants) {
    if (p.cooldown > 0) { p.cooldown-- ; continue }
    const ahead = next.zombies.some(z => z.r === p.r && z.x > p.c)
    if (ahead) {
      next.projectiles.push({ id: nextId++, r: p.r, x: p.c + 0.5, speed: 0.3, dmg: 1 })
      p.cooldown = 6
    }
  }

  for (const b of next.projectiles) {
    b.x += b.speed
  }
  next.projectiles = next.projectiles.filter(b => b.x < next.cols)

  for (const z of next.zombies) {
    z.x -= z.speed
  }

  for (const b of next.projectiles) {
    for (const z of next.zombies) {
      if (z.r === b.r && Math.abs(z.x - b.x) < 0.4) {
        z.hp -= b.dmg
        b.x = next.cols + 1
      }
    }
  }
  next.projectiles = next.projectiles.filter(b => b.x < next.cols)
  next.zombies = next.zombies.filter(z => z.hp > 0)

  if (next.zombies.some(z => z.x < 0)) next.state = 'lost'
  if (next.waveSpawned >= next.waveTotal && next.zombies.length === 0) next.state = 'won'

  return next
}
