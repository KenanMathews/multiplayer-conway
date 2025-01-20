import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Stats = ({ gameState }) => {
  const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
  const redPercentage = (gameState.redTerritory / totalCells) * 100;
  const bluePercentage = (gameState.blueTerritory / totalCells) * 100;

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-8">
        {/* Territory Control */}
        <div className="space-y-4">
          <h3 className="font-semibold">Territory Control</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Red Team</span>
              <span>{Math.round(redPercentage)}%</span>
            </div>
            <Progress value={redPercentage} className="bg-blue-200">
              <div
                className="h-full bg-red-500"
                style={{ width: `${redPercentage}%` }}
              />
            </Progress>

            <div className="flex justify-between text-sm">
              <span>Blue Team</span>
              <span>{Math.round(bluePercentage)}%</span>
            </div>
            <Progress value={bluePercentage} className="bg-red-200">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${bluePercentage}%` }}
              />
            </Progress>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-4">
          <h3 className="font-semibold">Players</h3>
          <div className="grid grid-cols-2 gap-4">
            {gameState.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      player.team === 'red' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-medium">{player.username}</span>
                </div>
                <Badge variant="outline">
                  {player.team === 'red' ? gameState.redTerritory : gameState.blueTerritory}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Stats;