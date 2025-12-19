export type PvzState = 'playing' | 'won' | 'lost'
export type PlantType = 'peashooter' | 'sunflower' | 'wallnut'

export interface PlantConfig {
  type: PlantType
  cost: number
  cooldown: number
  hp?: number
  dmg?: number
  sunProduceInterval?: number
}

export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  peashooter: { type: 'peashooter', cost: 100, cooldown: 0, dmg: 1 },
  sunflower: { type: 'sunflower', cost: 50, cooldown: 0, sunProduceInterval: 50 }, // 10 seconds
  wallnut: { type: 'wallnut', cost: 50, cooldown: 0, hp: 40 },
}

export interface Plant {
  id: number
  r: number
  c: number
  type: PlantType
  cooldown: number
  hp?: number
  sunTimer?: number
}

export interface Zombie {
  id: number
  r: number
  c: number
  hp: number
  progress: number // 0-1, movement progress within cell
}

export interface Projectile {
  id: number
  r: number
  x: number
  speed: number
  dmg: number
}

export interface Sunshine {
  id: number
  x: number
  y: number
  value: number
  falling: boolean
  targetY?: number
  speed?: number
  createdAt?: number // Track when sunshine was created
}

export interface PvzGame {
  rows: number
  cols: number
  plants: Plant[]
  zombies: Zombie[]
  projectiles: Projectile[]
  sunshines: Sunshine[]
  sun: number
  state: PvzState
  waveSpawned: number
  waveTotal: number
  tickCount: number
  plantCooldowns: Record<PlantType, number>
}

let nextId = 1

export function createPvzGame(rows = 5, cols = 9): PvzGame {
  return {
    rows,
    cols,
    plants: [],
    zombies: [],
    projectiles: [],
    sunshines: [],
    sun: 150, // Starting sun
    state: 'playing',
    waveSpawned: 0,
    waveTotal: 10,
    tickCount: 0,
    plantCooldowns: {
      peashooter: 0,
      sunflower: 0,
      wallnut: 0,
    },
  }
}

export function placePlant(g: PvzGame, r: number, c: number, type: PlantType): PvzGame {
  if (g.state !== 'playing') return g
  if (r < 0 || r >= g.rows || c < 0 || c >= g.cols) return g
  if (g.plants.some(p => p.r === r && p.c === c)) return g
  
  const config = PLANT_CONFIGS[type]
  if (g.sun < config.cost) return g
  if (g.plantCooldowns[type] > 0) return g
  
  const next: PvzGame = { 
    ...g, 
    plants: g.plants.slice(),
    sun: g.sun - config.cost,
    plantCooldowns: { ...g.plantCooldowns, [type]: 50 }
  }
  
  const newPlant: Plant = { 
    id: nextId++, 
    r, 
    c, 
    type, 
    cooldown: 0,
  }
  
  if (type === 'wallnut') {
    newPlant.hp = config.hp
  }
  if (type === 'sunflower') {
    newPlant.sunTimer = config.sunProduceInterval || 50
  }
  
  next.plants.push(newPlant)
  return next
}

export function collectSunshine(g: PvzGame, sunId: number): PvzGame {
  const sunshine = g.sunshines.find(s => s.id === sunId)
  if (!sunshine) return g
  
  return {
    ...g,
    sun: g.sun + sunshine.value,
    sunshines: g.sunshines.filter(s => s.id !== sunId)
  }
}

export function removePlant(g: PvzGame, r: number, c: number): PvzGame {
  if (g.state !== 'playing') return g
  
  const plant = g.plants.find(p => p.r === r && p.c === c)
  if (!plant) return g
  
  return {
    ...g,
    plants: g.plants.filter(p => p.id !== plant.id)
  }
}

