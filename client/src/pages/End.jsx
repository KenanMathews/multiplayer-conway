// src/routes/End.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from '@/context/GameContext';
import { Home, RotateCcw, Share2 } from 'lucide-react';
import { TeamColor } from '@/types/game';

const GameStats = ({ gameState }) => {
  const totalGenerations = gameState.currentTurn.generation;
  const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
  const redPercentage = ((gameState.redTerritory / totalCells) * 100).toFixed(1);
  const bluePercentage = ((gameState.blueTerritory / totalCells) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
      <StatCard
        title="Game Duration"
        value={`${totalGenerations} Generations`}
      />
      <StatCard
        title="Final Generation"
        value={`#${totalGenerations}`}
      />
      <StatCard
        title="Red Territory"
        value={`${redPercentage}%`}
        highlight={gameState.winner?.team === TeamColor.RED}
        team={TeamColor.RED}
      />
      <StatCard
        title="Blue Territory"
        value={`${bluePercentage}%`}
        highlight={gameState.winner?.team === TeamColor.BLUE}
        team={TeamColor.BLUE}
      />
    </div>
  );
};

const StatCard = ({ title, value, highlight = false, team }) => (
  <Card className={`p-4 ${highlight ? `border-2 ${team === TeamColor.RED ? 'border-red-500' : 'border-blue-500'}` : ''}`}>
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className={`text-2xl font-bold mt-1 ${team ? (team === TeamColor.RED ? 'text-red-500' : 'text-blue-500') : ''}`}>
      {value}
    </p>
  </Card>
);

const PlayerStats = ({ player, isWinner }) => (
  <Card className={`p-4 ${isWinner ? `border-2 ${player.team === TeamColor.RED ? 'border-red-500' : 'border-blue-500'}` : ''}`}>
    <div className="flex items-center gap-2">
      <div 
        className={`w-3 h-3 rounded-full ${
          player.team === TeamColor.RED ? 'bg-red-500' : 'bg-blue-500'
        }`}
      />
      <h3 className="font-medium">{player.username}</h3>
      {isWinner && (
        <span className={`text-sm font-medium ${
          player.team === TeamColor.RED ? 'text-red-600' : 'text-blue-600'
        }`}>
          Winner
        </span>
      )}
    </div>
    <div className="mt-2 text-sm text-gray-600">
      <p>Timeout Warnings: {player.timeoutWarnings}/{player.settings?.maxTimeoutWarnings}</p>
    </div>
  </Card>
);

const GameEnd = () => {
  const { gameId } = useParams();
  const { gameState } = useGame();
  const navigate = useNavigate();
  console.log(gameState);

  // Redirect to home if no game state or wrong game ID
  React.useEffect(() => {
    if (!gameState || !gameState.winner || gameState.id !== gameId) {
      navigate('/');
    }
  }, [gameState, gameId, navigate]);

  if (!gameState || gameState.id !== gameId) return null;

  const handlePlayAgain = () => {
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/game/${newGameId}`);
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleShareGame = () => {
    const shareUrl = `${window.location.origin}/end/${gameId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      // You might want to add a toast notification here
      alert('Game link copied to clipboard!');
    });
  };

  const getVictoryMessage = () => {
    if (!gameState.winner) return "It's a Draw!";
    return `${gameState.winner.team.toUpperCase()} Team Wins by Territory Control!`;
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card className="p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Game Over</h1>
          <p className="text-xl text-gray-600">{getVictoryMessage()}</p>
          <p className="text-sm text-gray-500 mt-1">Game ID: {gameId}</p>
        </div>

        <GameStats gameState={gameState} />

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {gameState.players.map((player) => (
              <PlayerStats
                key={player.id}
                player={player}
                isWinner={gameState.winner?.id === player.id}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleReturnHome}
          >
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Button>
          <Button
            variant="outline"
            onClick={handleShareGame}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Game
          </Button>
          <Button
            onClick={handlePlayAgain}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default GameEnd;