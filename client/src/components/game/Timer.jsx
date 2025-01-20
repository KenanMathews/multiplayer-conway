// components/game/Timer.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Timer = ({ turnStartTime, turnDuration, isCurrentTurn }) => {
  const [timeLeft, setTimeLeft] = useState(turnDuration);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!turnStartTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = (now - turnStartTime) / 1000;
      const remaining = Math.max(0, turnDuration - elapsed);
      const progressValue = (remaining / turnDuration) * 100;

      setTimeLeft(remaining);
      setProgress(progressValue);
    };

    // Update immediately and then every 100ms
    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [turnStartTime, turnDuration]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Time Left</span>
            <span>{Math.ceil(timeLeft)}s</span>
          </div>
          <Progress
            value={progress}
            className={isCurrentTurn ? "bg-red-100" : "bg-gray-100"}
          >
            <div
              className={`h-full ${
                isCurrentTurn ? "bg-red-500" : "bg-gray-500"
              } transition-all duration-100`}
              style={{ width: `${progress}%` }}
            />
          </Progress>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timer;