import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from '../context/GameContext';
import { GameStatus, TurnPhase } from '../types/game';
import Grid from '../components/game/Grid';
import { Progress } from "@/components/ui/progress";
import { socket } from '../utils/socket';
import GameHeader from '../components/game/GameHeader';
import PatternSelectionDialog from '@/components/game/PatternSelectionDialog';

const Game = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const { gameState, confirmPatternSize } = useGame();
  const [previewPattern, setPreviewPattern] = React.useState(null);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = React.useState(false);

  // Derived state
  const currentPlayer = gameState?.players?.find(p => p.id === socket.id);
  const isCurrentTurn = gameState?.currentTurn?.playerId === socket.id;
  const currentPhase = gameState?.currentTurn?.phase;
  const patternSize = gameState?.currentTurn?.patternSize;

  // Clear preview pattern when turn changes
  React.useEffect(() => {
    if (gameState?.currentTurn?.playerId) {
      setPreviewPattern(null);
    }
  }, [gameState?.currentTurn?.playerId]);

  // Open pattern dialog for size selection or placement
  React.useEffect(() => {
    if (isCurrentTurn && 
        (currentPhase === TurnPhase.PATTERN_SIZE_SELECTION || 
         (currentPhase === TurnPhase.PLACEMENT && !previewPattern))) {
      setIsPatternDialogOpen(true);
    }
  }, [currentPhase, isCurrentTurn, previewPattern]);

  // Redirect if game is not in PLAYING state
  React.useEffect(() => {
    if (!gameState || gameState.status !== GameStatus.PLAYING) {
      navigate(`/`);
    }
  }, [gameState, gameId, navigate]);

  if (!gameState || gameState.status !== GameStatus.PLAYING) {
    return null;
  }

  const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
  const redPercentage = (gameState.redTerritory / totalCells) * 100;
  const bluePercentage = (gameState.blueTerritory / totalCells) * 100;

  const handlePatternSelect = (pattern) => {
    setPreviewPattern(pattern);
  };

  return (
    <div className="min-h-screen bg-background p-2 md:p-4">
      <div className="container mx-auto h-full flex flex-col gap-4 max-w-6xl">
        {/* Top Stats Bar */}
        <div className="flex-none">
          <GameHeader isCurrentTurn={isCurrentTurn} />
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex justify-center items-center flex-1">
            <div className="relative w-full max-w-xl aspect-square">
              <Card className="absolute inset-0 p-2 md:p-4">
                <Grid
                  grid={gameState.grid}
                  gridSize={gameState.settings.gridSize}
                  currentTeam={gameState.currentTurn?.team}
                  isCurrentTurn={isCurrentTurn}
                  previewPattern={previewPattern}
                />
              </Card>
            </div>
          </div>

          {/* Pattern Controls */}
          {isCurrentTurn && currentPhase === TurnPhase.PLACEMENT && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-2">
                <span className="text-sm text-muted-foreground">
                  {previewPattern ? "Pattern selected" : "No pattern selected"}
                </span>
                <Button
                  variant={previewPattern ? "outline" : "default"}
                  onClick={() => setIsPatternDialogOpen(true)}
                  className="w-40"
                >
                  {previewPattern ? "Change Pattern" : "Select Pattern"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pattern Selection Dialog */}
      {gameState?.currentTurn && (
        <PatternSelectionDialog
          isOpen={isPatternDialogOpen}
          onClose={() => setIsPatternDialogOpen(false)}
          currentTeam={currentPlayer?.team}
          patternSize={patternSize}
          onPatternSelect={handlePatternSelect}
          confirmPatternSize={confirmPatternSize}
        />
      )}
    </div>
  );
};

export default Game;