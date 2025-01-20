import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGame } from '../context/GameContext';
import { GameStatus } from '../types/game';
import Grid from '../components/game/Grid';
import PatternControl from '../components/game/PatternControl';
import Stats from '../components/game/Stats';
import Timer from '../components/game/Timer';
import { socket } from '../utils/socket';

const Game = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const { gameState } = useGame();
  const [previewPattern, setPreviewPattern] = useState(null);
  const [activeTab, setActiveTab] = useState("game");

  // Redirect if game is not in PLAYING state
  useEffect(() => {
    if (!gameState || gameState?.status !== GameStatus.PLAYING) {
      navigate(`/lobby/${gameId}`);
    }
  }, [gameState, gameId, navigate]);

  if (!gameState || gameState.status !== GameStatus.PLAYING) {
    return null;
  }

  const currentPlayer = gameState.players.find(p => p.id === socket.id);
  const isCurrentTurn = gameState.currentTurn.playerId === socket.id;

  return (
    <div className="h-screen bg-gradient-to-b from-background to-muted p-4 overflow-hidden">
      <div className="container mx-auto h-full max-w-7xl flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="game">Game</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>
            
            {/* Timer always visible */}
            <Timer
              turnStartTime={gameState.currentTurn.startTime}
              turnDuration={gameState.settings.turnTime}
              isCurrentTurn={isCurrentTurn}
            />
          </div>

          <div className="flex-1 min-h-0"> {/* This wrapper ensures proper scrolling */}
            <TabsContent value="game" className="h-full m-0">
              <div className="h-full flex flex-col lg:flex-row gap-4">
                {/* Game Grid - Always visible on larger screens */}
                <Card className="flex-1 p-4 min-h-0">
                  <Grid
                    grid={gameState.grid}
                    gridSize={gameState.settings.gridSize}
                    currentTeam={gameState.currentTurn.team}
                    isCurrentTurn={isCurrentTurn}
                    previewPattern={previewPattern}
                  />
                </Card>

                {/* Pattern Controls - Only on larger screens */}
                <div className="hidden lg:block w-80 overflow-y-auto">
                  <Card className="p-4 sticky top-0">
                    <PatternControl
                      isCurrentTurn={isCurrentTurn}
                      currentPhase={gameState.currentTurn.phase}
                      currentTeam={currentPlayer?.team}
                      currentGeneration={gameState.currentTurn.generation}
                      setPreviewPattern={setPreviewPattern}
                    />
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="h-full m-0 overflow-y-auto">
              <Card className="p-4">
                <Stats gameState={gameState} />
              </Card>
            </TabsContent>

            <TabsContent value="controls" className="h-full m-0 overflow-y-auto">
              <Card className="p-4">
                <PatternControl
                  isCurrentTurn={isCurrentTurn}
                  currentPhase={gameState.currentTurn.phase}
                  currentTeam={currentPlayer?.team}
                  currentGeneration={gameState.currentTurn.generation}
                  setPreviewPattern={setPreviewPattern}
                />
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Game;