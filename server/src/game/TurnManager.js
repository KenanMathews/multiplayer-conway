// src/game/TurnManager.js
const { ConwayRules } = require("./ConwayRules");
const { TeamColors, TurnPhase, GameStatus } = require('../constants/gameConstants');

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

    // Verify it's the player's turn
    if (gameState.currentTurn.playerId !== playerId) {
      console.log('Not player\'s turn:', playerId);
      return null;
    }

    return this._processTurnEnd(gameId, gameState, playerId);
  }

  _processTurnEnd(gameId, gameState, playerId) {
    this._markTurnAsCompleted(gameId, playerId);
    
    const completions = this._getCompletions(gameId);
    const skips = this._getSkips(gameId);
    const currentGrid = this._getCurrentGrid(gameId, gameState);

    if (this._isRoundComplete(completions, skips)) {
      return this._handleRoundCompletion(gameId, gameState, currentGrid);
    } else {
      return this._handleTurnSwitch(gameState, playerId, currentGrid);
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
    console.log('Current grid before generation:', 
      currentGrid.map(row => row.map(cell => cell === 0 ? '.' : cell === 'red' ? 'R' : 'B').join('')).join('\n')
    );
    
    const newGrid = ConwayRules.calculateNextGeneration(currentGrid);
    
    console.log('New grid after generation:', 
      newGrid.map(row => row.map(cell => cell === 0 ? '.' : cell === 'red' ? 'R' : 'B').join('')).join('\n')
    );
    
    const { redTerritory, blueTerritory } = ConwayRules.calculateTerritory(newGrid);

    this._resetRoundTracking(gameId);

    const nextPlayer = this._findPlayerByTeam(gameState, TeamColors.RED);
    const updatedState = {
      ...gameState,
      grid: newGrid,
      redTerritory,
      blueTerritory,
      currentTurn: this._createNewTurn(nextPlayer, gameState)
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

  startTimer(gameId, gameState, io) {
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
    // Prevent timeout handling if already processing
    if (this.processingTimeout.has(gameId)) {
      return;
    }

    const currentPlayerId = gameState.currentTurn.playerId;
    console.log(`Turn timeout for player ${currentPlayerId}`);

    const result = this.skipTurn(gameId, gameState, currentPlayerId);
    
    if (result) {
      if (result.type === 'NEW_GENERATION') {
        this._emitGenerationCompleted(io, gameId, result.state);
      }
      io.to(gameId).emit('game_updated', result.state);
      
      // Start timer for next turn if it's not a new generation
      if (result.type === 'NEXT_TURN') {
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
  }
}

module.exports = new TurnManager();