export function tick(g: PvzGame): PvzGame {
  if (g.state !== 'playing') return g
  let next: PvzGame = {
    ...g,
    plants: g.plants.map(p => ({ ...p })),
    zombies: g.zombies.map(z => ({ ...z })),
    projectiles: g.projectiles.map(b => ({ ...b })),
    sunshines: g.sunshines.map(s => ({ ...s })),
    tickCount: g.tickCount + 1,
    plantCooldowns: { ...g.plantCooldowns }
  }

  // Reduce plant cooldowns
  for (const type in next.plantCooldowns) {
    if (next.plantCooldowns[type as PlantType] > 0) {
      next.plantCooldowns[type as PlantType]--
    }
  }

  // Spawn falling sunshine from sky (every 15 seconds = 75 ticks)
  if (next.tickCount % 75 === 0) {
    const r = Math.floor(Math.random() * next.rows)
    const c = Math.floor(Math.random() * next.cols)
    next.sunshines.push({
      id: nextId++,
      x: c * 32,
      y: -32,
      value: 25,
      falling: true,
      targetY: r * 32,
      speed: 2,
      createdAt: next.tickCount
    })
  }

  // Spawn zombies (every 10 seconds instead of 4 seconds)
  if (next.tickCount % 50 === 0 && next.waveSpawned < next.waveTotal) {
    const lane = Math.floor(Math.random() * next.rows)
    next.zombies.push({ id: nextId++, r: lane, c: next.cols - 1, hp: 3, progress: 0 })
    next.waveSpawned++
  }

  // Process plants
  for (const p of next.plants) {
    if (p.type === 'peashooter') {
      if (p.cooldown > 0) { p.cooldown--; continue }
      const ahead = next.zombies.some(z => z.r === p.r && z.c >= p.c)
      if (ahead) {
        next.projectiles.push({ id: nextId++, r: p.r, x: p.c + 0.5, speed: 0.3, dmg: 1 })
        p.cooldown = 6
      }
    } else if (p.type === 'sunflower') {
      if (p.sunTimer !== undefined) {
        p.sunTimer--
        if (p.sunTimer <= 0) {
          // Produce sunshine
          next.sunshines.push({
            id: nextId++,
            x: p.c * 32,
            y: p.r * 32,
            value: 25,
            falling: false,
            createdAt: next.tickCount
          })
          p.sunTimer = PLANT_CONFIGS['sunflower'].sunProduceInterval || 50
        }
      }
    }
    // Wall-nut doesn't have active behavior
  }

  // Move projectiles
  for (const b of next.projectiles) {
    b.x += b.speed
  }
  next.projectiles = next.projectiles.filter(b => b.x < next.cols)

  // Move zombies (must happen before eating check)
  for (const z of next.zombies) {
    // Only move if not currently eating
    const isEating = next.plants.some(p => p.r === z.r && p.c === z.c)
    if (!isEating) {
      z.progress -= 0.02 // Move left (negative direction)
      if (z.progress <= -1) {
        z.progress = 0
        z.c--
      }
    }
  }

  // Update falling sunshine
  for (const s of next.sunshines) {
    if (s.falling && s.targetY !== undefined && s.speed) {
      if (s.y < s.targetY) {
        s.y += s.speed
        if (s.y >= s.targetY) {
          s.y = s.targetY
          s.falling = false
          // Mark when it stopped falling
          if (!s.createdAt) s.createdAt = next.tickCount
        }
      }
    }
  }

  // Remove old sunshine after 10 seconds (50 ticks)
  next.sunshines = next.sunshines.filter((s) => {
    if (s.falling) return true // Keep falling sunshine
    if (!s.createdAt) return true // Keep if no creation time (safety)
    const age = next.tickCount - s.createdAt
    return age < 50 // Remove after 10 seconds (50 ticks at 200ms per tick)
  })

  // Projectile hit zombies
  for (const b of next.projectiles) {
    for (const z of next.zombies) {
      const zombieX = z.c + z.progress
      if (z.r === b.r && Math.abs(zombieX - b.x) < 0.4) {
        z.hp -= b.dmg
        b.x = next.cols + 1
      }
    }
  }
  next.projectiles = next.projectiles.filter(b => b.x < next.cols)
  next.zombies = next.zombies.filter(z => z.hp > 0)

  // Zombies eat plants
  for (const z of next.zombies) {
    const targetPlant = next.plants.find(p => p.r === z.r && p.c === z.c)
    if (targetPlant) {
      if (targetPlant.type === 'wallnut' && targetPlant.hp !== undefined) {
        targetPlant.hp -= 0.1
        if (targetPlant.hp <= 0) {
          next.plants = next.plants.filter(p => p.id !== targetPlant.id)
        }
      } else {
        // Eat other plants slowly
        if (!targetPlant.hp) targetPlant.hp = 5
        targetPlant.hp -= 0.1
        if (targetPlant.hp <= 0) {
          next.plants = next.plants.filter(p => p.id !== targetPlant.id)
        }
      }
    }
  }

  if (next.zombies.some(z => z.c < 0)) next.state = 'lost'
  if (next.waveSpawned >= next.waveTotal && next.zombies.length === 0) next.state = 'won'

  return next
}
