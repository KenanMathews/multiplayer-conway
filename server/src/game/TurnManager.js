const { ConwayRules } = require("./ConwayRules");
const { TeamColors, TurnPhase, GameStatus, PATTERN_RATIO } = require('../constants/gameConstants');
const VictoryCheck = require('./VictoryCheck');
const RoomManager = require('../rooms/RoomManager');

class TurnManager {
  constructor() {
    this.playerCompletions = new Map();
    this.playerSkips = new Map();
    this.pendingGridUpdates = new Map();
    this.moveSequences = new Map();
    this.lastUpdateTime = new Map();
    this.processingTimeout = new Set(); 
  }

  startTurn(gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      console.error('Player not found:', playerId);
      return gameState;
    }
  
    const generation = this._getCurrentGeneration(gameState);
    const isPatternTurn = generation % PATTERN_RATIO === 0;
    const patternSize = isPatternTurn ? Math.floor(Math.random() * 7) + 3 : null;
  
    const currentTurn = {
      playerId,
      team: player.team,
      phase: isPatternTurn ? TurnPhase.PATTERN_SIZE_SELECTION : TurnPhase.PLACEMENT,
      startTime: Date.now(),
      generation,
      patternSize
    };
  
    this.moveSequences.set(gameState.id, []);
    this.lastUpdateTime.set(gameState.id, Date.now());
    this._resetSkipStatus(gameState.id, playerId);
  
