// src/rooms/RoomManager.js
const { CellState, GameStatus, TeamColors, TurnPhase, PATTERN_RATIO } = require('../constants/gameConstants');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(gameId, settings) {
    if (this.rooms.has(gameId)) {
      throw new Error('Room already exists');
    }

    const room = {
      id: gameId,
      players: [],
      settings: {
        ...settings,
        isPrivate: settings.isPrivate || false
      },
      status: GameStatus.WAITING,
      grid: this._createEmptyGrid(settings.gridSize),
      currentTurn: null,
      currentPlayerId: null
    };

    this.rooms.set(gameId, room);
    return room;
  }

  getAvailableRooms() {
    let availableRooms = [];
    
    for (const [id, room] of this.rooms) {
      // Only include public rooms that are waiting and not full
      if (room.status === GameStatus.WAITING && 
          room.players.length < room.settings.maxPlayers &&
          !room.settings.isPrivate) {
        
        // Find the host player
        const host = room.players.find(player => player.isHost);
        availableRooms.push({
          id: id,
          host: host ? host.username : 'Unknown',
          players: room.players.length,
          maxPlayers: room.settings.maxPlayers,
          gridSize: room.settings.gridSize,
          turnTime: room.settings.turnTime,
          isPrivate: false
        });
      }
    }
    return availableRooms;
  }

  roomExists(gameId) {
    return this.rooms.has(gameId);
  }

  _createEmptyGrid(size) {
    return Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY));
  }

  shouldStartGame(room) {
    if (!room || room.status !== GameStatus.WAITING) return false;

    return (
      this._hasMinimumPlayers(room) &&
      this._areAllPlayersReady(room) &&
      this._areAllPlayersOnTeams(room) &&
      this._areTeamsBalanced(room)
    );
  }

  _hasMinimumPlayers(room) {
    return room.players.length >= room.settings.minPlayersToStart;
  }

  _areAllPlayersReady(room) {
    return room.players.every(player => player.ready || player.isReady);
  }

  _areAllPlayersOnTeams(room) {
    return room.players.every(player => player.team);
  }

  _areTeamsBalanced(room) {
    const redTeamCount = room.players.filter(p => p.team === TeamColors.RED).length;
    const blueTeamCount = room.players.filter(p => p.team === TeamColors.BLUE).length;
    return redTeamCount === 1 && blueTeamCount === 1;
  }

  updateRoom(gameId, updates) {
    const room = this.getRoom(gameId);
    if (!room) return null;

    const updatedRoom = { ...room, ...updates };
    
    if (this.shouldStartGame(updatedRoom) && updatedRoom.status === GameStatus.WAITING) {
      updatedRoom.status = GameStatus.PLAYING;
      updatedRoom.currentTurn = this.initializeGameTurn(updatedRoom);
    }

    this.rooms.set(gameId, updatedRoom);
    return updatedRoom;
  }

  getRoom(gameId) {
    return this.rooms.get(gameId);
  }

  removeRoom(gameId) {
    console.trace()
    console.log('Removing room:', gameId);
    if (this.rooms.has(gameId)) {
      this.rooms.delete(gameId);
      return true;
    }
    return false;
  }

  canJoinRoom(gameId) {
    const room = this.getRoom(gameId);
    if (!room) return false;

    return (
      room.status === GameStatus.WAITING && 
      room.players.length < room.settings.maxPlayers
    );
  }

  isPrivateRoom(gameId) {
    const room = this.getRoom(gameId);
    return room ? room.settings.isPrivate : false;
  }

  isValidTeamSelection(gameId, team) {
    const room = this.getRoom(gameId);
    if (!room) return false;

    return !room.players.some(player => player.team === team);
  }

  initializeGameTurn(room) {
    const redPlayer = room.players.find(p => p.team === TeamColors.RED);
    const initialGeneration = 0;
    
    // For pattern turns, start with pattern size selection
    if (this._isPatternTurn({ ...room, currentTurn: { generation: initialGeneration } })) {
      return {
        playerId: redPlayer.id,
        team: TeamColors.RED,
        phase: TurnPhase.PATTERN_SIZE_SELECTION,
        patternSize: Math.floor(Math.random() * 7) + 3, // 3 to 9
        startTime: Date.now(),
        generation: initialGeneration
      };
    }
  
    // Regular turn initialization
    return {
      playerId: redPlayer.id,
      team: TeamColors.RED,
      phase: TurnPhase.PLACEMENT,
      startTime: Date.now(),
      generation: initialGeneration
    };
  }

  isValidMove(gameId, playerId, x, y) {
    const room = this.getRoom(gameId);
    if (!room) return false;
  
    // Check if we're in a valid phase for moves
    const validPhases = [TurnPhase.PLACEMENT, TurnPhase.PLACEMENT];
    if (!validPhases.includes(room.currentTurn.phase)) {
      console.log('Invalid phase for move:', room.currentTurn.phase);
      return false;
    }
  
    return (
      room.status === GameStatus.PLAYING &&
      room.currentTurn.playerId === playerId &&
      this._isWithinGridBounds(room, x, y) &&
      room.grid[y][x] === CellState.EMPTY
    );
  }

  _isWithinGridBounds(room, x, y) {
    return (
      x >= 0 && 
      x < room.settings.gridSize &&
      y >= 0 && 
      y < room.settings.gridSize
    );
  }

  isTurnTimeout(gameId) {
    const room = this.getRoom(gameId);
    if (!room?.currentTurn?.startTime) return false;

    const elapsed = (Date.now() - room.currentTurn.startTime) / 1000;
    return elapsed >= room.settings.turnTime;
  }

  isValidPatternMove(gameId, playerId, x, y, pattern) {
    const room = this.getRoom(gameId);
    console.log('isValidPatternMove', room, pattern);
    if (!room || !this._isPatternTurn(room)) return false;

    if (room.currentTurn.phase !== TurnPhase.PLACEMENT) {
      return false;
    }

    if (pattern.length !== room.currentTurn.patternSize ||
        pattern[0].length !== room.currentTurn.patternSize) {
      return false;
    }

    if (!this.isValidMove(gameId, playerId, x, y)) return false;

    return this._doesPatternFit(room, pattern, x, y);
  }

  _isPatternTurn(room) {
    return room.currentTurn.generation % PATTERN_RATIO === 0;
  }

  _doesPatternFit(room, pattern, x, y) {
    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;

    if (!this._isPatternWithinBounds(room, patternWidth, patternHeight, x, y)) {
      return false;
    }

    return this._arePatternCellsEmpty(room, pattern, x, y);
  }

  _isPatternWithinBounds(room, width, height, x, y) {
    return (
      x + width <= room.settings.gridSize &&
      y + height <= room.settings.gridSize
    );
  }

  _arePatternCellsEmpty(room, pattern, startX, startY) {
    return pattern.every((row, i) =>
      row.every((cell, j) =>
        cell === 0 || room.grid[startY + i][startX + j] === CellState.EMPTY
      )
    );
  }

  enforcePatternTurn(gameId) {
    const room = this.getRoom(gameId);
    return room ? this._isPatternTurn(room) : false;
  }
}

module.exports = new RoomManager();