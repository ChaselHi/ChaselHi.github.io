<template>
  <div
    class="cell"
    :class="{ revealed: cell.revealed }"
    @click="onLeft"
    @contextmenu.prevent="onRight"
  >
    <span v-if="cell.flag">🚩</span>
    <span v-else-if="cell.revealed && cell.mine">💣</span>
    <span v-else-if="cell.revealed && cell.adjacent>0">{{ cell.adjacent }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Cell } from '../game/minesweeper'
const props = defineProps<{ cell: Cell }>()
const emit = defineEmits<{ (e:'reveal'): void, (e:'flag'): void }>()

function onLeft() { emit('reveal') }
function onRight() { emit('flag') }
</script>
