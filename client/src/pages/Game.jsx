import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { useGame } from '../context/GameContext';
import { GameStatus } from '../types/game';
import Grid from '../components/game/Grid';
import PatternControl from '../components/game/PatternControl';
import { Progress } from "@/components/ui/progress";
import { socket } from '../utils/socket';
import GameHeader from '../components/game/GameHeader';

const Game = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const { gameState } = useGame();
  const [previewPattern, setPreviewPattern] = React.useState(null);

  // Redirect if game is not in PLAYING state
  React.useEffect(() => {
    if (!gameState || gameState?.status !== GameStatus.PLAYING) {
      navigate(`/`);
    }
  }, [gameState, gameId, navigate]);

  if (!gameState || gameState.status !== GameStatus.PLAYING) {
    return null;
  }

  const currentPlayer = gameState.players.find(p => p.id === socket.id);
  const isCurrentTurn = gameState.currentTurn.playerId === socket.id;

  const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
  const redPercentage = (gameState.redTerritory / totalCells) * 100;
  const bluePercentage = (gameState.blueTerritory / totalCells) * 100;

  return (
    <div className="h-screen bg-background p-4">
      <div className="container mx-auto h-full flex flex-col gap-4 max-w-6xl">
        {/* Top Stats Bar */}
        <GameHeader isCurrentTurn={isCurrentTurn} />

        {/* Main Game Area */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Pattern Selection Sidebar */}
          <PatternControl
            isCurrentTurn={isCurrentTurn}
            currentTeam={currentPlayer?.team}
            currentGeneration={gameState.currentTurn.generation}
            setPreviewPattern={setPreviewPattern}
          />

          {/* Game Grid and Stats */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Square Grid Container with max size */}
            <div className="flex justify-center items-center flex-1">
              <div className="relative aspect-square w-full max-w-xl max-h-xl">
                <Card className="absolute inset-0 p-4">
                  <Grid
                    grid={gameState.grid}
                    gridSize={gameState.settings.gridSize}
                    currentTeam={gameState.currentTurn.team}
                    isCurrentTurn={isCurrentTurn}
                    previewPattern={previewPattern}
                  />
                </Card>
              </div>
            </div>

            {/* Bottom Stats */}
            <Card className="p-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>Red Team</span>
                    <span>{Math.round(redPercentage)}%</span>
                  </div>
                  <Progress value={redPercentage} className="h-2" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>Blue Team</span>
                    <span>{Math.round(bluePercentage)}%</span>
                  </div>
                  <Progress value={bluePercentage} className="h-2" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;