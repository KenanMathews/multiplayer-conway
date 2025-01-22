import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  useEffect,
} from "react";
import { socket } from "../utils/socket";
import { useNavigate } from "react-router-dom";

import {
  createGame,
  createPlayer,
  CellState,
  gameValidation,
  gameUpdates,
  createGameSettings,
  TurnPhase,
  GameStatus,
} from "../types/game";
import { useToast } from "@/hooks/use-toast";


const GameContext = createContext(null);

const GameActions = {
  CREATE_GAME: "CREATE_GAME",
  JOIN_GAME: "JOIN_GAME",
  SET_AVAILABLE_ROOMS: "SET_AVAILABLE_ROOMS",
  UPDATE_GAME: "UPDATE_GAME",
  SET_TEAM: "SET_TEAM",
  SET_READY: "SET_READY",
  PLACE_CELL: "PLACE_CELL",
  SET_SELECTED_PATTERN: "SET_SELECTED_PATTERN",
  COMPLETE_TURN: "COMPLETE_TURN",
  UPDATE_GENERATION: "UPDATE_GENERATION",
  SIMULATION_STARTED: "SIMULATION_STARTED",
  SIMULATION_COMPLETED: "SIMULATION_COMPLETED",
  UPDATE_TERRITORY: "UPDATE_TERRITORY",
  CONFIRM_PATTERN_SIZE: "CONFIRM_PATTERN_SIZE",
  LEAVE_GAME: "LEAVE_GAME",
  GAME_CLOSED: "GAME_CLOSED",
  CLEANUP: "CLEANUP",
  RESET: "RESET",
};

const createInitialGameState = (gameId, username, team, settings) => {
  const player = createPlayer(socket.id, username, team);
  const gameSettings = createGameSettings({
    ...settings,
    territoryThresholdEnabled: settings.territoryThresholdEnabled ?? false,
    territoryThreshold: settings.territoryThreshold ?? 2,
  });
  const game = createGame(gameId, player, gameSettings);

  return {
    ...game,
    players: [
      {
        id: socket.id,
        username,
        team,
        isHost: true,
        ready: false,
      },
    ],
    currentTurn: {
      playerId: null,
      team: null,
      phase: TurnPhase.PLACEMENT,
      startTime: null,
      generation: 0,
      remainingGenerations: null,
      patternSize: null,
    },
    status: GameStatus.WAITING,
    redTerritory: 0,
    blueTerritory: 0,
    winner: null,
    previousTurn: null,
  };
};

