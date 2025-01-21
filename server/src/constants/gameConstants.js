// src/constants/gameConstants.js

const CellState = {
    EMPTY: 0,
    RED: 'red',
    BLUE: 'blue'
  };
  
  const GameStatus = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished'
  };
  
  const TeamColors = {
    RED: 'red',
    BLUE: 'blue'
  };
  
  const TurnPhase = {
    PLACEMENT: 'placement',
    PATTERN_SIZE_SELECTION: 'pattern_size_selection',
    GENERATION: 'generation',
    SIMULATION: 'simulation',
  };  

  const PATTERN_RATIO = 1;
  
  module.exports = {
    CellState,
    GameStatus,
    TeamColors,
    TurnPhase,
    PATTERN_RATIO
  };