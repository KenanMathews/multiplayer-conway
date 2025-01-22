import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useGame } from '@/context/GameContext';

const AvailableRooms = ({ onJoinRoom, username, isJoining }) => {
  const { availableRooms } = useGame();
  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pb-3">
        <CardDescription>
          Available Rooms ({availableRooms.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-2 max-h-48 overflow-y-auto">
        {availableRooms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No available rooms found
          </p>
        ) : (
          availableRooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{room.host}'s Game</p>
                <p className="text-xs text-muted-foreground">
                  {room.players}/{room.maxPlayers} Players • Code: {room.id}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!username || isJoining}
                onClick={() => onJoinRoom(room.id)}
              >
                <Users className="h-4 w-4 mr-2" />
                Join
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </div>
  );
};

export default AvailableRooms;