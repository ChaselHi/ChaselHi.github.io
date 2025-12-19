<template>
  <div class="board" :style="gridStyle">
    <Cell
      v-for="cell in board.cells"
      :key="cell.id"
      :cell="cell"
      :showMine="board.showAllMines && cell.mine && !cell.revealed"
      @reveal="$emit('reveal', cell.r, cell.c)"
      @flag="$emit('flag', cell.r, cell.c)"
      @revealAdjacent="board.cheatMode ? $emit('cheat', cell.r, cell.c) : $emit('revealAdjacent', cell.r, cell.c)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Cell from './Cell.vue'
import type { Board } from '../game/minesweeper'

const props = defineProps<{ board: Board }>()
defineEmits<{
  (e: 'reveal', r: number, c: number): void,
  (e: 'flag', r: number, c: number): void,
  (e: 'revealAdjacent', r: number, c: number): void,
  (e: 'cheat', r: number, c: number): void
}>()
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${props.board.cols}, 32px)` }))
</script>