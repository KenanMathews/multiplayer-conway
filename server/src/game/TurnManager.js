// src/game/TurnManager.js
const { ConwayRules } = require("./ConwayRules");
const { TeamColors, TurnPhase, GameStatus } = require('../constants/gameConstants');
const VictoryCheck = require('./VictoryCheck');
const RoomManager = require('../rooms/RoomManager');

class TurnManager {
  constructor() {
    this.turnTimeouts = new Map();
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

    const currentTurn = {
      playerId,
      team: player.team,
      phase: TurnPhase.PLACEMENT,
      startTime: Date.now(),
      generation: this._getCurrentGeneration(gameState)
    };

    // Reset move sequence for new turn
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

  isPlayerInactive(gameId) {
    const lastUpdate = this.lastUpdateTime.get(gameId);
    const currentTime = Date.now();
    return !lastUpdate || (currentTime - lastUpdate) > 5000; // 5 seconds threshold
  }

  updateGridState(gameId, newGrid) {
    this.pendingGridUpdates.set(gameId, newGrid);
    this.lastUpdateTime.set(gameId, Date.now());
  }

  skipTurn(gameId, gameState, playerId) {
    // Prevent recursive skip calls
    if (this.processingTimeout.has(gameId)) {
      console.log('Already processing timeout for game:', gameId);
      return null;
    }

    try {
      this.processingTimeout.add(gameId);
      console.log(`Skipping turn for player ${playerId}`);

      // Clear any pending moves
      this.moveSequences.set(gameId, []);
      
      this._markTurnAsSkipped(gameId, playerId);
      const result = this._processTurnEnd(gameId, gameState, playerId);
      
      return result;
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
    // Prevent completing turn during timeout processing
    if (this.processingTimeout.has(gameId)) {
      console.log('Cannot complete turn during timeout processing');
      return null;
    }

    // Don't process turns if game is in simulation mode
    if (gameState.status === GameStatus.SIMULATING) {
      console.log('Game is in simulation mode, turns cannot be completed');
      return null;
    }

    // Verify it's the player's turn
    if (gameState.currentTurn.playerId !== playerId) {
      console.log('Not player\'s turn:', playerId);
      return null;
    }

    return this._processTurnEnd(gameId, gameState, playerId);
  }

  _processTurnEnd(gameId, gameState, playerId) {
    if (gameState.status !== GameStatus.PLAYING) {
      console.log('Game is not in playing state:', gameState.status);
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
      
      const updatedState = {
        ...gameState,
        grid: currentGrid,
        currentTurn: {
          playerId: nextPlayer.id,
          team: nextPlayer.team,
          phase: TurnPhase.PLACEMENT,
          startTime: Date.now(),
          generation: gameState.currentTurn.generation
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

  _validateMoveSequence(moves, gameState, playerId) {
    if (!moves.length) return true; // Empty sequence is valid

    // Check moves are in chronological order
    for (let i = 1; i < moves.length; i++) {
      if (moves[i].timestamp <= moves[i-1].timestamp) {
        return false;
      }
    }

    // Check all moves belong to the current player
    return moves.every(move => {
      const timeSinceStart = move.timestamp - gameState.currentTurn.startTime;
      return (
        move.playerId === playerId &&
        timeSinceStart >= 0 &&
        timeSinceStart < (gameState.settings.turnTime * 1000)
      );
    });
  }

  _isRoundComplete(completions, skips) {
    return completions.size + skips.size >= 2;
  }

  _handleRoundCompletion(gameId, gameState, currentGrid) {
    
    const newGrid = ConwayRules.calculateNextGeneration(currentGrid);
    const { redTerritory, blueTerritory } = ConwayRules.calculateTerritory(newGrid);

    this._resetRoundTracking(gameId);

    // Check for victory condition
    const updatedState = {
      ...gameState,
      grid: newGrid,
      redTerritory,
      blueTerritory
    };

    // Only check victory if territory threshold is enabled
    if (gameState.settings.territoryThresholdEnabled) {
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

    // If no victory, continue with next turn
    const nextTeam = updatedState.currentTurn.team === TeamColors.RED ? TeamColors.BLUE : TeamColors.RED;
    const nextPlayer = this._findPlayerByTeam(gameState, nextTeam);

    if (!nextPlayer) {
      console.error('Next player not found for team:', nextTeam);
      return null;
    }

    updatedState.currentTurn = {
      playerId: nextPlayer.id,
      team: nextPlayer.team,
      phase: TurnPhase.PLACEMENT,
      startTime: Date.now(),
      generation: gameState.currentTurn.generation + 1
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

  _createNewTurn(player, gameState) {
    return {
      playerId: player.id,
      team: player.team,
      phase: TurnPhase.PLACEMENT,
      startTime: Date.now(),
      generation: this._getCurrentGeneration(gameState) + 1
    };
  }

  _handleTurnSwitch(gameState, currentPlayerId, currentGrid) {
    const nextPlayer = gameState.players.find(p => p.id !== currentPlayerId);
    if (!nextPlayer) {
      console.error('Next player not found');
      return null;
    }

    const updatedState = {
      ...this.startTurn(gameState, nextPlayer.id),
      grid: currentGrid
    };
    return { type: 'NEXT_TURN', state: updatedState };
  }

  startSimulation(gameId, initialState) {
    if (this.activeSimulations.has(gameId)) {
      clearInterval(this.activeSimulations.get(gameId));
    }

    const simulationInterval = setInterval(() => {
      const currentState = RoomManager.getRoom(gameId);
      if (!currentState || currentState.status !== GameStatus.SIMULATING) {
        this.cleanup(gameId);
        return;
      }

      const nextState = VictoryCheck.simulateNextGeneration(currentState);
      if (!nextState) {
        this.cleanup(gameId);
        return;
      }

      const updatedState = RoomManager.updateRoom(gameId, nextState);
      console.log('Simulation state updated:', updatedState.status);

      // Emit updates
      this.io.to(gameId).emit('game_updated', updatedState);
      
      // Emit territory updates
      this.io.to(gameId).emit('generation_completed', {
        grid: updatedState.grid,
        redTerritory: updatedState.redTerritory,
        blueTerritory: updatedState.blueTerritory,
        remainingGenerations: updatedState.currentTurn.remainingGenerations
      });

      // Check if simulation is complete
      if (updatedState.status === GameStatus.FINISHED) {
        console.log('Simulation completed, emitting final state');
        this.io.to(gameId).emit('simulation_completed', {
          winner: updatedState.winner,
          finalGrid: updatedState.grid,
          redTerritory: updatedState.redTerritory,
          blueTerritory: updatedState.blueTerritory
        });
        this.cleanup(gameId);
      }
    }, 1000);

    this.activeSimulations.set(gameId, simulationInterval);
  }

  handleSimulationEnd(gameId, gameState) {
    // Return to normal gameplay with the correct next player
    const previousTurn = gameState.previousTurn;
    if (!previousTurn) {
      console.error('No previous turn information found');
      return null;
    }

    const nextTeam = previousTurn.team === TeamColors.RED ? TeamColors.BLUE : TeamColors.RED;
    const nextPlayer = this._findPlayerByTeam(gameState, nextTeam);

    if (!nextPlayer) {
      console.error('Next player not found for resuming gameplay');
      return null;
    }

    return {
      ...gameState,
      status: GameStatus.PLAYING,
      currentTurn: {
        playerId: nextPlayer.id,
        team: nextPlayer.team,
        phase: TurnPhase.PLACEMENT,
        startTime: Date.now(),
        generation: previousTurn.generation + 1
      }
    };
  }

  startTimer(gameId, gameState, io) {
    // Don't start timer if game is in simulation mode
    if (gameState.status === GameStatus.SIMULATING) {
      return;
    }

    this._clearExistingTimeout(gameId);
    
    if (!gameState.currentTurn) {
      console.error('No current turn found for game:', gameId);
      return;
    }

    const timeout = setTimeout(() => {
      this._handleTimeoutExpired(gameId, gameState, io);
    }, gameState.settings.turnTime * 1000);

    this.turnTimeouts.set(gameId, timeout);
  }


  _clearExistingTimeout(gameId) {
    if (this.turnTimeouts.has(gameId)) {
      clearTimeout(this.turnTimeouts.get(gameId));
      this.turnTimeouts.delete(gameId);
    }
  }

  _handleTimeoutExpired(gameId, gameState, io) {
    if (this.processingTimeout.has(gameId) || gameState.status !== GameStatus.PLAYING) {
      return;
    }

    const currentPlayerId = gameState.currentTurn.playerId;
    console.log(`Turn timeout for player ${currentPlayerId}`);

    const result = this.skipTurn(gameId, gameState, currentPlayerId);
    
    if (result) {
      if (result.type === 'VICTORY_DETECTED') {
        this._clearExistingTimeout(gameId);
        io.to(gameId).emit('game_updated', result.state);
      } else {
        io.to(gameId).emit('game_updated', result.state);
        this.startTimer(gameId, result.state, io);
      }
    }
  }

  _emitGenerationCompleted(io, gameId, state) {
    io.to(gameId).emit('generation_completed', {
      grid: state.grid,
      redTerritory: state.redTerritory,
      blueTerritory: state.blueTerritory
    });
  }

  cleanup(gameId) {
    this._clearExistingTimeout(gameId);
    this.turnTimeouts.delete(gameId);
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