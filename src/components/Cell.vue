<template>
  <div
    class="cell"
    :class="{ revealed: cell.revealed, 'cheat-highlight': cell.cheatRevealed }"
    @click="onLeft"
    @contextmenu.prevent="onRight"
  >
    <span v-if="cell.cheatRevealed">💣</span>
    <span v-else-if="cell.flag">🚩</span>
    <span v-else-if="cell.revealed && cell.mine">💣</span>
    <span v-else-if="cell.revealed && cell.adjacent>0">{{ cell.adjacent }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Cell } from '../game/minesweeper'
const props = defineProps<{ cell: Cell }>()
const emit = defineEmits<{ 
  (e:'reveal'): void, 
  (e:'flag'): void,
  (e:'revealAdjacent'): void
}>()

function onLeft() { 
  // If cell is already revealed, trigger adjacent reveal
  if (props.cell.revealed) {
    emit('revealAdjacent')
  } else {
    emit('reveal')
  }
}

function onRight() { emit('flag') }
</script>