<template>
  <div class="container">
    <div class="toolbar">
      <label>游戏</label>
      <select class="select" v-model="game">
        <option value="minesweeper">扫雷</option>
        <option value="pvz">植物大战僵尸</option>
      </select>
    </div>

    <template v-if="game==='minesweeper'">
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
        @revealAdjacent="onRevealAdjacent"
      />
    </template>

    <template v-else>
      <Pvz />
    </template>
  </div>
  </template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Board from './components/Board.vue'
import Pvz from './components/Pvz.vue'
import { createGame, reveal, toggleFlag, revealAdjacent } from './game/minesweeper'

const presets = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
}

const game = ref<'minesweeper'|'pvz'>('minesweeper')
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
  board.value = reveal(board.value, r, c, wasFirst)
  if (wasFirst) startTimer()
  if (board.value.state !== 'playing') stopTimer()
}

function onRevealAdjacent(r: number, c: number) {
  if (board.value.state !== 'playing') return
  board.value = revealAdjacent(board.value, r, c)
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
