<template>
  <div
    class="cell"
    :class="{ revealed: cell.revealed, 'cheat-highlight': cell.cheatRevealed, 'show-mine': showMine }"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @contextmenu.prevent="onRight"
    @touchstart.prevent="onTouchStart"
    @touchend.prevent="onTouchEnd"
    @touchcancel="onTouchCancel"
  >
    <span v-if="showMine">💣</span>
    <span v-else-if="cell.cheatRevealed">💣</span>
    <span v-else-if="cell.flag">🚩</span>
    <span v-else-if="cell.revealed && cell.mine">💣</span>
    <span v-else-if="cell.revealed && cell.adjacent>0">{{ cell.adjacent }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Cell } from '../game/minesweeper'

const props = defineProps<{ cell: Cell; showMine?: boolean }>()
const emit = defineEmits<{ 
  (e:'reveal'): void, 
  (e:'flag'): void,
  (e:'revealAdjacent'): void
}>()

let longPressTimer: number | null = null
const isLongPress = ref(false)
const LONG_PRESS_DURATION = 500 // 500ms for long press

// Mouse events for desktop (with long press support)
function onMouseDown(e: MouseEvent) {
  // Only handle left mouse button
  if (e.button !== 0) return
  
  isLongPress.value = false
  
  // Start long press timer
  longPressTimer = window.setTimeout(() => {
    isLongPress.value = true
    // Trigger flag on long press
    emit('flag')
  }, LONG_PRESS_DURATION)
}

function onMouseUp(e: MouseEvent) {
  // Only handle left mouse button
  if (e.button !== 0) return
  
  // Clear the timer
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  
  // If it wasn't a long press, treat as normal click
  if (!isLongPress.value) {
    onLeft()
  } else {
    isLongPress.value = false
  }
}

function onMouseLeave() {
  // Clear timer if mouse leaves the cell
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  isLongPress.value = false
}

function onLeft() { 
  // If cell is already revealed, trigger adjacent reveal
  if (props.cell.revealed) {
    emit('revealAdjacent')
  } else {
    emit('reveal')
  }
}

function onRight() { 
  emit('flag') 
}

// Touch events for mobile
function onTouchStart(e: TouchEvent) {
  isLongPress.value = false
  
  // Start long press timer
  longPressTimer = window.setTimeout(() => {
    isLongPress.value = true
    // Trigger flag on long press
    emit('flag')
    // Optional: vibration feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, LONG_PRESS_DURATION)
}

function onTouchEnd(e: TouchEvent) {
  // Clear the timer
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  
  // If it wasn't a long press, treat as normal click
  if (!isLongPress.value) {
    onLeft()
  } else {
    isLongPress.value = false
  }
}

function onTouchCancel() {
  // Clear timer if touch is cancelled
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  isLongPress.value = false
}
</script>