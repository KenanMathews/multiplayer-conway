const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const SocketHandlers = require("./handlers/SocketHandlers");

class GameServer {
  constructor(port = process.env.PORT || 3001) {
    this.port = port;
    this.setupServer();
    this.setupSocketIO();
    this.initializeEventHandlers();
  }

  setupServer() {
    this.app = express();
    this.app.use(cors());
    this.server = http.createServer(this.app);
  }

  setupSocketIO() {
    this.io = new Server(this.server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });
  }

  initializeEventHandlers() {
    const handlers = new SocketHandlers(this.io);
    
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      handlers.attachHandlers(socket);
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

// Create and start the server
const gameServer = new GameServer();
gameServer.start();

module.exports = GameServer;