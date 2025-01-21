// utils/PatternManager.js

// Common Conway patterns
const ADDITIONAL_PATTERNS = {
  // 3x3 Patterns
  blse_seed: {
    name: "BLSE Seed",
    pattern: [
      [1, 1, 1],
      [1, 0, 1],
      [0, 0, 1]
    ],
    category: "3x3 Patterns",
    description: "Seed pattern for Block-laying switch engine",
    type: "Generator"
  },
  b_heptomino: {
    name: "B-heptomino",
    pattern: [
      [0, 1, 1],
      [1, 1, 1],
      [0, 1, 0]
    ],
    category: "3x3 Patterns",
    description: "A common Methuselah pattern that evolves chaotically",
    type: "Methuselah"
  },
  pi_heptomino: {
    name: "Pi-heptomino",
    pattern: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1]
    ],
    category: "3x3 Patterns",
    description: "Pi-shaped pattern that creates interesting evolution",
    type: "Methuselah"
  },
  c_heptomino: {
    name: "C-heptomino",
    pattern: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 1]
    ],
    category: "3x3 Patterns",
    description: "C-shaped pattern with chaotic evolution",
    type: "Methuselah"
  },

  // 4x4 Patterns
  traffic_light: {
    name: "Traffic Light",
    pattern: [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0]
    ],
    category: "4x4 Patterns",
    description: "Simple period 2 oscillator resembling traffic lights",
    type: "Oscillator"
  },
  box_ties: {
    name: "Box-ties",
    pattern: [
      [1, 1, 1, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1]
    ],
    category: "4x4 Patterns",
    description: "Stable pattern that looks like a box with ties",
    type: "Still Life"
  },
  mock_block: {
    name: "Mock Block",
    pattern: [
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 1, 0]
    ],
    category: "4x4 Patterns",
    description: "Stable pattern that resembles a block",
    type: "Still Life"
  },

  // 5x5 Patterns
  dollar_sign: {
    name: "Dollar Sign",
    pattern: [
      [0, 1, 1, 1, 0],
      [1, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 1],
      [0, 1, 1, 1, 0]
    ],
    category: "5x5 Patterns",
    description: "Pattern resembling a dollar sign symbol",
    type: "Still Life"
  },
  octagon2: {
    name: "Octagon 2",
    pattern: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0]
    ],
    category: "5x5 Patterns",
    description: "Stable octagonal pattern",
    type: "Still Life"
  },
  cross: {
    name: "Cross",
    pattern: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0]
    ],
    category: "5x5 Patterns",
    description: "Cross-shaped pattern that evolves interestingly",
    type: "Methuselah"
  },

  // 6x6 Patterns
  dragon: {
    name: "Dragon",
    pattern: [
      [1, 1, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 0, 1],
      [0, 0, 0, 0, 1, 1]
    ],
    category: "6x6 Patterns",
    description: "Dragon-shaped pattern with interesting evolution",
    type: "Methuselah"
  },
  turtle: {
    name: "Turtle",
    pattern: [
      [0, 0, 1, 1, 0, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 1, 0, 0, 1, 0],
      [1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0]
    ],
    category: "6x6 Patterns",
    description: "Turtle-shaped stable pattern",
    type: "Still Life"
  },
  aircraft_carrier_bridge: {
    name: "Aircraft Carrier Bridge",
    pattern: [
      [1, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 1, 1]
    ],
    category: "6x6 Patterns",
    description: "Stable pattern combining aircraft carriers with bridges",
    type: "Still Life"
  },

  // 7x7 Patterns
  burloaferimeter: {
    name: "Burloaferimeter",
    pattern: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 0, 0]
    ],
    category: "7x7 Patterns",
    description: "Stable pattern with loafer-like properties",
    type: "Still Life"
  },
  elevator: {
    name: "Elevator",
    pattern: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0]
    ],
    category: "7x7 Patterns",
    description: "Period 2 oscillator that moves up and down",
    type: "Oscillator"
  },
  halfback: {
    name: "Halfback",
    pattern: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 1, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 1, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0]
    ],
    category: "7x7 Patterns",
    description: "Complex oscillator with period 4",
    type: "Oscillator"
  },

  // 8x8 Patterns
  spark_coil: {
    name: "Spark Coil",
    pattern: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0]
    ],
    category: "8x8 Patterns",
    description: "Period 2 oscillator with sparks",
    type: "Oscillator"
  },
  rattlesnake: {
    name: "Rattlesnake",
    pattern: [
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1]
    ],
    category: "8x8 Patterns",
    description: "Stable pattern resembling a coiled snake",
    type: "Still Life"
  },
  washing_machine: {
    name: "Washing Machine",
    pattern: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0]
    ],
    category: "8x8 Patterns",
    description: "Period 2 oscillator that resembles a washing machine",
    type: "Oscillator"
  },

  // 9x9 Patterns
  phoenix: {
    name: "Phoenix",
    pattern: [
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 1, 1]
    ],
    category: "9x9 Patterns",
    description: "Period 2 oscillator that rebuilds itself",
    type: "Oscillator"
  },
  snark: {
    name: "Snark",
    pattern: [
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0]
    ],
    category: "9x9 Patterns",
    description: "Stable symmetric pattern with interesting properties",
    type: "Still Life"
  },
  jason_p156: {
    name: "Jason's P156",
    pattern: [
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [1, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 1],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0]
    ],
    category: "9x9 Patterns",
    description: "Period 156 oscillator discovered by Jason Summers",
    type: "Oscillator"
  },
  legend: {
    name: "Legend",
    pattern: [
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0]
    ],
    category: "9x9 Patterns",
    description: "Complex stable pattern with symmetrical design",
    type: "Still Life"
  }
};


