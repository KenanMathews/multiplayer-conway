const RoomManager = require("../rooms/RoomManager");
const PlayerManager = require("../rooms/PlayerManager");
const TurnManager = require("../game/TurnManager");
const { ConwayRules } = require("../game/ConwayRules");
const VictoryCheck = require("../game/VictoryCheck");
const { GameStatus } = require("../constants/gameConstants");

class SocketHandlers {
  constructor(io) {
    this.io = io;
    this.activeSimulations = new Map();

  }

  handleGameCreation(socket, { gameId, username, team, settings }) {
    try {
      const gameState = RoomManager.createRoom(gameId, settings);
      const updatedGameState = PlayerManager.addPlayer(gameId, {
        id: socket.id,
        username,
        team,
      });

      socket.join(gameId);
      socket.emit("game_updated", updatedGameState);
    } catch (error) {
      this.handleError(socket, "Error creating game", error);
    }
  }

  handleGameJoin(socket, { gameId, username }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!gameState) {
        throw new Error("Game not found");
      }

      const updatedGameState = PlayerManager.addPlayer(gameId, {
        id: socket.id,
        username,
        team: null,
      });

      socket.join(gameId);
      this.io.to(gameId).emit("game_updated", updatedGameState);
    } catch (error) {
      this.handleError(socket, "Error joining game", error);
    }
  }

  handleTeamSelection(socket, { gameId, team }) {
    try {
      const updatedGameState = PlayerManager.updatePlayer(gameId, socket.id, {
        team,
      });
      if (updatedGameState) {
        this.io.to(gameId).emit("game_updated", updatedGameState);
      }
    } catch (error) {
      this.handleError(socket, "Error selecting team", error);
    }
  }

  handlePlayerReady(socket, { gameId, ready }) {
    try {
      const updatedState = PlayerManager.updatePlayer(gameId, socket.id, {
        ready,
        isReady: ready,
      });

      if (updatedState) {
        this.checkGameStart(gameId, updatedState);
        this.io.to(gameId).emit("game_updated", updatedState);
      }
    } catch (error) {
      this.handleError(socket, "Error setting ready status", error);
    }
  }

  checkGameStart(gameId, updatedState) {
    if (
      RoomManager.shouldStartGame(updatedState) &&
      updatedState.status !== "playing"
    ) {
      const gameState = RoomManager.updateRoom(gameId, {
        status: "playing",
        currentTurn: RoomManager.initializeGameTurn(updatedState),
      });

      TurnManager.startTimer(gameId, gameState, this.io);
      this.io.to(gameId).emit("game_started", gameState);
    }
  }


  handleCellPlacement(socket, { gameId, x, y }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!RoomManager.isValidMove(gameId, socket.id, x, y)) {
        throw new Error("Invalid move");
      }

      const newGrid = ConwayRules.makeMove(
        gameState.grid,
        x,
        y,
        gameState.currentTurn.team
      );

      // Record the move in the sequence
      TurnManager.addMoveToSequence(gameId, {
        type: "CELL_PLACEMENT",
        x,
        y,
        playerId: socket.id,
        team: gameState.currentTurn.team,
      });

      // Update grid state
      TurnManager.updateGridState(gameId, newGrid);
      const updatedState = RoomManager.updateRoom(gameId, { grid: newGrid });
      this.io.to(gameId).emit("game_updated", updatedState);
    } catch (error) {
      this.handleError(socket, "Error placing cell", error);
    }
  }

  handlePatternPlacement(socket, { gameId, pattern, x, y }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!RoomManager.isValidPatternMove(gameId, socket.id, x, y, pattern)) {
        throw new Error("Invalid pattern placement");
      }

      const newGrid = ConwayRules.placePattern(
        gameState.grid,
        pattern,
        x,
        y,
        gameState.currentTurn.team
      );

      // Record the pattern placement in the sequence
      TurnManager.addMoveToSequence(gameId, {
        type: "PATTERN_PLACEMENT",
        pattern,
        x,
        y,
        playerId: socket.id,
        team: gameState.currentTurn.team,
      });

      // Update grid state
      TurnManager.updateGridState(gameId, newGrid);
      const updatedState = RoomManager.updateRoom(gameId, { grid: newGrid });

      this.io
        .to(gameId)
        .emit("pattern_placed", { pattern, x, y, grid: newGrid });
      this.io.to(gameId).emit("game_updated", updatedState);
    } catch (error) {
      this.handleError(socket, "Error placing pattern", error);
    }
  }

  handleTurnSkip(socket, { gameId }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!this.isValidTurn(gameState, socket.id)) {
        throw new Error("Invalid turn skip");
      }

      const result = TurnManager.skipTurn(gameId, gameState, socket.id);
      const updatedState = RoomManager.updateRoom(gameId, result.state);

      this.handleGenerationUpdate(gameId, result);
      this.io.to(gameId).emit("game_updated", updatedState);
      TurnManager.startTimer(gameId, updatedState, this.io);
    } catch (error) {
      this.handleError(socket, "Error skipping turn", error);
    }
  }

  handleDisconnect(socket) {
    console.log("User disconnected:", socket.id);
    Array.from(socket.rooms).forEach((roomId) => {
      if (roomId !== socket.id) {
        const updatedGameState = PlayerManager.removePlayer(roomId, socket.id);
        if (updatedGameState) {
          TurnManager.cleanupGame(roomId);
          this.io.to(roomId).emit("game_updated", updatedGameState);
        }
      }
    });
  }

  handleGenerationUpdate(gameId, result) {
    if (result.type === "NEW_GENERATION") {
      this.io.to(gameId).emit("generation_completed", {
        grid: result.state.grid,
        redTerritory: result.state.redTerritory,
        blueTerritory: result.state.blueTerritory,
      });
    }
  }

  handleVictoryCheck(gameId, gameState) {
    const victoryResult = VictoryCheck.checkVictory(gameState);
    if (victoryResult) {
      this.startSimulation(gameId, victoryResult);
      return true;
    }
    return false;
  }

  // Update the handleTurnCompletion method
  handleTurnCompletion(socket, { gameId }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!this.isValidTurn(gameState, socket.id)) {
        throw new Error("Invalid turn completion");
      }

      const result = TurnManager.completeTurn(gameId, gameState, socket.id);
      if (!result) return;

      const updatedState = RoomManager.updateRoom(gameId, result.state);
      console.log('Turn completed, updated state:', updatedState.status);

      if (result.type === 'VICTORY_DETECTED') {
        this.startSimulation(gameId, updatedState);
      } else {
        this.handleGenerationUpdate(gameId, result);
        this.io.to(gameId).emit('game_updated', updatedState);
        TurnManager.startTimer(gameId, updatedState, this.io);
      }
    } catch (error) {
      this.handleError(socket, "Error completing turn", error);
    }
  }
  
  startSimulation(gameId, initialState) {
    // Clear any existing simulation
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
  
      // If simulation ended without a winner, resume normal gameplay
      if (updatedState.status === GameStatus.PLAYING) {
        const gameplayState = TurnManager.handleSimulationEnd(gameId, updatedState);
        if (gameplayState) {
          const finalState = RoomManager.updateRoom(gameId, gameplayState);
          this.io.to(gameId).emit('game_updated', finalState);
          TurnManager.startTimer(gameId, finalState, this.io);
        }
        this.cleanup(gameId);
        return;
      }
  
      // Emit updates
      this.io.to(gameId).emit('game_updated', updatedState);
      this.io.to(gameId).emit('generation_completed', {
        grid: updatedState.grid,
        redTerritory: updatedState.redTerritory,
        blueTerritory: updatedState.blueTerritory,
        remainingGenerations: updatedState.currentTurn.remainingGenerations
      });
  
      // Check if simulation is complete
      if (updatedState.status === GameStatus.FINISHED) {
        this.io.to(gameId).emit('simulation_completed', {
          winner: updatedState.winner,
          finalGrid: updatedState.grid,
          redTerritory: updatedState.redTerritory,
          blueTerritory: updatedState.blueTerritory
        });
        this.cleanup(gameId);
      }
    }, 300);
  
    this.activeSimulations.set(gameId, simulationInterval);
  }

  // Update handleDisconnect to include cleanup
  handleDisconnect(socket) {
    console.log("User disconnected:", socket.id);
    Array.from(socket.rooms).forEach((roomId) => {
      if (roomId !== socket.id) {
        const updatedGameState = PlayerManager.removePlayer(roomId, socket.id);
        if (updatedGameState) {
          TurnManager.cleanup(roomId);
          VictoryCheck.cleanup(roomId);
          this.io.to(roomId).emit("game_updated", updatedGameState);
        }
      }
    });
  }

  handleSimulationSkip(socket, { gameId }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (gameState?.status !== GameStatus.SIMULATING) {
        throw new Error("Game is not in simulation mode");
      }

      // Rapidly complete remaining generations
      let currentState = gameState;
      while (currentState.currentTurn.remainingGenerations > 0) {
        currentState = VictoryCheck.simulateNextGeneration(currentState);
        if (!currentState || currentState.status === GameStatus.FINISHED) break;
      }

      if (currentState) {
        const finalState = RoomManager.updateRoom(gameId, currentState);
        this.io.to(gameId).emit("game_updated", finalState);
        this.io.to(gameId).emit("simulation_completed", {
          winner: finalState.winner,
          finalGrid: finalState.grid,
          redTerritory: finalState.redTerritory,
          blueTerritory: finalState.blueTerritory
        });
      }
    } catch (error) {
      this.handleError(socket, "Error skipping simulation", error);
    }
  }

  handleThresholdUpdate(socket, { gameId, threshold }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!gameState) throw new Error("Game not found");

      // Only allow host to update threshold
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player?.isHost) throw new Error("Only host can update threshold");

      const updatedState = RoomManager.updateRoom(gameId, {
        settings: {
          ...gameState.settings,
          territoryThreshold: threshold
        }
      });

      this.io.to(gameId).emit("game_updated", updatedState);
    } catch (error) {
      this.handleError(socket, "Error updating threshold", error);
    }
  }

  isValidTurn(gameState, socketId) {
    return gameState && gameState.currentTurn.playerId === socketId;
  }

  handleError(socket, context, error) {
    console.error(context + ":", error);
    socket.emit("error", error.message);
  }

  attachHandlers(socket) {
    socket.on("create_game", (data) => this.handleGameCreation(socket, data));
    socket.on("join_game", (data) => this.handleGameJoin(socket, data));
    socket.on("select_team", (data) => this.handleTeamSelection(socket, data));
    socket.on("player_ready", (data) => this.handlePlayerReady(socket, data));
    
    // Game play events
    socket.on("place_cell", (data) => this.handleCellPlacement(socket, data));
    socket.on("place_pattern", (data) => this.handlePatternPlacement(socket, data));
    socket.on("complete_turn", (data) => this.handleTurnCompletion(socket, data));
    socket.on("skip_turn", (data) => this.handleTurnSkip(socket, data));
    
    // Territory threshold and simulation events
    socket.on("skip_simulation", (data) => this.handleSimulationSkip(socket, data));
    socket.on("update_threshold", (data) => this.handleThresholdUpdate(socket, data));
    
    // Disconnection handling
    socket.on("disconnect", () => this.handleDisconnect(socket));
    
    // Error handling
    socket.on("error", (error) => this.handleError(socket, "Socket error", error));
  }

  // Update cleanup to handle simulations
  cleanup(gameId) {
    if (this.activeSimulations.has(gameId)) {
      clearInterval(this.activeSimulations.get(gameId));
      this.activeSimulations.delete(gameId);
    }
    TurnManager.cleanup(gameId);
    VictoryCheck.cleanup(gameId);
  }
}

module.exports = SocketHandlers;
