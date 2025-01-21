import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import GameEnd from './pages/End';

function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:gameId" element={<Lobby />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/end/:gameId" element={<GameEnd />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}

export default App;
