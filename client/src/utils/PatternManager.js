// utils/PatternManager.js

// Common Conway patterns
const PATTERNS = {
  // Basic patterns (3x3 or smaller)
  glider: {
    name: "Glider",
    pattern: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1],
    ],
    category: "Spaceships",
    description: "Moves diagonally across the grid",
  },
  blinker: {
    name: "Blinker",
    pattern: [[1, 1, 1]],
    category: "Oscillators",
    description: "Simplest oscillator",
  },
  block: {
    name: "Block",
    pattern: [
      [1, 1],
      [1, 1],
    ],
    category: "Still Lifes",
    description: "Stable 2x2 square",
  },
  tub: {
    name: "Tub",
    pattern: [
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
    ],
    category: "Still Lifes",
    description: "Stable diamond shape",
  },
  boat: {
    name: "Boat",
    pattern: [
      [1, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
    ],
    category: "Still Lifes",
    description: "Stable boat shape",
  },
  beacon: {
    name: "Beacon",
    pattern: [
      [1, 1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    category: "Oscillators",
    description: "Period 2 oscillator",
  },
  toad: {
    name: "Toad",
    pattern: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    category: "Oscillators",
    description: "Compact period 2 oscillator",
  },
  rpentomino: {
    name: "R-pentomino",
    pattern: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    category: "Methuselahs",
    description: "Small but long-living pattern",
  },
};

export class PatternManager {
  // Get all available patterns
  static getPatterns() {
    return PATTERNS;
  }

  // Get a specific pattern by key
  static getPattern(patternKey) {
    return PATTERNS[patternKey];
  }

  // Get pattern names for UI
  static getPatternList() {
    return Object.entries(PATTERNS).map(([key, { name }]) => ({
      key,
      name,
    }));
  }

  // Group patterns by category
  static getPatternsByCategory() {
    return Object.entries(PATTERNS).reduce((acc, [key, pattern]) => {
      if (!acc[pattern.category]) {
        acc[pattern.category] = [];
      }
      acc[pattern.category].push({
        key,
        name: pattern.name,
        description: pattern.description,
      });
      return acc;
    }, {});
  }

  static getCategories() {
    return [...new Set(Object.values(PATTERNS).map(p => p.category))];
  }

  // Get detailed pattern info
  static getPatternInfo(patternKey) {
    const pattern = PATTERNS[patternKey];
    if (!pattern) return null;

    return {
      name: pattern.name,
      category: pattern.category,
      description: pattern.description,
      dimensions: this.getPatternDimensions(pattern.pattern)
    };
  }

  // Check if pattern fits within grid bounds
  static canPlacePattern(x, y, pattern, gridSize) {
    if (!pattern) return false;

    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;

    return (
      x >= 0 &&
      y >= 0 &&
      x + patternWidth <= gridSize &&
      y + patternHeight <= gridSize
    );
  }

  // Check for overlaps with existing cells
  static checkPatternOverlap(grid, x, y, pattern) {
    if (!pattern) return false;

    for (let i = 0; i < pattern.length; i++) {
      for (let j = 0; j < pattern[0].length; j++) {
        if (pattern[i][j] === 1) {
          const gridY = y + i;
          const gridX = x + j;
          if (grid[gridY][gridX] !== 0) {
            // Assuming 0 is empty state
            return true; // Found overlap
          }
        }
      }
    }
    return false; // No overlap found
  }

  // Place pattern on grid
  static overlayPattern(grid, pattern, startX, startY, team) {
    // Create a new grid copy
    const newGrid = grid.map((row) => [...row]);

    // Place pattern cells
    pattern.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell === 1) {
          newGrid[startY + dy][startX + dx] = team;
        }
      });
    });

    return newGrid;
  }

  // Rotate pattern matrix
  static rotatePattern(pattern) {
    if (!pattern) return pattern;

    const rows = pattern.length;
    const cols = pattern[0].length;
    let rotated = Array(cols)
      .fill()
      .map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = pattern[i][j];
      }
    }
    return rotated;
  }

  // Apply multiple rotations
  static getRotatedPattern(pattern, rotation) {
    let rotatedPattern = pattern;
    const rotations = (rotation / 90) % 4;

    for (let i = 0; i < rotations; i++) {
      rotatedPattern = this.rotatePattern(rotatedPattern);
    }

    return rotatedPattern;
  }

  // Check if cell is part of pattern preview
  static isInPatternPreview(x, y, hoveredX, hoveredY, pattern) {
    if (!pattern) return false;

    const offsetY = y - hoveredY;
    const offsetX = x - hoveredX;

    return (
      offsetY >= 0 &&
      offsetY < pattern.length &&
      offsetX >= 0 &&
      offsetX < pattern[0].length &&
      pattern[offsetY][offsetX] === 1
    );
  }

  // Validate full pattern placement
  static isValidPlacement(grid, x, y, pattern, gridSize) {
    return (
      this.canPlacePattern(x, y, pattern, gridSize) &&
      !this.checkPatternOverlap(grid, x, y, pattern)
    );
  }

  // Get dimensions of a pattern
  static getPatternDimensions(pattern) {
    return {
      width: pattern[0].length,
      height: pattern.length,
    };
  }
}
