<template>
  <div class="container">
    <h1>扫雷</h1>
    <div class="toolbar">
      <label>难度</label>
      <select class="select" v-model="difficultyKey" @change="reset()">
        <option value="easy">初级 9x9/10</option>
        <option value="medium">中级 16x16/40</option>
        <option value="hard">高级 16x30/99</option>
        <option value="custom">自定义</option>
      </select>
      <template v-if="difficultyKey==='custom'">
        <input class="input" type="number" min="5" max="50" v-model.number="rows" />
        <input class="input" type="number" min="5" max="50" v-model.number="cols" />
        <input class="input" type="number" min="1" :max="rows*cols-1" v-model.number="mines" />
      </template>
      <button class="btn" @click="reset()">重新开始</button>
    </div>
    <div class="status">
      <div>剩余雷: {{ remainingMines }}</div>
      <div>状态: {{ statusText }}</div>
      <div>用时: {{ seconds }}s</div>
    </div>
    <Board
      :board="board"
      @reveal="onReveal"
      @flag="onFlag"
    />
  </div>
  </template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Board from './components/Board.vue'
import { createGame, reveal, toggleFlag } from './game/minesweeper'

const presets = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
}

const difficultyKey = ref<'easy'|'medium'|'hard'|'custom'>('easy')
const rows = ref(presets.easy.rows)
const cols = ref(presets.easy.cols)
const mines = ref(presets.easy.mines)
const seconds = ref(0)
let timer: number | null = null

const board = ref(createGame(rows.value, cols.value, mines.value))

function startTimer() {
  if (timer) return
  timer = window.setInterval(() => { seconds.value++ }, 1000)
}
function stopTimer() {
  if (!timer) return
  window.clearInterval(timer)
  timer = null
}

function reset() {
  const p = difficultyKey.value === 'custom' ? { rows: rows.value, cols: cols.value, mines: mines.value } : presets[difficultyKey.value]
  rows.value = p.rows
  cols.value = p.cols
  mines.value = p.mines
  board.value = createGame(rows.value, cols.value, mines.value)
  seconds.value = 0
  stopTimer()
}

const remainingMines = computed(() => {
  const flagged = board.value.cells.filter(c => c.flag).length
  return board.value.mines - flagged
})

const statusText = computed(() => {
  if (board.value.state === 'won') return '胜利'
  if (board.value.state === 'lost') return '失败'
  return '进行中'
})

function onReveal(r: number, c: number) {
  if (board.value.state !== 'playing') return
  const wasFirst = board.value.revealedCount === 0
  board.value = reveal(board.value, r, c)
  if (wasFirst) startTimer()
  if (board.value.state !== 'playing') stopTimer()
}
function onFlag(r: number, c: number) {
  if (board.value.state !== 'playing') return
  board.value = toggleFlag(board.value, r, c)
}

watch(() => [rows.value, cols.value, mines.value], () => {
  if (difficultyKey.value !== 'custom') return
  board.value = createGame(rows.value, cols.value, mines.value)
  seconds.value = 0
  stopTimer()
})
</script>
