const GameStatus = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

const TurnPhase = {
  PLACEMENT: 'PLACEMENT',
  SIMULATION: 'SIMULATION'
};

class GameState {
  static createInitialState(gameId, settings) {
    console.log('Creating initial game state with:', { gameId, settings });
    
    const initialState = {
      id: gameId,
      players: [], // Initialize as empty array
      settings: {
        ...settings,
        maxPlayers: 2,
        minPlayersToStart: 2
      },
      status: GameStatus.WAITING,
      grid: Array(settings.gridSize).fill(0).map(() => 
        Array(settings.gridSize).fill(0)
      ),
      currentTurn: {
        playerId: null,
        team: null,
        phase: TurnPhase.PLACEMENT,
        startTime: null,
        generation: 0
      },
      currentPlayerId: null
    };
    
    console.log('Created initial state:', initialState);
    return initialState;
  }

  static addPlayer(state, player) {
    console.log('Adding player to game:', player);
    if (!state) {
      throw new Error('Game state is not initialized');
    }

    // Defensive copy and ensure players is an array
    const currentPlayers = Array.isArray(state.players) ? [...state.players] : [];

    if (currentPlayers.length >= state.settings.maxPlayers) {
      throw new Error('Game is full');
    }

    if (currentPlayers.some(p => p.id === player.id)) {
      throw new Error('Player already in game');
    }

    const isHost = currentPlayers.length === 0;
    const newPlayer = {
      id: player.id,
      username: player.username,
      isReady: false,
      isHost,
      team: player.team || null
    };

    // Always use array methods for players
    const updatedPlayers = [...currentPlayers, newPlayer];

    const updatedState = this.validateState({
      ...state,
      players: updatedPlayers,
      currentPlayerId: isHost ? player.id : state.currentPlayerId
    });

    // Ensure we're returning a new state object with players as an array
    return {
      ...state,
      players: updatedPlayers,
      currentPlayerId: isHost ? player.id : state.currentPlayerId
    };
  }

  static removePlayer(state, playerId) {
    if (!state) return null;

    // Defensive copy and ensure players is an array
    const currentPlayers = Array.isArray(state.players) ? [...state.players] : [];
    const updatedPlayers = currentPlayers.filter(p => p.id !== playerId);
    
    if (updatedPlayers.length === 0) {
      return null;
    }

    // If host left, assign new host
    const hostLeft = currentPlayers.find(p => p.id === playerId)?.isHost;
    if (hostLeft && updatedPlayers.length > 0) {
      updatedPlayers[0].isHost = true;
    }

    // Ensure we're returning a new state object with players as an array
    return {
      ...state,
      players: updatedPlayers,
      currentPlayerId: updatedPlayers[0].id
    };
  }

  static updatePlayer(state, playerId, updates) {
    if (!state) return null;

    // Defensive copy and ensure players is an array
    const currentPlayers = Array.isArray(state.players) ? [...state.players] : [];
    const updatedPlayers = currentPlayers.map(player => 
      player.id === playerId ? { ...player, ...updates } : player
    );

    // Ensure we're returning a new state object with players as an array
    return {
      ...state,
      players: updatedPlayers
    };
  }

  static canStartGame(state) {
    if (!state || !Array.isArray(state.players)) return false;
    
    return (
      state.players.length === state.settings.maxPlayers &&
      state.players.every(p => p.isReady && p.team)
    );
  }

  static startGame(state) {
    if (!this.canStartGame(state)) {
      throw new Error('Cannot start game yet');
    }

    // Randomly choose which team goes first
    const firstTeam = Math.random() < 0.5 ? 'red' : 'blue';
    const firstPlayer = state.players.find(p => p.team === firstTeam);
    return {
      ...state,
      status: GameStatus.PLAYING,
      currentTurn: {
        ...state.currentTurn,
        playerId: firstPlayer.id,
        team: firstTeam,
        startTime: Date.now()
      }
    };
  }

  // Add a validation method to ensure players is always an array
  static validateState(state) {
    if (!state) return null;
    
    return {
      ...state,
      players: Array.isArray(state.players) ? state.players : []
    };
  }
}

module.exports = {
  GameState,
  GameStatus,
  TurnPhase
};