const PATTERNS = {
  ...ADDITIONAL_PATTERNS,
  // 3x3 Patterns
  glider: {
    name: "Glider",
    pattern: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1]
    ],
    category: "3x3 Patterns",
    description: "Classic moving pattern that travels diagonally",
    type: "Spaceship"
  },
  blinker3: {
    name: "Blinker",
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0]
    ],
    category: "3x3 Patterns",
    description: "Simple oscillator that alternates between horizontal and vertical",
    type: "Oscillator"
  },
  r_pentomino: {
    name: "R-pentomino",
    pattern: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 1, 0]
    ],
    category: "3x3 Patterns",
    description: "Chaotic pattern that evolves for many generations",
    type: "Methuselah"
  },

  // 4x4 Patterns
  beacon: {
    name: "Beacon",
    pattern: [
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 1, 1]
    ],
    category: "4x4 Patterns",
    description: "Period 2 oscillator that blinks between two states",
    type: "Oscillator"
  },
  toad: {
    name: "Toad",
    pattern: [
      [0, 0, 0, 0],
      [0, 1, 1, 1],
      [1, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    category: "4x4 Patterns",
    description: "Period 2 oscillator that appears to hop back and forth",
    type: "Oscillator"
  },

  // 5x5 Patterns
  glider_gun_seed: {
    name: "Glider Gun Seed",
    pattern: [
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0]
    ],
    category: "5x5 Patterns",
    description: "Seed pattern that can evolve into complex structures",
    type: "Generator"
  },
  pentadecathlon_seed: {
    name: "Pentadecathlon Seed",
    pattern: [
      [0, 0, 1, 0, 0],
      [1, 1, 0, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0]
    ],
    category: "5x5 Patterns",
    description: "Seeds a period 15 oscillator",
    type: "Oscillator"
  },

  // 6x6 Patterns
  puffer: {
    name: "Puffer",
    pattern: [
      [1, 1, 1, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1],
      [0, 0, 0, 1, 0, 1],
      [0, 0, 0, 0, 1, 0]
    ],
    category: "6x6 Patterns",
    description: "Leaves behind a trail as it moves",
    type: "Puffer"
  },
  loafer: {
    name: "Loafer",
    pattern: [
      [0, 1, 1, 0, 0, 0],
      [1, 0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 1, 0]
    ],
    category: "6x6 Patterns",
    description: "Slow-moving spaceship",
    type: "Spaceship"
  },

  // 7x7 Patterns
  weekender: {
    name: "Weekender",
    pattern: [
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 0, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 1, 0, 0]
    ],
    category: "7x7 Patterns",
    description: "Period 7 oscillator",
    type: "Oscillator"
  },
  unix: {
    name: "Unix",
    pattern: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0]
    ],
    category: "7x7 Patterns",
    description: "Stable symmetric pattern",
    type: "Still Life"
  },

  // 8x8 Patterns
  gospel_gun: {
    name: "Gospel Gun Components",
    pattern: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0]
    ],
    category: "8x8 Patterns",
    description: "Component of the famous Gosper Glider Gun",
    type: "Generator"
  },
  figure_eight: {
    name: "Figure Eight",
    pattern: [
      [1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1],
      [0, 0, 0, 0, 0, 1, 1, 1],
      [0, 0, 0, 0, 0, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    category: "8x8 Patterns",
    description: "Period 8 oscillator",
    type: "Oscillator"
  },

  // 9x9 Patterns
  pulsar_generator: {
    name: "Pulsar Generator",
    pattern: [
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0]
    ],
    category: "9x9 Patterns",
    description: "Generates a pulsar pattern",
    type: "Generator"
  },
  metamorphosis: {
    name: "Metamorphosis",
    pattern: [
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0]
    ],
    category: "9x9 Patterns",
    description: "Complex evolution pattern",
    type: "Methuselah"
  }
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
      const size = pattern.pattern.length;
      const category = `${size}x${size} Patterns`;
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push({
        key,
        name: pattern.name,
        description: pattern.description,
      });
      
      return acc;
    }, {});
  }

  static getPatternsBySize(size) {
    return Object.entries(PATTERNS)
      .filter(([_, pattern]) => 
        pattern.pattern.length === size && 
        pattern.pattern[0].length === size)
      .map(([key, pattern]) => ({
        key,
        name: pattern.name,
        description: pattern.description,
        category: pattern.category
      }));
  }

  static getCategories() {
    const sizes = new Set(Object.values(PATTERNS).map(p => p.pattern.length));
    return Array.from(sizes).sort().map(size => `${size}x${size} Patterns`);
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
