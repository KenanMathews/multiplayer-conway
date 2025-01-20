// GameContext.jsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { socket } from "../utils/socket";
import {
  createGame,
  createPlayer,
  CellState,
  gameValidation,
  gameUpdates,
  createGameSettings,
  TurnPhase,
} from "../types/game";

const GameContext = createContext(null);

// Action Types as constants for better maintainability
const GameActions = {
  CREATE_GAME: "CREATE_GAME",
  JOIN_GAME: "JOIN_GAME",
  UPDATE_GAME: "UPDATE_GAME",
  SET_TEAM: "SET_TEAM",
  SET_READY: "SET_READY",
  PLACE_CELL: "PLACE_CELL",
  SET_SELECTED_PATTERN: "SET_SELECTED_PATTERN",
  COMPLETE_TURN: "COMPLETE_TURN",
  UPDATE_GENERATION: "UPDATE_GENERATION",
  RESET: "RESET",
};

// Helper functions to keep reducer clean
const createInitialGameState = (gameId, username, team, settings) => {
  const player = createPlayer(socket.id, username, team);
  const gameSettings = createGameSettings(settings);
  const game = createGame(gameId, player, gameSettings);

  return {
    ...game,
    players: [{
      id: socket.id,
      username,
      team,
      isHost: true,
      ready: false
    }],
    currentTurn: {
      playerId: null,
      team: null,
      phase: TurnPhase.PLACEMENT,
      startTime: null,
      generation: 0,
    }
  };
};

const updateGridCell = (grid, x, y, team) => {
  return grid.map((row, rowIndex) => 
    row.map((cell, colIndex) => 
      rowIndex === y && colIndex === x
        ? team === 'red' ? CellState.RED : CellState.BLUE
        : cell
    )
  );
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case GameActions.CREATE_GAME: {
      const { gameId, username, team, settings } = action.payload;
      return createInitialGameState(gameId, username, team, settings);
    }

    case GameActions.JOIN_GAME:
      return state; // Server handles join, wait for game_updated event

    case GameActions.UPDATE_GAME:
      return { ...state, ...action.payload };

    case GameActions.SET_TEAM: {
      const { playerId, team } = action.payload;
      return gameUpdates.setTeam(state, playerId, team);
    }
    
    case GameActions.SET_READY: {
      const { playerId, ready } = action.payload;
      return gameUpdates.setReady(state, playerId, ready);
    }
    
    case GameActions.PLACE_CELL: {
      const { x, y } = action.payload;
      
      if (!state || 
          !gameValidation.isValidMove(state, socket.id, x, y) || 
          state.grid[y][x] !== CellState.EMPTY) {
        return state;
      }

      return {
        ...state,
        grid: updateGridCell(state.grid, x, y, state.currentTurn.team)
      };
    }

    case GameActions.COMPLETE_TURN:
      if (!state || state.currentTurn.playerId !== socket.id) {
        return state;
      }

      return {
        ...state,
        currentTurn: {
          ...state.currentTurn,
          phase: TurnPhase.SIMULATION
        }
      };

    case GameActions.UPDATE_GENERATION:
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, null);

  const createNewGame = useCallback((username, team, settings) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit("create_game", { gameId, username, team, settings });
    dispatch({
      type: GameActions.CREATE_GAME,
      payload: { gameId, username, team, settings },
    });
    return gameId;
  }, []);

  const joinGame = useCallback((gameId, username) => {
    return new Promise((resolve, reject) => {
      if (!gameId || !username) {
        reject(new Error("Game ID and username are required"));
        return;
      }

      const handleError = (error) => {
        socket.off("game_updated", handleSuccess);
        reject(new Error(error));
      };

      const handleSuccess = (gameState) => {
        socket.off("error", handleError);
        dispatch({
          type: GameActions.UPDATE_GAME,
          payload: gameState,
        });
        resolve(gameState);
      };

      socket.once("error", handleError);
      socket.once("game_updated", handleSuccess);
      socket.emit("join_game", { gameId, username });
    });
  }, []);

  const selectTeam = useCallback((team) => {
    if (gameState && gameValidation.isValidTeamSelection(gameState, team)) {
      socket.emit("select_team", { gameId: gameState.id, team });
      dispatch({
        type: GameActions.SET_TEAM,
        payload: { playerId: socket.id, team },
      });
    }
  }, [gameState]);

  const setReady = useCallback((ready) => {
    if (gameState) {
      socket.emit("player_ready", { gameId: gameState.id, ready });
      dispatch({
        type: GameActions.SET_READY,
        payload: { playerId: socket.id, ready },
      });
    }
  }, [gameState]);

  const makeMove = useCallback((x, y) => {
    if (!gameState ||
        gameState.currentTurn.playerId !== socket.id ||
        gameState.currentTurn.phase !== TurnPhase.PLACEMENT ||
        gameState.grid[y][x] !== CellState.EMPTY) {
      return;
    }

    socket.emit('place_cell', { 
      gameId: gameState.id, 
      x,
      y
    });

    socket.emit('complete_turn', { gameId: gameState.id });

    dispatch({
      type: GameActions.PLACE_CELL,
      payload: { x, y }
    });
  }, [gameState]);

  const completeTurn = useCallback(() => {
    if (gameState && 
        gameState.currentTurn.playerId === socket.id && 
        gameState.currentTurn.phase === TurnPhase.PLACEMENT) {
      socket.emit('complete_turn', { gameId: gameState.id });
      dispatch({ type: GameActions.COMPLETE_TURN });
    }
  }, [gameState]);

  useEffect(() => {
    const handleGameUpdate = (updatedGame) => {
      dispatch({
        type: GameActions.UPDATE_GAME,
        payload: updatedGame,
      });
    };

    const handleTurnComplete = (turnData) => {
      dispatch({
        type: GameActions.COMPLETE_TURN,
        payload: turnData
      });
    };

    const handleError = (error) => {
      console.error("Socket error:", error);
    };

    socket.on('game_updated', handleGameUpdate);
    socket.on("error", handleError);
    socket.on('generation_completed', handleTurnComplete);

    return () => {
      socket.off('game_updated', handleGameUpdate);
      socket.off("error", handleError);
      socket.off('generation_completed', handleTurnComplete);
    };
  }, []);

  const value = {
    gameState,
    createNewGame,
    joinGame,
    selectTeam,
    setReady,
    makeMove,
    completeTurn, // Added to context value
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};