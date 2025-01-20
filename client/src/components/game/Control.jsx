// components/game/Control.jsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause } from "lucide-react";
import { TurnPhase } from '../../types/game';
import { socket } from '../../utils/socket';

const Control = ({ isCurrentTurn, currentPhase, currentTeam }) => {
  const handleSimulate = () => {
    if (!isCurrentTurn || currentPhase !== TurnPhase.PLACEMENT) return;
    socket.emit('simulate_generation');
  };

  const getStatusText = () => {
    if (!isCurrentTurn) return "Opponent's Turn";
    if (currentPhase === TurnPhase.PLACEMENT) return "Place Your Cells";
    return "Simulating...";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-2 font-semibold">
              {getStatusText()}
            </div>
            
            <Button
              className="w-full"
              onClick={handleSimulate}
              disabled={!isCurrentTurn || currentPhase !== TurnPhase.PLACEMENT}
            >
              {currentPhase === TurnPhase.SIMULATION ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Control;