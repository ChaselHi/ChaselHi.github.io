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
      <div class="status">状态: {{ statusText }}</div>
    </div>

    <div class="board" :style="gridStyle">
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="cell pvz-cell"
        @click="place(cell.r, cell.c)"
      >
        <span v-if="plantAt(cell.r, cell.c)">🌿</span>
      </div>
    </div>

    <div class="pvz-layer">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { createPvzGame, placePlant, tick, type PvzGame, type Zombie, type Projectile } from '../game/pvz'

const difficulty = ref<'easy'|'medium'|'hard'>('easy')
const game = ref<PvzGame>(createPvzGame())
let timer: number | null = null

function reset() {
  const base = createPvzGame(5, 9)
  if (difficulty.value === 'medium') base.waveTotal = 15
  if (difficulty.value === 'hard') base.waveTotal = 20
  game.value = base
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(() => { game.value = tick(game.value) }, 200)
}

function place(r: number, c: number) {
  game.value = placePlant(game.value, r, c)
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

function plantAt(r: number, c: number) {
  return game.value.plants.some(p => p.r === r && p.c === c)
}

const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${game.value.cols}, 32px)` }))

function styleZombie(z: Zombie) {
  const top = z.r * 32
  const left = z.x * 32
  return { transform: `translate(${left}px, ${top}px)` }
}

function styleBullet(b: Projectile) {
  const top = b.r * 32 + 12
  const left = b.x * 32 + 12
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
.pvz-cell { position: relative; }
.pvz-layer { position: relative; margin-top: 8px; height: calc(5 * 32px); }
.pvz-zombie { position: absolute; width: 32px; height: 32px; display: grid; place-items: center; }
.pvz-bullet { position: absolute; width: 8px; height: 8px; background: #86efac; border-radius: 999px; }
</style>