    return {
      ...gameState,
      currentTurn
    };
  }

  _getCurrentGeneration(gameState) {
    return gameState.currentTurn?.generation || 0;
  }

  _resetSkipStatus(gameId, playerId) {
    const skips = this.playerSkips.get(gameId) || new Set();
    skips.delete(playerId);
    this.playerSkips.set(gameId, skips);
  }

  addMoveToSequence(gameId, move) {
    const moves = this.moveSequences.get(gameId) || [];
    moves.push({ ...move, timestamp: Date.now() });
    this.moveSequences.set(gameId, moves);
    this.lastUpdateTime.set(gameId, Date.now());
  }

  updateGridState(gameId, newGrid) {
    this.pendingGridUpdates.set(gameId, newGrid);
    this.lastUpdateTime.set(gameId, Date.now());
  }

  skipTurn(gameId, gameState, playerId) {
    if (this.processingTimeout.has(gameId)) {
      console.log('Already processing timeout for game:', gameId);
      return null;
    }

    try {
      this.processingTimeout.add(gameId);
      console.log(`Skipping turn for player ${playerId}`);
      
      this.moveSequences.set(gameId, []);
      this._markTurnAsSkipped(gameId, playerId);
      return this._processTurnEnd(gameId, gameState, playerId);
    } finally {
      this.processingTimeout.delete(gameId);
    }
  }

  _markTurnAsSkipped(gameId, playerId) {
    let skips = this.playerSkips.get(gameId) || new Set();
    skips.add(playerId);
    this.playerSkips.set(gameId, skips);
  }

  _getSkips(gameId) {
    return this.playerSkips.get(gameId) || new Set();
  }

  completeTurn(gameId, gameState, playerId) {
    if (this.processingTimeout.has(gameId)) {
      console.log('Cannot complete turn during timeout processing');
      return null;
    }

    if (gameState.status === GameStatus.SIMULATING) {
      console.log('Game is in simulation mode, turns cannot be completed');
      return null;
    }

    if (gameState.currentTurn.playerId !== playerId) {
      console.log('Not player\'s turn:', playerId);
      return null;
    }

    return this._processTurnEnd(gameId, gameState, playerId);
  }

  _processTurnEnd(gameId, gameState, playerId) {
    if (gameState.status !== GameStatus.PLAYING) {
      return null;
    }
  
    this._markTurnAsCompleted(gameId, playerId);
    
    const completions = this._getCompletions(gameId);
    const skips = this._getSkips(gameId);
    const currentGrid = this._getCurrentGrid(gameId, gameState);
        
    if (this._isRoundComplete(completions, skips)) {
      return this._handleRoundCompletion(gameId, gameState, currentGrid);
    } else {
      const nextTeam = gameState.currentTurn.team === TeamColors.RED ? TeamColors.BLUE : TeamColors.RED;
      const nextPlayer = this._findPlayerByTeam(gameState, nextTeam);
      
      if (!nextPlayer) {
        console.error('Next player not found');
        return null;
      }
      
      const nextGeneration = gameState.currentTurn.generation;
      const isPatternTurn = nextGeneration % PATTERN_RATIO === 0;
      const patternSize = isPatternTurn ? Math.floor(Math.random() * 7) + 3 : null;
  
      const updatedState = {
        ...gameState,
        grid: currentGrid,
        currentTurn: {
          playerId: nextPlayer.id,
          team: nextPlayer.team,
          phase: isPatternTurn ? TurnPhase.PATTERN_SIZE_SELECTION : TurnPhase.PLACEMENT,
          startTime: Date.now(),
          generation: nextGeneration,
          patternSize
        }
      };
  
      return { type: 'NEXT_TURN', state: updatedState };
    }
  }

  _markTurnAsCompleted(gameId, playerId) {
    let completions = this._getCompletions(gameId);
    completions.add(playerId);
    this.playerCompletions.set(gameId, completions);
  }

  _getCompletions(gameId) {
    return this.playerCompletions.get(gameId) || new Set();
  }

  _getCurrentGrid(gameId, gameState) {
    return this.pendingGridUpdates.get(gameId) || gameState.grid;
  }

  _isRoundComplete(completions, skips) {
    return completions.size + skips.size >= 2;
  }

  _handleRoundCompletion(gameId, gameState, currentGrid) {
    const newGrid = ConwayRules.calculateNextGeneration(currentGrid);
    const { redTerritory, blueTerritory } = ConwayRules.calculateTerritory(newGrid);
  
    this._resetRoundTracking(gameId);
  
    const updatedState = {
      ...gameState,
      grid: newGrid,
      redTerritory,
      blueTerritory
    };
  
    if (gameState.settings.territoryThresholdEnabled) {
      const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
      const redPercentage = (redTerritory / totalCells) * 100;
      const bluePercentage = (blueTerritory / totalCells) * 100;
      const threshold = gameState.settings.territoryThreshold;
  
      if (redPercentage >= threshold || bluePercentage >= threshold) {
        const victoryResult = VictoryCheck.checkVictory(updatedState);
        if (victoryResult) {
          return { 
            type: 'VICTORY_DETECTED', 
            state: {
              ...victoryResult,
              previousTurn: {
                team: gameState.currentTurn.team,
                playerId: gameState.currentTurn.playerId,
                generation: gameState.currentTurn.generation
              }
            }
          };
        }
      }
    }
  
    const nextTeam = updatedState.currentTurn.team === TeamColors.RED ? TeamColors.BLUE : TeamColors.RED;
    const nextPlayer = this._findPlayerByTeam(gameState, nextTeam);
  
    if (!nextPlayer) {
      console.error('Next player not found for team:', nextTeam);
      return null;
    }
  
    const nextGeneration = gameState.currentTurn.generation + 1;
    const isPatternTurn = nextGeneration % PATTERN_RATIO === 0;
    const patternSize = isPatternTurn ? Math.floor(Math.random() * 7) + 3 : null;
  
    updatedState.currentTurn = {
      playerId: nextPlayer.id,
      team: nextPlayer.team,
      phase: isPatternTurn ? TurnPhase.PATTERN_SIZE_SELECTION : TurnPhase.PLACEMENT,
      startTime: Date.now(),
      generation: nextGeneration,
      patternSize
    };
  
    return { type: 'NEW_GENERATION', state: updatedState };
  }

  _resetRoundTracking(gameId) {
    this.playerCompletions.set(gameId, new Set());
    this.playerSkips.set(gameId, new Set());
    this.pendingGridUpdates.delete(gameId);
    this.moveSequences.set(gameId, []);
  }

  _findPlayerByTeam(gameState, team) {
    return gameState.players.find(p => p.team === team);
  }

  handlePatternSizeConfirmation(gameId, gameState, playerId) {
    if (gameState.currentTurn.phase !== TurnPhase.PATTERN_SIZE_SELECTION ||
        gameState.currentTurn.playerId !== playerId) {
      return null;
    }
  
    const updatedState = {
      ...gameState,
      currentTurn: {
        ...gameState.currentTurn,
        phase: TurnPhase.PLACEMENT
      }
    };
      
    return { type: 'PATTERN_SIZE_CONFIRMED', state: updatedState };
  }

  cleanup(gameId) {
    this.playerCompletions.delete(gameId);
    this.playerSkips.delete(gameId);
    this.pendingGridUpdates.delete(gameId);
    this.moveSequences.delete(gameId);
    this.lastUpdateTime.delete(gameId);
    VictoryCheck.cleanup(gameId);
    if (this.simulationIntervals && this.simulationIntervals.has(gameId)) {
      clearInterval(this.simulationIntervals.get(gameId));
      this.simulationIntervals.delete(gameId);
    }
  }
}

module.exports = new TurnManager();