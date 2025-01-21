// utils/PatternManager.js

// Common Conway patterns
const PATTERNS = {
  // Original 3x3 Patterns
  glider: {
    name: "Glider",
    rle: `#N Glider
#C Classic moving pattern that travels diagonally
#T Spaceship
#G 3x3 Patterns
x = 3, y = 3
bob$2bo$3o!`,
    category: "3x3 Patterns",
    description: "Classic moving pattern that travels diagonally",
    type: "Spaceship"
  },
  blinker3: {
    name: "Blinker",
    rle: `#N Blinker
#C Simple oscillator that alternates between horizontal and vertical
#T Oscillator
#G 3x3 Patterns
x = 3, y = 3
3o!`,
    category: "3x3 Patterns",
    description: "Simple oscillator that alternates between horizontal and vertical",
    type: "Oscillator"
  },
  r_pentomino: {
    name: "R-pentomino",
    rle: `#N R-pentomino
#C Chaotic pattern that evolves for many generations
#T Methuselah
#G 3x3 Patterns
x = 3, y = 3
b2o$2ob$bo!`,
    category: "3x3 Patterns",
    description: "Chaotic pattern that evolves for many generations",
    type: "Methuselah"
  },
  // Additional 3x3 Patterns
  e_heptomino: {
    name: "E-heptomino",
    rle: `#N E-heptomino
#C A seven-cell pattern that evolves chaotically
#T Methuselah
#G 3x3 Patterns
x = 3, y = 3
3o$2bo$2bo!`,
    category: "3x3 Patterns",
    description: "A seven-cell pattern that evolves chaotically",
    type: "Methuselah"
  },
  f_heptomino: {
    name: "F-heptomino",
    rle: `#N F-heptomino
#C Creates interesting evolution with multiple glider streams
#T Methuselah
#G 3x3 Patterns
x = 3, y = 3
3o$bo$bo!`,
    category: "3x3 Patterns",
    description: "Creates interesting evolution with multiple glider streams",
    type: "Methuselah"
  },
  broken_three: {
    name: "Broken Three",
    rle: `#N Broken Three
#C Evolves into a traffic light oscillator
#T Oscillator
#G 3x3 Patterns
x = 3, y = 3
2bo$3o$2bo!`,
    category: "3x3 Patterns",
    description: "Evolves into a traffic light oscillator",
    type: "Oscillator"
  },

  // Original 4x4 Patterns
  beacon: {
    name: "Beacon",
    rle: `#N Beacon
#C Period 2 oscillator that blinks between two states
#T Oscillator
#G 4x4 Patterns
x = 4, y = 4
2o2b$2o2b$2b2o$2b2o!`,
    category: "4x4 Patterns",
    description: "Period 2 oscillator that blinks between two states",
    type: "Oscillator"
  },
  toad: {
    name: "Toad",
    rle: `#N Toad
#C Period 2 oscillator that appears to hop back and forth
#T Oscillator
#G 4x4 Patterns
x = 4, y = 4
4b$b3o$3ob$4b!`,
    category: "4x4 Patterns",
    description: "Period 2 oscillator that appears to hop back and forth",
    type: "Oscillator"
  },
  // Additional 4x4 Patterns
  mold: {
    name: "Mold",
    rle: `#N Mold
#C Stable pattern resembling biological growth
#T Still Life
#G 4x4 Patterns
x = 4, y = 4
b2o$o2bo$o2bo$b2o!`,
    category: "4x4 Patterns",
    description: "Stable pattern resembling biological growth",
    type: "Still Life"
  },
  ship: {
    name: "Ship",
    rle: `#N Ship
#C Classic stable pattern used in larger constructions
#T Still Life
#G 4x4 Patterns
x = 4, y = 4
2o2b$o2bo$o2bo$b2o!`,
    category: "4x4 Patterns",
    description: "Classic stable pattern used in larger constructions",
    type: "Still Life"
  },

  // Original 5x5 Patterns
  glider_gun_seed: {
    name: "Glider Gun Seed",
    rle: `#N Glider Gun Seed
#C Seed pattern that can evolve into complex structures
#T Generator
#G 5x5 Patterns
x = 5, y = 5
2bo2b$bo2bo$5o$bo2bo$2bo!`,
    category: "5x5 Patterns",
    description: "Seed pattern that can evolve into complex structures",
    type: "Generator"
  },
  pentadecathlon_seed: {
    name: "Pentadecathlon Seed",
    rle: `#N Pentadecathlon Seed
#C Seeds a period 15 oscillator
#T Oscillator
#G 5x5 Patterns
x = 5, y = 5
2bo2b$2o2o$2bo2b$2bo2b$2bo!`,
    category: "5x5 Patterns",
    description: "Seeds a period 15 oscillator",
    type: "Oscillator"
  },
  // Additional 5x5 Patterns
  boat_tie: {
    name: "Boat-tie",
    rle: `#N Boat-tie
#C Stable pattern combining two boats
#T Still Life
#G 5x5 Patterns
x = 5, y = 5
bo3b$o4b$bo2bo$b2o2b$b2o!`,
    category: "5x5 Patterns",
    description: "Stable pattern combining two boats",
    type: "Still Life"
  },
  mercury: {
    name: "Mercury",
    rle: `#N Mercury
#C Period 3 oscillator with fluid-like movement
#T Oscillator
#G 5x5 Patterns
x = 5, y = 5
2b2o$2bo2$2o2b$2o!`,
    category: "5x5 Patterns",
    description: "Period 3 oscillator with fluid-like movement",
    type: "Oscillator"
  },

  // Original 6x6 Patterns
  puffer: {
    name: "Puffer",
    rle: `#N Puffer
#C Leaves behind a trail as it moves
#T Puffer
#G 6x6 Patterns
x = 6, y = 6
3o3b$o5b$bo4b$3b3o$3bobo$4bo!`,
    category: "6x6 Patterns",
    description: "Leaves behind a trail as it moves",
    type: "Puffer"
  },
  loafer: {
    name: "Loafer",
    rle: `#N Loafer
#C Slow-moving spaceship
#T Spaceship
#G 6x6 Patterns
x = 6, y = 6
b2o3b$o2bob$bo2ob$2b2ob$4bo$3b2o!`,
    category: "6x6 Patterns",
    description: "Slow-moving spaceship",
    type: "Spaceship"
  },
  // Additional 6x6 Patterns
  century: {
    name: "Century",
    rle: `#N Century
#C Long-lived pattern that evolves for 100+ generations
#T Methuselah
#G 6x6 Patterns
x = 6, y = 6
2o4b$o5b$b3o2b$2b3ob$5bo$4b2o!`,
    category: "6x6 Patterns",
    description: "Long-lived pattern that evolves for 100+ generations",
    type: "Methuselah"
  },

  // Original 7x7 Patterns
  weekender: {
    name: "Weekender",
    rle: `#N Weekender
#C Period 7 oscillator
#T Oscillator
#G 7x7 Patterns
x = 7, y = 7
2o3b2o$2o3b2o$7b$ob3obo$7b$2b3o2b$2bobo!`,
    category: "7x7 Patterns",
    description: "Period 7 oscillator",
    type: "Oscillator"
  },
  unix: {
    name: "Unix",
    rle: `#N Unix
#C Stable symmetric pattern
#T Still Life
#G 7x7 Patterns
x = 7, y = 7
3bo3b$2b3o2b$boboob$7o$boboob$2b3o2b$3bo!`,
    category: "7x7 Patterns",
    description: "Stable symmetric pattern",
    type: "Still Life"
  },
  // Additional 7x7 Patterns
  eater5: {
    name: "Eater 5",
    rle: `#N Eater 5
#C Pattern that can consume other patterns
#T Still Life
#G 7x7 Patterns
x = 7, y = 7
2o5b$o6b$bo2b3b$2bob3b$3bo3b$3b2o2b$7o!`,
    category: "7x7 Patterns",
    description: "Pattern that can consume other patterns",
    type: "Still Life"
  },
  spiral: {
    name: "Spiral",
    rle: `#N Spiral
#C Creates spiral-like evolution pattern
#T Methuselah
#G 7x7 Patterns
x = 7, y = 7
2o5b$o6b$bo5b$2b2o3b$3b2o2b$4bob$5b2o!`,
    category: "7x7 Patterns",
    description: "Creates spiral-like evolution pattern",
    type: "Methuselah"
  },

  // Original 8x8 Patterns
  gospel_gun: {
    name: "Gospel Gun Components",
    rle: `#N Gospel Gun Components
#C Component of the famous Gosper Glider Gun
#T Generator
#G 8x8 Patterns
x = 8, y = 8
2b4o2b$bo4bob$o6bo$o2b2o2o$o2b2o2o$o6bo$bo4bob$2b4o!`,
    category: "8x8 Patterns",
    description: "Component of the famous Gosper Glider Gun",
    type: "Generator"
  },
  figure_eight: {
    name: "Figure Eight",
    rle: `#N Figure Eight
#C Period 8 oscillator
#T Oscillator
#G 8x8 Patterns
x = 8, y = 8
3o5b$3o5b$3o5b$5b3o$5b3o$5b3o$8b$8b!`,
    category: "8x8 Patterns",
    description: "Period 8 oscillator",
    type: "Oscillator"
  },
  // Additional 8x8 Patterns
  octagon4: {
    name: "Octagon 4",
    rle: `#N Octagon 4
#C Variant of the octagon with different symmetry
#T Still Life
#G 8x8 Patterns
x = 8, y = 8
3b2o3b$2bo2bo2b$bo4bob$o6bo$o6bo$bo4bob$2bo2bo2b$3b2o!`,
    category: "8x8 Patterns",
    description: "Variant of the octagon with different symmetry",
    type: "Still Life"
  },
  mickey_mouse: {
    name: "Mickey Mouse",
    rle: `#N Mickey Mouse
#C Stable pattern resembling Mickey Mouse's head
#T Still Life
#G 8x8 Patterns
x = 8, y = 8
b2o2b2ob$o2bo2bob$o2bo2bob$b2o2b2ob$8b$3b2o3b$3b2o!`,
    category: "8x8 Patterns",
    description: "Stable pattern resembling Mickey Mouse's head",
    type: "Still Life"
  },

  // Original 9x9 Patterns
  pulsar_generator: {
    name: "Pulsar Generator",
    rle: `#N Pulsar Generator
#C Generates a pulsar pattern
#T Generator
#G 9x9 Patterns
x = 9, y = 9
2b5o2b$9b$o7bo$ob3obo$ob2obo$ob3obo$o7bo$9b$2b5o!`,
    category: "9x9 Patterns",
    description: "Generates a pulsar pattern",
    type: "Generator"
  },
  metamorphosis: {
    name: "Metamorphosis",
    rle: `#N Metamorphosis
#C Complex evolution pattern
#T Methuselah
#G 9x9 Patterns
x = 9, y = 9
2b5o2b$bo5bob$obo3obo$o2bobo2o$o3bo3o$o2bobo2o$obo3obo$bo5bob$2b5o!`,
    category: "9x9 Patterns",
    description: "Complex evolution pattern",
    type: "Methuselah"
  },
  // Additional 9x9 Patterns
  factory: {
    name: "Factory",
    rle: `#N Factory
#C Periodically produces smaller patterns
#T Generator
#G 9x9 Patterns
x = 9, y = 9
4bo4b$3bobo3b$3bobo3b$b3ob3ob$o7bo$b3ob3ob$3bobo3b$3bobo3b$4bo!`,
    category: "9x9 Patterns",
    description: "Periodically produces smaller patterns",
    type: "Generator"
  },
  sidecar: {
    name: "Sidecar",
    rle: `#N Sidecar
#C Pattern that modifies behavior of other patterns
#T Generator
#G 9x9 Patterns
x = 9, y = 9
2o7b$o8b$bo7b$2b2o5b$3bo5b$3bob4b$4bo4b$4b2o3b$9b!`,
    category: "9x9 Patterns",
    description: "Pattern that modifies behavior of other patterns",
    type: "Generator"
  }
};

