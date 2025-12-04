<template>
  <div class="board" :style="gridStyle">
    <Cell
      v-for="cell in board.cells"
      :key="cell.id"
      :cell="cell"
      @reveal="$emit('reveal', cell.r, cell.c)"
      @flag="$emit('flag', cell.r, cell.c)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Cell from './Cell.vue'
import type { Board } from '../game/minesweeper'

const props = defineProps<{ board: Board }>()
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${props.board.cols}, 32px)` }))
</script>
