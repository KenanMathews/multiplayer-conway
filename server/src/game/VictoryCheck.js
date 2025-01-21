// src/game/VictoryCheck.js
const { ConwayRules } = require("./ConwayRules");
const { GameStatus, TeamColors } = require('../constants/gameConstants');

class VictoryCheck {
  constructor() {
    this.simulationIntervals = new Map();
  }

  checkVictory(gameState) {
    if (!gameState.settings.territoryThresholdEnabled) {
      return null;
    }

    const { grid } = gameState;
    const { redTerritory, blueTerritory } = ConwayRules.calculateTerritory(grid);
    const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
    
    const redPercentage = (redTerritory / totalCells) * 100;
    const bluePercentage = (blueTerritory / totalCells) * 100;
    const threshold = gameState.settings.territoryThreshold;

    if (redPercentage >= threshold || bluePercentage >= threshold) {
      return this.startSimulation(gameState);
    }

    return null;
  }

  startSimulation(gameState) {
    return {
      ...gameState,
      status: GameStatus.SIMULATING,
      currentTurn: {
        playerId: null,
        team: null,
        phase: 'SIMULATION',
        startTime: Date.now(),
        generation: gameState.currentTurn.generation,
        remainingGenerations: 100
      }
    };
  }

  simulateNextGeneration(gameState) {
    if (gameState.status !== GameStatus.SIMULATING || 
        gameState.currentTurn.remainingGenerations <= 0) {
      return this.determineSimulationEnd(gameState);
    }

    const newGrid = ConwayRules.calculateNextGeneration(gameState.grid);
    const { redTerritory, blueTerritory } = ConwayRules.calculateTerritory(newGrid);
    const remainingGenerations = gameState.currentTurn.remainingGenerations - 1;

    // Check if simulation should end
    if (remainingGenerations <= 0 || redTerritory === 0 || blueTerritory === 0) {
      return this.determineSimulationEnd({
        ...gameState,
        grid: newGrid,
        redTerritory,
        blueTerritory
      });
    }

    return {
      ...gameState,
      grid: newGrid,
      redTerritory,
      blueTerritory,
      currentTurn: {
        ...gameState.currentTurn,
        remainingGenerations,
        generation: gameState.currentTurn.generation + 1
      }
    };
  }

  determineSimulationEnd(gameState) {
    const { redTerritory, blueTerritory } = ConwayRules.calculateTerritory(gameState.grid);
    const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
    
    const redPercentage = (redTerritory / totalCells) * 100;
    const bluePercentage = (blueTerritory / totalCells) * 100;

    // Determine winner based on territory control
    let winner = null;

    // If one team has been eliminated
    if (redTerritory === 0 && blueTerritory > 0) {
      winner = gameState.players.find(p => p.team === 'blue');
    } else if (blueTerritory === 0 && redTerritory > 0) {
      winner = gameState.players.find(p => p.team === 'red');
    } 
    // If neither team is eliminated, compare territory percentages
    else if (redPercentage !== bluePercentage) {
      const winningTeam = redPercentage > bluePercentage ? 'red' : 'blue';
      winner = gameState.players.find(p => p.team === winningTeam);
    }
    // If percentages are equal, it's a draw (winner remains null)

    return {
      ...gameState,
      status: GameStatus.FINISHED,
      grid: gameState.grid,
      redTerritory,
      blueTerritory,
      winner,
      currentTurn: {
        ...gameState.currentTurn,
        remainingGenerations: 0,
        phase: 'SIMULATION',
        generation: gameState.currentTurn.generation
      }
    };
  }

  cleanup(gameId) {
    if (this.simulationIntervals.has(gameId)) {
      clearInterval(this.simulationIntervals.get(gameId));
      this.simulationIntervals.delete(gameId);
    }
  }
}

module.exports = new VictoryCheck();