# Multiplayer Conway's Game of Life

A turn-based multiplayer implementation of Conway's Game of Life where two players compete for territory control. Built with React, Socket.IO, and shadcn/ui components.

## Core Features

- Turn-based multiplayer gameplay with territory control mechanics
- Pattern selection and placement system
- Live game state synchronization
- Lobby system for game creation and joining

## Technology Stack

### Frontend
- React (with Vite)
- Socket.IO Client
- shadcn/ui components
- TailwindCSS
- Context API for state management

### Backend
- Node.js
- Socket.IO
- Custom Conway's Game of Life implementation
- Room and player management system

## Project Structure

```
.
├── server/                  # Backend server code
│   ├── src/
│   │   ├── constants/      # Game constants
│   │   ├── game/          # Core game logic
│   │   ├── rooms/         # Room & player management
│   │   └── handlers/      # Socket event handlers
│   └── package.json
│
└── client/                 # Frontend React application
    ├── src/
    │   ├── components/    # React components
    │   │   ├── game/     # Game-specific components
    │   │   └── ui/       # shadcn/ui components
    │   ├── context/      # React Context
    │   ├── hooks/        # Custom hooks
    │   ├── pages/        # Page components
    │   ├── types/        # Type definitions
    │   └── utils/        # Utility functions
    └── package.json
```

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd multiplayer-conway
```

2. Install all dependencies:
```bash
npm run install:deps
```

3. Start development servers:
```bash
npm run dev
```

The development server will be available at `http://localhost:5173`

### Production Deployment

1. Build and start the production server:
```bash
npm run start:prod
```

This will:
- Build the client application
- Install production dependencies
- Start the server in production mode

The production server will be available at `http://localhost:3000` (or your configured PORT)

## Game Rules

1. The game follows Conway's Game of Life rules:
   - Any live cell with fewer than two live neighbors dies (underpopulation)
   - Any live cell with two or three live neighbors lives on to the next generation
   - Any live cell with more than three live neighbors dies (overpopulation)
   - Any dead cell with exactly three live neighbors becomes a live cell (reproduction)

2. Multiplayer specific rules:
   - Two players take turns placing patterns or toggling cells
   - Each player's cells are color-coded
   - Territory is controlled by having more living cells in an area
   - Players compete to control the majority of the grid
   - Victory is achieved through territorial dominance
   - Players can select from predefined patterns or create their own

## Available Scripts

- `npm run install:deps` - Install dependencies for both client and server
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run start:prod` - Build and start the production server

## License

This project is licensed under the MIT License - see the LICENSE file for details.