import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Gamepad2, Users, Loader2 } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import CreateGameDialog from '../components/lobby/CreateGameDialog';
import { useGame } from '../context/GameContext';
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const { createNewGame, joinGame } = useGame();
  const { toast } = useToast();

  // State
  const [username, setUsername] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [gridSize, setGridSize] = useState('20');
  const [turnTime, setTurnTime] = useState('30');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGame = async () => {
    if (!username.trim() || !selectedTeam) return;
    
    setIsCreating(true);
    
    try {
      const settings = {
        gridSize: parseInt(gridSize),
        turnTime: parseInt(turnTime),
        maxTimeoutWarnings: 3,
        maxPlayers: 2,
        minPlayersToStart: 2
      };
      
      const gameId = await createNewGame(username, selectedTeam, settings);
      setIsDialogOpen(false);
      setSelectedTeam('');
      navigate(`/lobby/${gameId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating game",
        description: error.message || "Please try again later",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async (e) => {
    e?.preventDefault(); // Make preventDefault optional for keyboard events
    
    // Basic validation
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Username required",
        description: "Please enter a username to join the game",
      });
      return;
    }
    
    if (!gameCode.trim()) {
      toast({
        variant: "destructive",
        title: "Game code required",
        description: "Please enter a game code to join",
      });
      return;
    }
    
    if (isJoining) return;
    
    setIsJoining(true);
    try {
      console.log('Attempting to join game:', { gameCode, username });
      await joinGame(gameCode.trim(), username.trim());
      navigate(`/lobby/${gameCode.trim()}`);
    } catch (error) {
      console.error('Join game error:', error);
      toast({
        variant: "destructive",
        title: "Failed to join game",
        description: error?.message || "Unable to join game. Please check the code and try again.",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && username.trim() && gameCode.trim() && !isJoining && !isCreating) {
      handleJoinGame();
    }
  };

  // Compute button disabled state
  const isJoinButtonDisabled = !username.trim() || !gameCode.trim() || isJoining || isCreating;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Conway's Game</CardTitle>
          <CardDescription>
            Multiplayer Strategy Edition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isCreating || isJoining}
            />
          </div>

          <Separator className="my-4" />
          
          <div className="space-y-4">
            <Button 
              className="w-full h-12"
              onClick={() => setIsDialogOpen(true)}
              disabled={!username.trim() || isCreating || isJoining}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Gamepad2 className="mr-2 h-5 w-5" />
              )}
              {isCreating ? 'Creating Game...' : 'Create New Game'}
            </Button>

            <form onSubmit={handleJoinGame} className="space-y-2">
              <Label htmlFor="gameCode">Or Join Existing Game</Label>
              <div className="flex space-x-2">
                <Input
                  id="gameCode"
                  placeholder="Enter game code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  disabled={isCreating || isJoining}
                />
                <Button 
                  type="submit"
                  disabled={isJoinButtonDisabled}
                  variant="secondary"
                  className="min-w-[50px]"
                >
                  {isJoining ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Challenge your friends in this multiplayer version of Conway's Game of Life
        </CardFooter>
      </Card>

      <CreateGameDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        gridSize={gridSize}
        setGridSize={setGridSize}
        turnTime={turnTime}
        setTurnTime={setTurnTime}
        onCreateGame={handleCreateGame}
        isCreating={isCreating}
      />
    </div>
  );
};

export default Home;