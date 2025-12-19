<template>
  <div>
    <div class="toolbar">
      <label>难度</label>
      <select class="select" v-model="difficulty">
        <option value="easy">简单 5x9/10波</option>
        <option value="medium">中等 5x9/15波</option>
        <option value="hard">困难 5x9/20波</option>
      </select>
      <button class="btn" @click="reset">开始</button>
      <div class="status">阳光: {{ game.sun }} | 状态: {{ statusText }}</div>
    </div>

    <div class="pvz-plants-bar">
      <div 
        class="pvz-plant-card pvz-shovel"
        :class="{ selected: selectedPlant === null }"
        @click="selectShovel"
      >
        <div class="plant-icon">🔨</div>
        <div class="plant-name">铲子</div>
      </div>
      <div 
        v-for="plantType in plantTypes" 
        :key="plantType"
        class="pvz-plant-card"
        :class="{ 
          disabled: game.sun < plantConfigs[plantType].cost || game.plantCooldowns[plantType] > 0,
          selected: selectedPlant === plantType 
        }"
        @click="selectPlant(plantType)"
      >
        <div class="plant-icon">{{ getPlantIcon(plantType) }}</div>
        <div class="plant-cost">{{ plantConfigs[plantType].cost }}</div>
        <div v-if="game.plantCooldowns[plantType] > 0" class="plant-cooldown">
          {{ Math.ceil(game.plantCooldowns[plantType] / 5) }}
        </div>
      </div>
    </div>

    <div class="pvz-game-container">
      <div class="board" :style="gridStyle">
        <div
          v-for="cell in cellsWithPlants"
          :key="cell.key"
          class="cell pvz-cell"
          :class="{ 'has-plant': !!cell.plant }"
          @click="place(cell.r, cell.c)"
        >
          <template v-if="cell.plant">
            <span class="plant-sprite">{{ getPlantIcon(cell.plant.type) }}</span>
            <div v-if="cell.plant.type === 'wallnut' && cell.plant.hp" class="wallnut-hp">
              {{ Math.ceil(cell.plant.hp) }}
            </div>
          </template>
        </div>
      </div>

      <div class="pvz-overlay">
        <div
          v-for="s in game.sunshines"
          :key="'s'+s.id"
          class="pvz-sunshine"
          :class="{ 'sunshine-falling': s.falling }"
          :style="styleSunshine(s)"
          @click.stop="collectSun(s.id)"
        >🌞</div>
        <div
          v-for="z in game.zombies"
          :key="'z'+z.id"
          class="pvz-zombie"
          :style="styleZombie(z)"
        >🧟</div>
        <div
          v-for="b in game.projectiles"
          :key="'b'+b.id"
          class="pvz-bullet"
          :style="styleBullet(b)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { createPvzGame, placePlant, tick, collectSunshine, removePlant, PLANT_CONFIGS, type PvzGame, type Zombie, type Projectile, type PlantType, type Plant, type Sunshine } from '../game/pvz'

const difficulty = ref<'easy'|'medium'|'hard'>('easy')
const game = ref<PvzGame>(createPvzGame())
const selectedPlant = ref<PlantType | null>('peashooter')
const plantTypes: PlantType[] = ['sunflower', 'peashooter', 'wallnut']
const plantConfigs = PLANT_CONFIGS
let timer: number | null = null

function reset() {
  const base = createPvzGame(5, 9)
  if (difficulty.value === 'medium') base.waveTotal = 15
  if (difficulty.value === 'hard') base.waveTotal = 20
  game.value = base
  selectedPlant.value = 'peashooter'
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(() => { game.value = tick(game.value) }, 200)
}

function selectPlant(type: PlantType) {
  selectedPlant.value = type
}

function selectShovel() {
  selectedPlant.value = null
}

function place(r: number, c: number) {
  if (selectedPlant.value === null) {
    // Shovel mode - remove plant
    game.value = removePlant(game.value, r, c)
  } else {
    // Plant mode - place plant
    game.value = placePlant(game.value, r, c, selectedPlant.value)
  }
}

function collectSun(sunId: number) {
  game.value = collectSunshine(game.value, sunId)
}

function getPlantIcon(type: PlantType): string {
  const icons: Record<PlantType, string> = {
    peashooter: '🌿',
    sunflower: '🌻',
    wallnut: '🥜'
  }
  return icons[type]
}

