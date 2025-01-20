// src/game/ConwayRules.js
const { CellState, TeamColors } = require('../constants/gameConstants');

class ConwayRules {
  calculateNextGeneration(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const newGrid = this._createEmptyGrid(rows, cols);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        newGrid[i][j] = this._determineNextCellState(grid, i, j);
      }
    }

    return newGrid;
  }

  _createEmptyGrid(rows, cols) {
    return Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(CellState.EMPTY));
  }

  _determineNextCellState(grid, row, col) {
    const { redCount, blueCount } = this.countNeighbors(grid, row, col);
    const totalCount = redCount + blueCount;
    const currentCell = grid[row][col];

    // If the cell is currently empty
    if (currentCell === CellState.EMPTY) {
      // Birth rule - exactly 3 neighbors
      if (totalCount === 3) {
        return redCount > blueCount ? CellState.RED : CellState.BLUE;
      }
      return CellState.EMPTY;
    }
    
    // If the cell is alive (has a color)
    if (totalCount === 2 || totalCount === 3) {
      // Survival rule - cell keeps its current color
      return currentCell;
    }
    
    // Death rule - fewer than 2 or more than 3 neighbors
    return CellState.EMPTY;
  }

  countNeighbors(grid, row, col) {
    let redCount = 0;
    let blueCount = 0;
    const rows = grid.length;
    const cols = grid[0].length;

    // Define the neighborhood bounds
    const rowStart = Math.max(0, row - 1);
    const rowEnd = Math.min(rows - 1, row + 1);
    const colStart = Math.max(0, col - 1);
    const colEnd = Math.min(cols - 1, col + 1);

    // Count neighbors
    for (let i = rowStart; i <= rowEnd; i++) {
      for (let j = colStart; j <= colEnd; j++) {
        // Skip the cell itself
        if (i === row && j === col) continue;

        const cell = grid[i][j];
        if (cell === CellState.RED) redCount++;
        if (cell === CellState.BLUE) blueCount++;
      }
    }

    return { redCount, blueCount };
  }

  calculateTerritory(grid) {
    let redTerritory = 0;
    let blueTerritory = 0;

    grid.forEach(row => {
      row.forEach(cell => {
        if (cell === CellState.RED) redTerritory++;
        if (cell === CellState.BLUE) blueTerritory++;
      });
    });

    return { redTerritory, blueTerritory };
  }

  isValidMove(grid, x, y, team) {
    return (
      this._isWithinBounds(y, x, grid.length, grid[0].length) &&
      grid[y][x] === CellState.EMPTY
    );
  }

  _isWithinBounds(row, col, maxRows, maxCols) {
    return row >= 0 && row < maxRows && col >= 0 && col < maxCols;
  }

  makeMove(grid, x, y, team) {
    if (!this.isValidMove(grid, x, y, team)) {
      throw new Error('Invalid move');
    }

    const newGrid = grid.map(row => [...row]);
    newGrid[y][x] = team;
    return newGrid;
  }

  placePattern(grid, pattern, startX, startY, team) {
    if (!this.validatePattern(pattern)) {
      throw new Error('Invalid pattern format');
    }

    const newGrid = grid.map(row => [...row]);
    
    pattern.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell === 1) {
          newGrid[startY + dy][startX + dx] = team;
        }
      });
    });

    return newGrid;
  }

  validatePattern(pattern) {
    if (!Array.isArray(pattern) || !Array.isArray(pattern[0])) {
      return false;
    }

    const width = pattern[0].length;
    return pattern.every(row =>
      Array.isArray(row) &&
      row.length === width &&
      row.every(cell => cell === 0 || cell === 1)
    );
  }
}

module.exports = {
  ConwayRules: new ConwayRules()
};