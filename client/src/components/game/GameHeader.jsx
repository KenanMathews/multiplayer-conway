import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward } from "lucide-react";
import { useGame } from '@/context/GameContext';
import { GameStatus, TeamColor, TurnPhase } from '@/types/game';
import Timer from './Timer';

const SimulationControls = () => {
  const { gameState, pauseSimulation, resumeSimulation, skipSimulation } = useGame();
  const remainingGenerations = gameState.currentTurn?.remainingGenerations || 0;
  const isPaused = gameState.currentTurn?.phase !== TurnPhase.SIMULATION;

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm font-medium">
        Generations left: {remainingGenerations}
      </div>
      <div className="flex gap-1">
        <Button 
          variant="outline" 
          size="sm"
          onClick={isPaused ? resumeSimulation : pauseSimulation}
          disabled={gameState.status !== GameStatus.PLAYING}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={skipSimulation}
          disabled={gameState.status !== GameStatus.PLAYING}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const TerritoryDisplay = ({ redTerritory, blueTerritory, gridSize, territoryThreshold }) => {
  const totalCells = gridSize * gridSize;
  const redPercentage = ((redTerritory / totalCells) * 100).toFixed(1);
  const bluePercentage = ((blueTerritory / totalCells) * 100).toFixed(1);

  return (
    <div className="flex gap-4 text-sm">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className={redPercentage >= territoryThreshold ? "font-bold" : ""}>
          {redPercentage}%
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className={bluePercentage >= territoryThreshold ? "font-bold" : ""}>
          {bluePercentage}%
        </span>
      </div>
      {territoryThreshold && (
        <div className="text-xs text-gray-500">
          (Threshold: {territoryThreshold}%)
        </div>
      )}
    </div>
  );
};

const GameHeader = ({ isCurrentTurn }) => {
  const { gameState } = useGame();
  const isSimulating = gameState.currentTurn?.phase === TurnPhase.SIMULATION;
  const territoryThreshold = gameState.settings?.territoryThresholdEnabled 
    ? gameState.settings.territoryThreshold 
    : null;

  const getStatusMessage = () => {
    if (gameState.status === GameStatus.FINISHED) {
      const winnerTeam = gameState.winner?.team;
      return winnerTeam
        ? `${winnerTeam.toUpperCase()} Team Wins!`
        : "It's a Draw!";
    }
    if (isSimulating) {
      return "Simulation in Progress...";
    }
    return null;
  };

  return (
    <Card className="p-2">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          {gameState.players.map((player) => (
            <div 
              key={player.id} 
              className={`flex items-center gap-2 ${
                gameState.currentTurn?.playerId === player.id && !isSimulating 
                  ? "font-bold" 
                  : ""
              }`}
            >
              <div 
                className={`w-2 h-2 rounded-full ${
                  player.team === TeamColor.RED ? 'bg-red-500' : 'bg-blue-500'
                }`} 
              />
              <span className="text-sm">
                {player.username}
                {player.timeoutWarnings > 0 && 
                  ` (${player.timeoutWarnings}/${gameState.settings.maxTimeoutWarnings})`
                }
              </span>
            </div>
          ))}
          <TerritoryDisplay 
            redTerritory={gameState.redTerritory}
            blueTerritory={gameState.blueTerritory}
            gridSize={gameState.settings.gridSize}
            territoryThreshold={territoryThreshold}
          />
        </div>
        <div className="flex items-center gap-4">
          {isSimulating ? (
            <SimulationControls />
          ) : (
            <Timer
              turnStartTime={gameState.currentTurn.startTime}
              turnDuration={gameState.settings.turnTime}
              isCurrentTurn={isCurrentTurn}
              disabled={isSimulating}
            />
          )}
        </div>
      </div>
      {getStatusMessage() && (
        <div className="mt-2 text-center font-medium">
          {getStatusMessage()}
        </div>
      )}
    </Card>
  );
};

export default GameHeader;