// RLE Parser for converting RLE to pattern matrix
class RLEParser {
  static parse(rle) {
    const lines = rle.split('\n');
    let dimensions = { x: 0, y: 0 };
    let patternData = '';
    
    // Parse dimensions and find pattern data
    for (const line of lines) {
      if (line.startsWith('x =')) {
        const match = line.match(/x\s*=\s*(\d+),\s*y\s*=\s*(\d+)/);
        if (match) {
          dimensions.x = parseInt(match[1]);
          dimensions.y = parseInt(match[2]);
        }
      } else if (!line.startsWith('#')) {
        patternData += line.trim();
      }
    }
    
    // Create pattern matrix
    const pattern = Array(dimensions.y).fill().map(() => Array(dimensions.x).fill(0));
    let row = 0, col = 0, count = '';
    
    // Parse RLE data
    for (const char of patternData) {
      if (char >= '0' && char <= '9') {
        count += char;
      } else if (char === 'b' || char === 'o') {
        const repeat = count ? parseInt(count) : 1;
        const value = char === 'o' ? 1 : 0;
        for (let i = 0; i < repeat && col < dimensions.x; i++) {
          pattern[row][col++] = value;
        }
        count = '';
      } else if (char === '$') {
        const repeat = count ? parseInt(count) : 1;
        row += repeat;
        col = 0;
        count = '';
      } else if (char === '!') {
        break;
      }
    }
    
    return pattern;
  }
}

