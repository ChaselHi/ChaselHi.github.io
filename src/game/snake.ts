export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'game-over';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeGame {
  gridSize: number;
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  status: GameStatus;
  speed: number; // milliseconds between moves
  lastMoveTime: number;
}

export function createSnakeGame(gridSize: number = 20): SnakeGame {
  const initialSnake: Position[] = [
    { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
    { x: Math.floor(gridSize / 2) - 1, y: Math.floor(gridSize / 2) },
    { x: Math.floor(gridSize / 2) - 2, y: Math.floor(gridSize / 2) }
  ];

  return {
    gridSize,
    snake: initialSnake,
    food: generateFood(initialSnake, gridSize),
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    status: 'idle',
    speed: 150, // Initial speed (ms between moves)
    lastMoveTime: 0
  };
}

export function moveSnake(game: SnakeGame, currentTime: number): SnakeGame {
  if (game.status !== 'playing') return game;
  
  // Only move if enough time has passed
  if (currentTime - game.lastMoveTime < game.speed) {
    return game;
  }

  const newDirection = game.nextDirection;
  const head = { ...game.snake[0] };

  // Update direction
  const newGame = { ...game, direction: newDirection, lastMoveTime: currentTime };

  // Move the head based on direction
  switch (newDirection) {
    case 'up':
      head.y -= 1;
      break;
    case 'down':
      head.y += 1;
      break;
    case 'left':
      head.x -= 1;
      break;
    case 'right':
      head.x += 1;
      break;
  }

  // Check wall collision
  if (
    head.x < 0 || 
    head.x >= game.gridSize || 
    head.y < 0 || 
    head.y >= game.gridSize
  ) {
    return { ...newGame, status: 'game-over' };
  }

  // Check self collision
  for (const segment of newGame.snake) {
    if (segment.x === head.x && segment.y === head.y) {
      return { ...newGame, status: 'game-over' };
    }
  }

  // Create new snake with moved head
  const newSnake = [head, ...newGame.snake];

  // Check if food is eaten
  if (head.x === newGame.food.x && head.y === newGame.food.y) {
    // Increase score and generate new food
    const newScore = newGame.score + 10;
    const newFood = generateFood(newSnake, newGame.gridSize);
    // Increase speed slightly with each food eaten (up to a limit)
    const newSpeed = Math.max(50, newGame.speed - 2); // Minimum speed of 50ms
    
    return {
      ...newGame,
      snake: newSnake,
      food: newFood,
      score: newScore,
      speed: newSpeed
    };
  } else {
    // Remove tail since no food was eaten
    newSnake.pop();
    return {
      ...newGame,
      snake: newSnake
    };
  }
}

export function changeDirection(game: SnakeGame, newDirection: Direction): SnakeGame {
  // Prevent 180-degree turns
  if (
    (game.direction === 'up' && newDirection === 'down') ||
    (game.direction === 'down' && newDirection === 'up') ||
    (game.direction === 'left' && newDirection === 'right') ||
    (game.direction === 'right' && newDirection === 'left')
  ) {
    return game;
  }

  return { ...game, nextDirection: newDirection };
}

export function startGame(game: SnakeGame): SnakeGame {
  if (game.status === 'playing') return game;
  
  return {
    ...game,
    status: 'playing',
    lastMoveTime: Date.now()
  };
}

export function pauseGame(game: SnakeGame): SnakeGame {
  if (game.status !== 'playing') return game;
  
  return {
    ...game,
    status: 'paused'
  };
}

export function resumeGame(game: SnakeGame): SnakeGame {
  if (game.status !== 'paused') return game;
  
  return {
    ...game,
    status: 'playing',
    lastMoveTime: Date.now()
  };
}

export function resetGame(game: SnakeGame): SnakeGame {
  const initialSnake: Position[] = [
    { x: Math.floor(game.gridSize / 2), y: Math.floor(game.gridSize / 2) },
    { x: Math.floor(game.gridSize / 2) - 1, y: Math.floor(game.gridSize / 2) },
    { x: Math.floor(game.gridSize / 2) - 2, y: Math.floor(game.gridSize / 2) }
  ];

  return {
    ...game,
    snake: initialSnake,
    food: generateFood(initialSnake, game.gridSize),
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    status: 'idle',
    speed: 150,
    lastMoveTime: 0
  };
}

function generateFood(snake: Position[], gridSize: number): Position {
  let newFood: Position;
  let overlapping: boolean;

  do {
    overlapping = false;
    newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };

    // Check if food overlaps with any snake segment
    for (const segment of snake) {
      if (segment.x === newFood.x && segment.y === newFood.y) {
        overlapping = true;
        break;
      }
    }
  } while (overlapping);

  return newFood;
}