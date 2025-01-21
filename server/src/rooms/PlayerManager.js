// src/rooms/PlayerManager.js
const RoomManager = require('./RoomManager');

class PlayerManager {
  addPlayer(gameId, player) {
    console.log('addPlayer', gameId, player);
    if (!RoomManager.canJoinRoom(gameId)) {
      throw new Error('Cannot join room');
    }

    const gameState = RoomManager.getRoom(gameId);
    const standardPlayer = this._createStandardPlayer(player, gameState);
    
    const updatedPlayers = [...gameState.players, standardPlayer];
    return RoomManager.updateRoom(gameId, { players: updatedPlayers });
  }

  _createStandardPlayer(player, gameState) {
    return {
      id: player.id,
      username: player.username,
      team: player.team || null,
      isReady: false,
      ready: false,
      isHost: gameState.players.length === 0,
      connected: true
    };
  }

  removePlayer(gameId, playerId) {
    const gameState = RoomManager.getRoom(gameId);
    if (!gameState) return null;

    const updatedPlayers = gameState.players.filter(p => p.id !== playerId);
    
    if (updatedPlayers.length === 0) {
      RoomManager.removeRoom(gameId);
      return null;
    }

    return RoomManager.updateRoom(gameId, 
      this._handleHostReassignment(gameState, playerId, updatedPlayers)
    );
  }

  _handleHostReassignment(gameState, removedPlayerId, updatedPlayers) {
    const updates = { 
      players: updatedPlayers,
      currentPlayerId: updatedPlayers[0].id
    };

    if (gameState.players.find(p => p.id === removedPlayerId)?.isHost) {
      updatedPlayers[0].isHost = true;
    }

    return updates;
  }

  updatePlayer(gameId, playerId, updates) {
    const gameState = RoomManager.getRoom(gameId);
    if (!gameState) return null;

    this._validateUpdates(gameId, updates);
    const standardizedUpdates = this._standardizeUpdates(updates);
    
    const updatedPlayers = gameState.players.map(player => 
      player.id === playerId ? { ...player, ...standardizedUpdates } : player
    );

    return RoomManager.updateRoom(gameId, { players: updatedPlayers });
  }

  _validateUpdates(gameId, updates) {
    if (updates.team && !RoomManager.isValidTeamSelection(gameId, updates.team)) {
      throw new Error('Invalid team selection');
    }
  }

  _standardizeUpdates(updates) {
    if (updates.hasOwnProperty('ready') || updates.hasOwnProperty('isReady')) {
      const readyStatus = updates.ready || updates.isReady;
      return {
        ...updates,
        ready: readyStatus,
        isReady: readyStatus
      };
    }
    return updates;
  }
}

module.exports = new PlayerManager();