export class PatternManager {
  // Get all available patterns
  static getPatterns() {
    // Convert RLE patterns to matrix format for backward compatibility
    return Object.entries(PATTERNS).reduce((acc, [key, pattern]) => {
      acc[key] = {
        ...pattern,
        pattern: RLEParser.parse(pattern.rle)
      };
      return acc;
    }, {});
  }

  // Get a specific pattern by key
  static getPattern(patternKey) {
    const pattern = PATTERNS[patternKey];
    if (!pattern) return null;
    return {
      ...pattern,
      pattern: RLEParser.parse(pattern.rle)
    };
  }

  // Get pattern names for UI
  static getPatternList() {
    return Object.entries(PATTERNS).map(([key, { name }]) => ({
      key,
      name,
    }));
  }

  static getPatternsByType(type) {
    return Object.entries(PATTERNS)
      .filter(([_, pattern]) => pattern.type === type)
      .map(([key, pattern]) => ({
        key,
        name: pattern.name,
        description: pattern.description,
        category: pattern.category
      }));
  }

  // Group patterns by category
  static getPatternsByCategory() {
    return Object.entries(PATTERNS).reduce((acc, [key, pattern]) => {
      // Use pattern.category directly instead of calculating from pattern.pattern.length
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

  static getPatternsBySize(size) {
    return Object.entries(PATTERNS)
      .filter(([_, pattern]) => {
        const parsedPattern = RLEParser.parse(pattern.rle);
        return parsedPattern.length === size && parsedPattern[0].length === size;
      })
      .map(([key, pattern]) => ({
        key,
        name: pattern.name,
        description: pattern.description,
        category: pattern.category
      }));
  }

  static getCategories() {
    return [...new Set(Object.values(PATTERNS).map(p => p.category))].sort();
  }

  // Get detailed pattern info
  static getPatternInfo(patternKey) {
    const pattern = PATTERNS[patternKey];
    if (!pattern) return null;

    const parsedPattern = RLEParser.parse(pattern.rle);
    return {
      name: pattern.name,
      category: pattern.category,
      description: pattern.description,
      dimensions: this.getPatternDimensions(parsedPattern)
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
