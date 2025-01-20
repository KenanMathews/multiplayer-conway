const RoomManager = require("../rooms/RoomManager");
const PlayerManager = require("../rooms/PlayerManager");
const TurnManager = require("../game/TurnManager");
const { ConwayRules } = require("../game/ConwayRules");

class SocketHandlers {
  constructor(io) {
    this.io = io;
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
      const updatedGameState = PlayerManager.updatePlayer(gameId, socket.id, { team });
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
    if (RoomManager.shouldStartGame(updatedState) && updatedState.status !== "playing") {
      const gameState = RoomManager.updateRoom(gameId, {
        status: "playing",
        currentTurn: RoomManager.initializeGameTurn(updatedState),
      });

      TurnManager.startTimer(gameId, gameState, this.io);
      this.io.to(gameId).emit("game_started", gameState);
    }
  }

  handleTurnCompletion(socket, { gameId }) {
    try {
      const gameState = RoomManager.getRoom(gameId);
      if (!this.isValidTurn(gameState, socket.id)) {
        throw new Error("Invalid turn completion");
      }

      const result = TurnManager.completeTurn(gameId, gameState, socket.id);
      const updatedState = RoomManager.updateRoom(gameId, result.state);

      this.handleGenerationUpdate(gameId, result);
      this.io.to(gameId).emit("game_updated", updatedState);
      TurnManager.startTimer(gameId, updatedState, this.io);
    } catch (error) {
      this.handleError(socket, "Error completing turn", error);
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
        type: 'CELL_PLACEMENT',
        x,
        y,
        playerId: socket.id,
        team: gameState.currentTurn.team
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
        type: 'PATTERN_PLACEMENT',
        pattern,
        x,
        y,
        playerId: socket.id,
        team: gameState.currentTurn.team
      });

      // Update grid state
      TurnManager.updateGridState(gameId, newGrid);
      const updatedState = RoomManager.updateRoom(gameId, { grid: newGrid });

      this.io.to(gameId).emit("pattern_placed", { pattern, x, y, grid: newGrid });
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
    socket.on("complete_turn", (data) => this.handleTurnCompletion(socket, data));
    socket.on("place_cell", (data) => this.handleCellPlacement(socket, data));
    socket.on("place_pattern", (data) => this.handlePatternPlacement(socket, data));
    socket.on("skip_turn", (data) => this.handleTurnSkip(socket, data));
    socket.on("disconnect", () => this.handleDisconnect(socket));
  }
}

module.exports = SocketHandlers;