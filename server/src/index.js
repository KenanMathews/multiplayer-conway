const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
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
    
    if (process.env.NODE_ENV === 'production') {
      // Serve static files from the public directory in production
      const publicPath = path.join(__dirname, '../public');
      this.app.use(express.static(publicPath));
      
      // Handle client-side routing by serving index.html for all routes
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
      });
    } else {
      // Use CORS in development
      this.app.use(cors());
    }
    
    this.server = http.createServer(this.app);
  }

  setupSocketIO() {
    this.io = new Server(this.server, {
      cors: process.env.NODE_ENV === 'production' 
        ? undefined  // No CORS needed in production as we serve frontend from same origin
        : {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
          }
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
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

// Create and start the server
const gameServer = new GameServer();
gameServer.start();

module.exports = GameServer;