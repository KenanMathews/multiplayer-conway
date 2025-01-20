// Lobby.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Copy, Users, Loader2 } from "lucide-react";
import { useGame } from '../context/GameContext';
import { GameStatus } from '../types/game';
import JoinGameForm from '@/components/lobby/JoinGameForm';
import { socket } from '../utils/socket';

// Components
const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
    <Card className="w-full max-w-md p-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <CardTitle>Loading Game...</CardTitle>
        <CardDescription>Please wait while we connect to the game</CardDescription>
      </div>
    </Card>
  </div>
);

const PlayerCard = ({ player, isHost }) => (
  <Card className="relative">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`h-8 w-8 rounded-full ${
              player.team === 'red'
                ? 'bg-red-500'
                : player.team === 'blue'
                ? 'bg-blue-500'
                : 'bg-gray-300'
            }`}
          />
          <div>
            <p className="font-semibold">{player.username}</p>
            <p className="text-sm text-muted-foreground">
              {player.team ? `${player.team} Team` : 'No team selected'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHost && <Badge variant="secondary">Host</Badge>}
          <Badge variant={(player.isReady || player.ready) ? "success" : "outline"}>
            {(player.isReady || player.ready) ? "Ready" : "Not Ready"}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

const GameSettings = ({ settings }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold">Game Settings</h3>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-muted-foreground">Grid Size</p>
        <p>{settings.gridSize} x {settings.gridSize}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Turn Time</p>
        <p>{settings.turnTime} seconds</p>
      </div>
    </div>
  </div>
);

const JoinGameSection = ({ gameState, onJoin, isJoining }) => (
  <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join Game</CardTitle>
        <CardDescription>
          {gameState 
            ? `Join the game lobby (${gameState.players.length}/${gameState.settings.maxPlayers} players)`
            : 'Enter your username to join the game'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <JoinGameForm onJoin={onJoin} isLoading={isJoining} />
      </CardContent>
    </Card>
  </div>
);

const TeamSelection = ({ onSelectTeam, players }) => (
  <div className="flex gap-2">
    <Button
      variant="outline"
      onClick={() => onSelectTeam('red')}
      className="border-red-500 hover:bg-red-500/10"
      disabled={players.some(p => p.team === 'red')}
    >
      Join Red Team
    </Button>
    <Button
      variant="outline"
      onClick={() => onSelectTeam('blue')}
      className="border-blue-500 hover:bg-blue-500/10"
      disabled={players.some(p => p.team === 'blue')}
    >
      Join Blue Team
    </Button>
  </div>
);

const Lobby = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { gameState, joinGame, selectTeam, setReady } = useGame();

  useEffect(() => {
    if (gameState && gameState.id === gameId) {
      setIsLoading(false);
    }
  }, [gameState, gameId]);

  useEffect(() => {
    if (gameState?.status === GameStatus.PLAYING) {
      navigate(`/game/${gameId}`);
    }
  }, [gameState?.status, gameId, navigate]);

  useEffect(() => {
    const handleGameStart = () => {
      toast({
        title: "Game is starting!",
        description: "All players are ready. Redirecting to game...",
      });
    };

    const handleGameError = (error) => {
      toast({
        variant: "destructive",
        title: "Game Error",
        description: error.message || "An error occurred in the game",
      });
    };

    socket.on('game_started', handleGameStart);
    socket.on('game_error', handleGameError);

    return () => {
      socket.off('game_started', handleGameStart);
      socket.off('game_error', handleGameError);
    };
  }, [toast]);

  const handleJoinGame = async (username) => {
    setIsJoining(true);
    try {
      await joinGame(gameId, username);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to join game",
        description: error.message || "Please try again later",
      });
      navigate('/');
    } finally {
      setIsJoining(false);
    }
  };

  const handleReady = () => {
    try {
      const currentPlayer = gameState.players.find(player => player.id === socket.id);
      const currentReadyStatus = currentPlayer?.isReady || currentPlayer?.ready || false;
      setReady(!currentReadyStatus);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ready status",
      });
    }
  };

  const copyGameCode = () => {
    if (!gameId) return;
    
    navigator.clipboard.writeText(gameId);
    toast({
      title: "Game code copied!",
      description: "Share this code with your friend to join the game.",
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const isUserInGame = gameState?.players?.some(player => player.id === socket.id);
  if (!gameState || !isUserInGame) {
    return (
      <>
        <Toaster />
        <JoinGameSection 
          gameState={gameState} 
          onJoin={handleJoinGame} 
          isJoining={isJoining} 
        />
      </>
    );
  }

  const currentPlayer = gameState.players.find(player => player.id === socket.id);
  
  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Game Lobby</CardTitle>
                <CardDescription>
                  {gameState.status === GameStatus.STARTING 
                    ? "Game is about to start..."
                    : "Waiting for players to join"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={copyGameCode}
              >
                <span className="font-mono">{gameId}</span>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Players</h3>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{gameState.players.length}/{gameState.settings.maxPlayers}</span>
                </div>
              </div>

              <div className="grid gap-4">
                {gameState.players.map((player) => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    isHost={player.isHost}
                  />
                ))}
              </div>
            </div>

            <Separator />
            <GameSettings settings={gameState.settings} />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              Leave Game
            </Button>
            
            {!currentPlayer?.team ? (
              <TeamSelection 
                onSelectTeam={selectTeam} 
                players={gameState.players} 
              />
            ) : (
              <Button
                onClick={handleReady}
                variant={(currentPlayer.isReady || currentPlayer.ready) ? "outline" : "default"}
                disabled={gameState.status === GameStatus.STARTING}
              >
                {(currentPlayer.isReady || currentPlayer.ready) ? "Not Ready" : "Ready"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default Lobby;