// Game Status Enum
export const GameStatus = {
  WAITING: 'waiting',    
  STARTING: 'starting',  
  PLAYING: 'playing',    
  FINISHED: 'finished'   
};

// Team Colors Enum
export const TeamColor = {
  RED: 'red',
  BLUE: 'blue'
};

// Turn Phase Enum
export const TurnPhase = {
  PLACEMENT: 'placement',
  SIMULATION: 'simulation',
  PATTERN_SIZE_SELECTION: 'pattern_size_selection',
};

// Grid Cell Structure - Match with ConwayRules
export const CellState = {
  EMPTY: 0,
  RED: 'red',     // Changed to match ConwayRules
  BLUE: 'blue'    // Changed to match ConwayRules
};

// Player Structure
export const createPlayer = (id, username, team = null) => ({
  id,
  username,
  team,
  ready: false,
  connected: true,
  score: 0,
  timeoutWarnings: 0
});

// Game Settings
export const createGameSettings = ({ 
  gridSize = 20,
  turnTime = 30,
  maxTimeoutWarnings = 3,
  maxPlayers = 2,
  minPlayersToStart = 2,
  territoryThresholdEnabled = true,
  territoryThreshold = 10
} = {}) => ({
  gridSize,
  turnTime,
  maxTimeoutWarnings,
  maxPlayers,
  minPlayersToStart,
  territoryThresholdEnabled,
  territoryThreshold
});

// Initialize empty grid
export const initializeGrid = (size) => {
  return Array(size).fill(null).map(() => 
      Array(size).fill(CellState.EMPTY)
  );
};

// Game Structure
export const createGame = (id, creator, settings = createGameSettings()) => ({
  id,
  status: GameStatus.WAITING,
  settings,
  players: [creator],
  grid: initializeGrid(settings.gridSize),
  currentTurn: {
      playerId: null,
      team: null,
      phase: null,
      startTime: null,
      generation: 0
  },
  redTerritory: 0,
  blueTerritory: 0,
  winner: null,
  history: []
});

export const PATTERN_RATIO = 1;

// Game Validation Functions
export const gameValidation = {
  canJoin: (game) => {
      return game.status === GameStatus.WAITING && 
             game.players.length < game.settings.maxPlayers;
  },
  
  canStart: (game) => {
      return game.players.length === game.settings.minPlayersToStart &&
             game.players.every(player => player.ready) &&
             new Set(game.players.map(p => p.team)).size === 2;
  },
  
  isValidTeamSelection: (game, team) => {
      const teamCounts = game.players.reduce((acc, player) => {
          if (player.team) acc[player.team]++;
          return acc;
      }, { [TeamColor.RED]: 0, [TeamColor.BLUE]: 0 });
      
      return teamCounts[team] < 1;
  },

  isValidMove:(gameState, playerId, x, y) => {
    if (!gameState) return false;
  
    const isPatternTurn = gameState.currentTurn.generation % PATTERN_RATIO === 0;
    
    return gameState.status === 'playing' &&
           gameState.currentTurn.playerId === playerId &&
           gameState.currentTurn.phase === 'placement' &&
           x >= 0 && x < gameState.settings.gridSize &&
           y >= 0 && y < gameState.settings.gridSize &&
           (!isPatternTurn || gameState.selectedPattern); // Must have pattern selected on pattern turns
  },

  isTurnTimeout: (game) => {
      if (!game.currentTurn.startTime) return false;
      const elapsed = (Date.now() - game.currentTurn.startTime) / 1000;
      return elapsed >= game.settings.turnTime;
  },

  canPlacePattern: (gameState) => {
    return gameState.currentTurn.generation % PATTERN_RATIO === 0 &&
           gameState.currentTurn.phase === 'placement';
  },

  isValidPatternPlacement: (gameState, playerId, x, y, pattern) => {
    return isValidMove(gameState, playerId, x, y) &&
           gameState.currentTurn.generation % PATTERN_RATIO === 0 &&
           x + pattern[0].length <= gameState.settings.gridSize &&
           y + pattern.length <= gameState.settings.gridSize;
  },
};

// Game State Updates
export const gameUpdates = {
  addPlayer: (game, player) => {
      if (gameValidation.canJoin(game)) {
          game.players.push(player);
      }
      return game;
  },

  removePlayer: (game, playerId) => {
      game.players = game.players.filter(p => p.id !== playerId);
      if (game.players.length < game.settings.minPlayersToStart) {
          game.status = GameStatus.WAITING;
      }
      return game;
  },

  setTeam: (game, playerId, team) => {
      if (gameValidation.isValidTeamSelection(game, team)) {
          const player = game.players.find(p => p.id === playerId);
          if (player) {
              player.team = team;
          }
      }
      return game;
  },

  setReady: (game, playerId, ready) => {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
          player.ready = ready;
          if (gameValidation.canStart(game)) {
              game.status = GameStatus.STARTING;
          }
      }
      return game;
  },

  startGame: (game) => {
      if (gameValidation.canStart(game)) {
          game.status = GameStatus.PLAYING;
          const redPlayer = game.players.find(p => p.team === TeamColor.RED);
          
          // Start with red team
          game.currentTurn = {
              playerId: redPlayer.id,
              team: TeamColor.RED,
              phase: TurnPhase.PLACEMENT,
              startTime: Date.now(),
              generation: 0
          };
      }
      return game;
  },

  nextTurn: (game) => {
      // Save current state to history
      game.history.push(game.grid.map(row => [...row]));

      const currentPlayer = game.players.find(p => p.id === game.currentTurn.playerId);
      const nextPlayer = game.players.find(p => p.team !== currentPlayer.team);

      game.currentTurn = {
          playerId: nextPlayer.id,
          team: nextPlayer.team,
          phase: TurnPhase.PLACEMENT,
          startTime: Date.now(),
          generation: game.currentTurn.generation + 1
      };

      return game;
  },

  handleTimeout: (game) => {
      const currentPlayer = game.players.find(p => p.id === game.currentTurn.playerId);
      if (currentPlayer) {
          currentPlayer.timeoutWarnings++;

          // Check for game over by timeout
          if (currentPlayer.timeoutWarnings >= game.settings.maxTimeoutWarnings) {
              game.status = GameStatus.FINISHED;
              game.winner = game.players.find(p => p.id !== currentPlayer.id);
          } else {
              // Move to next turn
              gameUpdates.nextTurn(game);
          }
      }

      return game;
  },

  setNewGeneration: (game, newGrid) => {
    game.grid = newGrid;
    
    // Update territory counts with correct cell states
    const territory = calculateTerritory(newGrid);
    game.redTerritory = territory.red;
    game.blueTerritory = territory.blue;
    
    return gameUpdates.nextTurn(game);
  }
  
};

// Calculate territory for each team
export const calculateTerritory = (grid) => {
  return grid.reduce((territory, row) => {
      row.forEach(cell => {
          if (cell === CellState.RED) territory.red++;      // Updated to match CellState
          if (cell === CellState.BLUE) territory.blue++;    // Updated to match CellState
      });
      return territory;
  }, { red: 0, blue: 0 });
};