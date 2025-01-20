// components/game/Stats.jsx
import React from 'react';
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Stats = ({ gameState }) => {
  const totalCells = gameState.settings.gridSize * gameState.settings.gridSize;
  const redPercentage = (gameState.redTerritory / totalCells) * 100;
  const bluePercentage = (gameState.blueTerritory / totalCells) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                  Score: {player.team === 'red' ? gameState.redTerritory : gameState.blueTerritory}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Territory Control</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Stats;