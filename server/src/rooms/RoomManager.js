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
      settings,
      status: GameStatus.WAITING,
      grid: this._createEmptyGrid(settings.gridSize),
      currentTurn: null,
      currentPlayerId: null
    };

    this.rooms.set(gameId, room);
    return room;
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
    this.rooms.delete(gameId);
  }

  canJoinRoom(gameId) {
    const room = this.getRoom(gameId);
    if (!room) return false;

    return (
      room.status === GameStatus.WAITING && 
      room.players.length < room.settings.maxPlayers
    );
  }

  isValidTeamSelection(gameId, team) {
    const room = this.getRoom(gameId);
    if (!room) return false;

    return !room.players.some(player => player.team === team);
  }

  initializeGameTurn(room) {
    const redPlayer = room.players.find(p => p.team === TeamColors.RED);
    
    return {
      playerId: redPlayer.id,
      team: TeamColors.RED,
      phase: TurnPhase.PLACEMENT,
      startTime: Date.now(),
      generation: 0
    };
  }

  isValidMove(gameId, playerId, x, y) {
    const room = this.getRoom(gameId);
    if (!room) return false;
  
    return (
      room.status === GameStatus.PLAYING &&
      room.currentTurn.playerId === playerId &&
      room.currentTurn.phase === TurnPhase.PLACEMENT &&
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
    if (!room || !this._isPatternTurn(room)) return false;

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