const RoomManager = require("../rooms/RoomManager");
const PlayerManager = require("../rooms/PlayerManager");
const TurnManager = require("../game/TurnManager");
const { ConwayRules } = require("../game/ConwayRules");
const VictoryCheck = require("../game/VictoryCheck");
const { GameStatus, TurnPhase } = require("../constants/gameConstants");

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
      
      this.broadcastRoomsUpdate();
    } catch (error) {
      this.handleError(socket, "Error creating game", error);
    }
  }

  handleGetRooms(socket) {
    try {
      const availableRooms = RoomManager.getAvailableRooms();
      socket.emit('rooms_list', availableRooms);
    } catch (error) {
      this.handleError(socket, "Error getting rooms list", error);
    }
  }

  handleGameJoin(socket, { gameId, username }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!gameState) {
        throw new Error("Game not found");
      }

      if (!RoomManager.canJoinRoom(gameId)) {
        throw new Error("Cannot join this game");
      }

      // Add cleanup handler for this specific room
      socket.on("leave_game", () => {
        this.handlePlayerLeaveRoom(socket, gameId);
        socket.leave(gameId);
      });

      const updatedGameState = PlayerManager.addPlayer(gameId, {
        id: socket.id,
        username,
        team: null,
      });

      socket.join(gameId);
      this.io.to(gameId).emit("game_updated", updatedGameState);
      
      if (!gameState.settings.isPrivate) {
        this.broadcastRoomsUpdate();
      }
    } catch (error) {
      this.handleError(socket, "Error joining game", error);
    }
  }

  handlePlayerLeaveRoom(socket, roomId) {
    try {
      const gameState = RoomManager.getRoom(roomId);
      if (!gameState) return;

      const isPrivate = gameState?.settings.isPrivate;
      const wasWaiting = gameState.status === 'waiting';
      
      const updatedGameState = PlayerManager.removePlayer(roomId, socket.id);
      if (!updatedGameState) return;

      // If the game hasn't started and there are no players, or if it was waiting
      // and there's only one player left, remove the room
      if ((wasWaiting && updatedGameState.players.length < 2) || 
          updatedGameState.players.length === 0) {
        
        TurnManager.cleanup(roomId);
        VictoryCheck.cleanup(roomId);
        RoomManager.removeRoom(roomId);
        
        if (updatedGameState.players.length === 1) {
          this.io.to(roomId).emit("game_closed", {
            reason: "Other player left the game"
          });
        }
        
        if (!isPrivate) {
          this.broadcastRoomsUpdate();
        }
        return;
      }

      this.io.to(roomId).emit("game_updated", updatedGameState);
      
      if (!isPrivate) {
        this.broadcastRoomsUpdate();
      }
    } catch (error) {
      console.error("Error handling player leave:", error);
    }
  }

  broadcastRoomsUpdate() {
    const availableRooms = RoomManager.getAvailableRooms();
    this.io.emit('rooms_list', availableRooms);
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
        type: TurnPhase.PLACEMENT,
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
    } catch (error) {
      this.handleError(socket, "Error skipping turn", error);
    }
  }

  handlePatternSizeConfirmation(socket, { gameId }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!gameState || gameState.currentTurn.playerId !== socket.id) {
        throw new Error('Invalid pattern size confirmation');
      }

      const result = TurnManager.handlePatternSizeConfirmation(gameId, gameState, socket.id);
      if (result) {
        const updatedState = RoomManager.updateRoom(gameId, {
          currentTurn: {
            ...gameState.currentTurn,
            phase: TurnPhase.PLACEMENT
          }
        });
    
        this.io.to(gameId).emit('game_updated', updatedState);
      }
    } catch (error) {
      this.handleError(socket, 'Error confirming pattern size', error);
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
          this.broadcastRoomsUpdate();
          this.handlePlayerLeaveRoom(socket, roomId);
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

      if (result.type === 'VICTORY_DETECTED') {
        this.startSimulation(gameId, updatedState);
      } else {
        this.handleGenerationUpdate(gameId, result);
        this.io.to(gameId).emit('game_updated', updatedState);
      }
    } catch (error) {
      this.handleError(socket, "Error completing turn", error);
    }
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
  
      if (updatedState.status === GameStatus.PLAYING) {
        const gameplayState = TurnManager.handleSimulationEnd(gameId, updatedState);
        if (gameplayState) {
          const finalState = RoomManager.updateRoom(gameId, gameplayState);
          this.io.to(gameId).emit('game_updated', finalState);
        }
        this.cleanup(gameId);
        return;
      }
  
      this.io.to(gameId).emit('game_updated', updatedState);
      this.io.to(gameId).emit('generation_completed', {
        grid: updatedState.grid,
        redTerritory: updatedState.redTerritory,
        blueTerritory: updatedState.blueTerritory,
        remainingGenerations: updatedState.currentTurn.remainingGenerations
      });
  
      if (updatedState.status === GameStatus.FINISHED) {
        this.io.to(gameId).emit('simulation_completed', {
          gameId: gameId,
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
    socket.on("get_rooms", () => this.handleGetRooms(socket));

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
    socket.on('confirm_pattern_size', (data) => this.handlePatternSizeConfirmation(socket, data));
    
    // Disconnection handling
    socket.on("disconnect", () => this.handleDisconnect(socket));

    //Leaving scenario
    socket.on("leave_game", (data) => {
      if (data?.gameId) {
        console.log("Leaving game:", data.gameId);
        this.handlePlayerLeaveRoom(socket, data.gameId);
        socket.leave(data.gameId);
      }
    });
    
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