const updateGridCell = (grid, x, y, team) => {
  return grid.map((row, rowIndex) =>
    row.map((cell, colIndex) =>
      rowIndex === y && colIndex === x
        ? team === "red"
          ? CellState.RED
          : CellState.BLUE
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
      return state;

    case GameActions.SET_AVAILABLE_ROOMS:
      return {
        ...state,
        availableRooms: action.payload,
      };

    case GameActions.UPDATE_GAME: {
      if (!state) {
        return {
          ...action.payload,
          currentTurn: {
            playerId: null,
            team: null,
            phase: TurnPhase.PLACEMENT,
            startTime: null,
            generation: 0,
            remainingGenerations: null,
            patternSize: null,
            ...action.payload.currentTurn,
          },
          status: action.payload.status || GameStatus.WAITING,
          redTerritory: action.payload.redTerritory || 0,
          blueTerritory: action.payload.blueTerritory || 0,
          winner: action.payload.winner || null,
          previousTurn: action.payload.previousTurn || null,
        };
      }

      return {
        ...state,
        ...action.payload,
        currentTurn: {
          ...state.currentTurn,
          ...(action.payload.currentTurn || {}),
        },
        status: action.payload.status || state.status,
        redTerritory: action.payload.redTerritory ?? state.redTerritory,
        blueTerritory: action.payload.blueTerritory ?? state.blueTerritory,
        winner: action.payload.winner ?? state.winner,
        previousTurn: action.payload.previousTurn ?? state.previousTurn,
      };
    }

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

      if (
        !state ||
        !gameValidation.isValidMove(state, socket.id, x, y) ||
        state.grid[y][x] !== CellState.EMPTY ||
        state.status !== GameStatus.PLAYING
      ) {
        return state;
      }

      return {
        ...state,
        grid: updateGridCell(state.grid, x, y, state.currentTurn.team),
      };
    }

    case GameActions.SET_SELECTED_PATTERN:
      return {
        ...state,
        selectedPattern: action.payload,
      };

    case GameActions.COMPLETE_TURN:
      if (
        !state ||
        state.currentTurn.playerId !== socket.id ||
        state.status !== GameStatus.PLAYING
      ) {
        return state;
      }

      return {
        ...state,
        currentTurn: {
          ...state.currentTurn,
          phase: TurnPhase.GENERATION,
        },
      };

    case GameActions.UPDATE_GENERATION:
      return {
        ...state,
        grid: action.payload.grid,
        redTerritory: action.payload.redTerritory,
        blueTerritory: action.payload.blueTerritory,
        currentTurn: {
          ...state.currentTurn,
          generation: state.currentTurn.generation + 1,
        },
      };

    case GameActions.SIMULATION_STARTED:
      return {
        ...state,
        status: GameStatus.SIMULATING,
        currentTurn: {
          ...state.currentTurn,
          playerId: null,
          team: null,
          phase: TurnPhase.SIMULATION,
          remainingGenerations: 100,
          // Preserve the generation count
          generation: state.currentTurn.generation,
        },
        // Store previous turn info
        previousTurn: {
          team: state.currentTurn.team,
          playerId: state.currentTurn.playerId,
          generation: state.currentTurn.generation,
        },
      };

    case GameActions.SIMULATION_COMPLETED:
      return state;

    case GameActions.UPDATE_TERRITORY:
      return {
        ...state,
        redTerritory: action.payload.redTerritory,
        blueTerritory: action.payload.blueTerritory,
        currentTurn: {
          ...state.currentTurn,
          remainingGenerations: action.payload.remainingGenerations,
          generation: state.currentTurn.generation + 1,
        },
      };
    case GameActions.CONFIRM_PATTERN_SIZE:
      if (
        !state ||
        state.currentTurn.playerId !== socket.id ||
        state.currentTurn.phase !== TurnPhase.PATTERN_SIZE_SELECTION
      ) {
        return state;
      }

      socket.emit("confirm_pattern_size", { gameId: state.id });
      return state;

    case GameActions.LEAVE_GAME:
    case GameActions.GAME_CLOSED:
    case GameActions.CLEANUP:
      return null;

    case GameActions.RESET:
      return null;

    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();


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

      const handleSuccess = (updatedGameState) => {
        socket.off("error", handleError);

        const gameState = {
          ...updatedGameState,
          currentTurn: {
            playerId: null,
            team: null,
            phase: TurnPhase.PLACEMENT,
            startTime: null,
            generation: 0,
            remainingGenerations: null,
            ...(updatedGameState.currentTurn || {}),
          },
          status: updatedGameState.status || GameStatus.WAITING,
          redTerritory: updatedGameState.redTerritory || 0,
          blueTerritory: updatedGameState.blueTerritory || 0,
          winner: updatedGameState.winner || null,
        };

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

  const selectTeam = useCallback(
    (team) => {
      if (gameState && gameValidation.isValidTeamSelection(gameState, team)) {
        socket.emit("select_team", { gameId: gameState.id, team });
        dispatch({
          type: GameActions.SET_TEAM,
          payload: { playerId: socket.id, team },
        });
      }
    },
    [gameState]
  );

  const setReady = useCallback(
    (ready) => {
      if (gameState) {
        socket.emit("player_ready", { gameId: gameState.id, ready });
        dispatch({
          type: GameActions.SET_READY,
          payload: { playerId: socket.id, ready },
        });
      }
    },
    [gameState]
  );

  const makeMove = useCallback(
    (x, y) => {
      if (
        !gameState ||
        gameState.status !== GameStatus.PLAYING ||
        gameState.currentTurn.playerId !== socket.id ||
        gameState.currentTurn.phase !== TurnPhase.PLACEMENT ||
        gameState.grid[y][x] !== CellState.EMPTY
      ) {
        return;
      }

      socket.emit("place_cell", {
        gameId: gameState.id,
        x,
        y,
      });

      dispatch({
        type: GameActions.PLACE_CELL,
        payload: { x, y },
      });
    },
    [gameState]
  );

  const completeTurn = useCallback(() => {
    if (
      gameState &&
      gameState.status === GameStatus.PLAYING &&
      gameState.currentTurn.playerId === socket.id &&
      gameState.currentTurn.phase === TurnPhase.PLACEMENT
    ) {
      socket.emit("complete_turn", { gameId: gameState.id });
      dispatch({ type: GameActions.COMPLETE_TURN });
    }
  }, [gameState]);

  const pauseSimulation = useCallback(() => {
    if (gameState?.status === GameStatus.SIMULATING) {
      socket.emit("pause_simulation", { gameId: gameState.id });
    }
  }, [gameState]);

  const resumeSimulation = useCallback(() => {
    if (gameState?.status === GameStatus.SIMULATING) {
      socket.emit("resume_simulation", { gameId: gameState.id });
    }
  }, [gameState]);

  const skipSimulation = useCallback(() => {
    if (gameState?.status === GameStatus.SIMULATING) {
      socket.emit("skip_simulation", { gameId: gameState.id });
    }
  }, [gameState]);

  const updateThreshold = useCallback(
    (threshold) => {
      if (
        gameState &&
        gameState.players.find((p) => p.id === socket.id)?.isHost
      ) {
        socket.emit("update_threshold", {
          gameId: gameState.id,
          threshold: Number(threshold),
        });
      }
    },
    [gameState]
  );

  const confirmPatternSize = useCallback(() => {
    if (
      gameState &&
      gameState.status === GameStatus.PLAYING &&
      gameState.currentTurn.playerId === socket.id &&
      gameState.currentTurn.phase === TurnPhase.PATTERN_SIZE_SELECTION
    ) {
      socket.emit("confirm_pattern_size", { gameId: gameState.id });
      dispatch({ type: GameActions.CONFIRM_PATTERN_SIZE });
    }
  }, [gameState]);

  useEffect(() => {
    const handleGameUpdate = (updatedGame) => {
      dispatch({
        type: GameActions.UPDATE_GAME,
        payload: updatedGame,
      });
    };

    const handleGenerationComplete = (data) => {
      dispatch({
        type: GameActions.UPDATE_TERRITORY,
        payload: data,
      });
    };

    const handleSimulationStart = () => {
      dispatch({ type: GameActions.SIMULATION_STARTED });
    };

    const handleSimulationCompleted = (data) => {
      dispatch({
        type: GameActions.SIMULATION_COMPLETED,
        payload: data,
      });
      console.log(data);
      if (data?.gameId) {
        navigate(`/end/${data.gameId}`);
      }
    };

    const handleRoomsList = (rooms) => {
      setAvailableRooms(rooms);
    };

    const handleGameClosed = (data) => {
      toast({
        title: "Game Closed",
        description: data.reason || "The game has been closed",
        variant: "destructive",
      });
      dispatch({ type: GameActions.GAME_CLOSED });
      navigate('/');
    };

    const handlePlayerLeft = (data) => {
      if (data.username) {
        toast({
          title: "Player Left",
          description: `${data.username} has left the game`,
        });
      }
    };

    const handleError = (error) => {
      console.error("Socket error:", error);
    };

    socket.on("rooms_list", handleRoomsList);
    socket.on("game_updated", handleGameUpdate);
    socket.on("game_closed", handleGameClosed);
    socket.on("player_left", handlePlayerLeft);
    socket.on("generation_completed", handleGenerationComplete);
    socket.on("simulation_started", handleSimulationStart);
    socket.on("simulation_completed", handleSimulationCompleted);
    socket.on("error", handleError);

    const interval = setInterval(() => {
      socket.emit("get_rooms");
    }, 5000); 

    return () => {
      socket.off("game_updated", handleGameUpdate);
      socket.off("game_closed", handleGameClosed);
      socket.off("player_left", handlePlayerLeft);
      socket.off("generation_completed", handleGenerationComplete);
      socket.off("simulation_started", handleSimulationStart);
      socket.off("simulation_completed", handleSimulationCompleted);
      socket.off("error", handleError);
    };
  }, []);


  const value = {
    gameState,
    createNewGame,
    joinGame,
    selectTeam,
    setReady,
    makeMove,
    completeTurn,
    pauseSimulation,
    resumeSimulation,
    skipSimulation,
    updateThreshold,
    confirmPatternSize,
    availableRooms,
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