const cells = computed(() => {
  const arr: { key: string, r: number, c: number }[] = []
  for (let r = 0; r < game.value.rows; r++) {
    for (let c = 0; c < game.value.cols; c++) {
      arr.push({ key: `${r}-${c}` , r, c })
    }
  }
  return arr
})

const cellsWithPlants = computed(() => {
  return cells.value.map(cell => ({
    ...cell,
    plant: plantAt(cell.r, cell.c)
  }))
})

function plantAt(r: number, c: number): Plant | undefined {
  return game.value.plants.find(p => p.r === r && p.c === c)
}

const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${game.value.cols}, 32px)` }))

function styleSunshine(s: Sunshine) {
  const gap = 4
  const padding = 8
  // Sunshine coordinates are already in pixel space, just add padding offset
  const x = s.x + padding
  const y = s.y + padding
  return { 
    transform: `translate(${x}px, ${y}px)`,
    '--sun-x': `${x}px`,
    '--sun-y': `${y}px`
  }
}

function styleZombie(z: Zombie) {
  const cellSize = 32
  const gap = 4
  const padding = 8
  const top = z.r * (cellSize + gap) + padding
  const left = (z.c + z.progress) * (cellSize + gap) + padding
  return { transform: `translate(${left}px, ${top}px)` }
}

function styleBullet(b: Projectile) {
  const cellSize = 32
  const gap = 4
  const padding = 8
  const top = b.r * (cellSize + gap) + padding + 12
  const left = b.x * (cellSize + gap) + padding + 12
  return { transform: `translate(${left}px, ${top}px)` }
}

const statusText = computed(() => {
  if (game.value.state === 'won') return '胜利'
  if (game.value.state === 'lost') return '失败'
  return '进行中'
})

onMounted(() => { reset() })
onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })
</script>

<style scoped>
.pvz-game-container {
  position: relative;
  width: fit-content;
}
.pvz-plants-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: #1f2937;
  border-radius: 8px;
}
.pvz-plant-card {
  position: relative;
  width: 60px;
  height: 70px;
  background: #374151;
  border: 2px solid #4b5563;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.pvz-plant-card.pvz-shovel {
  background: #4b5563;
  border-color: #6b7280;
}
.pvz-plant-card.pvz-shovel:hover {
  background: #6b7280;
  border-color: #ef4444;
}
.pvz-plant-card.pvz-shovel.selected {
  border-color: #ef4444;
  box-shadow: 0 0 12px #ef4444;
}
.pvz-plant-card:hover:not(.disabled) {
  background: #4b5563;
  border-color: #22c55e;
  transform: translateY(-2px);
}
.pvz-plant-card.selected {
  border-color: #22c55e;
  box-shadow: 0 0 12px #22c55e;
}
.pvz-plant-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #1f2937;
}
.plant-icon {
  font-size: 28px;
}
.plant-cost {
  font-size: 12px;
  color: #fbbf24;
  font-weight: bold;
}
.plant-name {
  font-size: 11px;
  color: #d1d5db;
  margin-top: 2px;
}
.plant-cooldown {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: bold;
  color: white;
  border-radius: 6px;
}
.pvz-cell { 
  position: relative;
  border: 1px solid #374151;
}
.pvz-cell:hover {
  background: #374151;
}
.pvz-cell.has-plant {
  background: #1e3a1e;
}
.plant-sprite {
  font-size: 28px;
}
.wallnut-hp {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  background: #dc2626;
  color: white;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: bold;
}
.pvz-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.pvz-sunshine {
  position: absolute;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  cursor: pointer;
  pointer-events: auto;
  font-size: 32px;
  animation: sunGlow 1s ease-in-out infinite;
  transition: transform 0.1s;
  z-index: 100;
  user-select: none;
  transform-origin: center center;
}
.pvz-sunshine.sunshine-falling {
  z-index: 50;
}
.pvz-sunshine:hover {
  transform: translate(var(--sun-x), var(--sun-y)) scale(1.2) !important;
  filter: brightness(1.5);
}
@keyframes sunGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}
.pvz-zombie { 
  position: absolute; 
  width: 32px; 
  height: 32px; 
  display: grid; 
  place-items: center; 
  pointer-events: none;
  z-index: 20;
}
.pvz-bullet { 
  position: absolute; 
  width: 8px; 
  height: 8px; 
  background: #86efac; 
  border-radius: 999px; 
  pointer-events: none;
}
</style>

