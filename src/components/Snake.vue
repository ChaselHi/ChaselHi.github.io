<template>
  <div class="snake-container">
    <div class="snake-toolbar">
      <div class="score">得分: {{ game.score }}</div>
      <div class="controls">
        <button class="btn" @click="handleStart">{{ game.status === 'playing' ? '暂停' : '开始' }}</button>
        <button class="btn danger" @click="handleReset">重置</button>
      </div>
    </div>
    
    <div class="snake-board" :style="gridStyle">
      <div
        v-for="(cell, index) in gridCells"
        :key="index"
        class="snake-cell"
        :class="{
          'snake-head': cell.isHead,
          'snake-body': cell.isBody,
          'snake-food': cell.isFood
        }"
      >
        <span v-if="cell.isHead">🟢</span>
        <span v-else-if="cell.isBody">🟩</span>
        <span v-else-if="cell.isFood">❤️</span>
      </div>
    </div>

    <!-- Mobile Controls -->
    <div class="mobile-controls">
      <div class="control-row">
        <button class="control-btn" @click="changeDirection('up')">↑</button>
      </div>
      <div class="control-row">
        <button class="control-btn" @click="changeDirection('left')">←</button>
        <button class="control-btn" @click="changeDirection('down')">↓</button>
        <button class="control-btn" @click="changeDirection('right')">→</button>
      </div>
    </div>
    
    <!-- Game Over Overlay -->
    <div v-if="game.status === 'game-over'" class="game-over-overlay">
      <div class="game-over-content">
        <h3>游戏结束</h3>
        <p>得分: {{ game.score }}</p>
        <button class="btn" @click="handleReset">再玩一次</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { 
  createSnakeGame, 
  moveSnake, 
  changeDirection as changeSnakeDirection, 
  startGame, 
  pauseGame, 
  resumeGame, 
  resetGame,
  SnakeGame,
  Direction,
  Position
} from '../game/snake';

// Define cell type for grid
interface GridCell {
  x: number;
  y: number;
  isHead: boolean;
  isBody: boolean;
  isFood: boolean;
}

// Game state - using reactive to ensure reactivity
const game = reactive(createSnakeGame(20));
let animationFrameId: number | null = null;

// Calculate grid style
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${game.gridSize}, 24px)`
}));

// Generate grid cells for rendering
const gridCells = computed((): GridCell[] => {
  const cells: GridCell[] = [];
  for (let y = 0; y < game.gridSize; y++) {
    for (let x = 0; x < game.gridSize; x++) {
      const isHead = game.snake[0]?.x === x && game.snake[0]?.y === y;
      const isBody = game.snake.slice(1).some((segment: Position) => segment.x === x && segment.y === y);
      const isFood = game.food.x === x && game.food.y === y;
      
      cells.push({
        x,
        y,
        isHead,
        isBody,
        isFood
      });
    }
  }
  return cells;
});

// Handle keyboard input
function handleKeyDown(e: KeyboardEvent) {
  // Prevent scrolling with arrow keys
  if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
    e.preventDefault();
  }
  
  let newDirection: Direction | null = null;
  
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      newDirection = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      newDirection = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      newDirection = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      newDirection = 'right';
      break;
  }
  
  if (newDirection) {
    // Change direction if game is playing
    if (game.status === 'playing' || game.status === 'idle') {
      const updatedGame = changeSnakeDirection(game as SnakeGame, newDirection);
      Object.assign(game, updatedGame);
    }
  }
}

// Game control functions
function handleStart() {
  if (game.status === 'playing') {
    const updatedGame = pauseGame(game as SnakeGame);
    Object.assign(game, updatedGame);
  } else if (game.status === 'paused') {
    const updatedGame = resumeGame(game as SnakeGame);
    Object.assign(game, updatedGame);
  } else { // idle or game-over state
    // Make sure the game is properly initialized when starting
    const updatedGame = startGame(game as SnakeGame);
    Object.assign(game, updatedGame);
  }
}

function handleReset() {
  const updatedGame = resetGame(game as SnakeGame);
  Object.assign(game, updatedGame);
}

function changeDirection(direction: Direction) {
  if (game.status === 'playing' || game.status === 'idle') {
    const updatedGame = changeSnakeDirection(game as SnakeGame, direction);
    Object.assign(game, updatedGame);
  }
}

// Game loop
function gameLoop() {
  if (game.status === 'playing') {
    // Get the current time for movement calculation
    const currentTime = Date.now();
    const updatedGame = moveSnake(game as SnakeGame, currentTime);
    Object.assign(game, updatedGame);
  }
  
  animationFrameId = requestAnimationFrame(gameLoop);
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  animationFrameId = requestAnimationFrame(gameLoop);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.snake-container {
  /* display: flex; */
  /* flex-direction: column; */
  /* align-items: center; */
  gap: 16px;
  position: relative;
}

.snake-toolbar {
  display: flex;
  gap: 16px;

  /* justify-content: space-between; */
  /* width: 100%; */
  align-items: center;
}

.score {
  font-size: 18px;
  font-weight: bold;
}

.controls {
  display: flex;
  gap: 8px;
}

.snake-board {
  display: grid;
  gap: 2px;
  background: #0b1220;
  padding: 8px;
  border-radius: 12px;
  width: fit-content;
}

.snake-cell {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  background: var(--cell);
  border-radius: 4px;
  user-select: none;
  transition: background-color 0.1s ease;
}

.snake-cell.snake-head {
  background: #22c55e; /* Green accent */
  border-radius: 6px;
  font-size: 16px;
}

.snake-cell.snake-body {
  background: #16a34a; /* Darker green */
  border-radius: 5px;
  font-size: 14px;
}

.snake-cell.snake-food {
  background: #ef4444; /* Red for food */
  border-radius: 50%;
  font-size: 16px;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.2); }
}

.mobile-controls {
  display: none;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.control-row {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.control-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  border: none;
  border-radius: 12px;
  background: var(--accent);
  color: #052e16;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.game-over-content {
  background: var(--panel);
  padding: 24px;
  border-radius: 12px;
  text-align: center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .mobile-controls {
    display: flex;
  }
  
  .snake-board {
    transform: scale(1.2);
    transform-origin: top;
  }
}
</style>