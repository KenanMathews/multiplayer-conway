import React, { useState, useEffect } from 'react';
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
    <div className="flex items-center gap-2">
      <span className="text-sm">Time: {Math.ceil(timeLeft)}s</span>
      <Progress 
        value={progress} 
        className={`w-24 h-2 ${isCurrentTurn ? "bg-red-100" : "bg-gray-100"}`}
      >
        <div
          className={`h-full transition-all duration-100 ${
            isCurrentTurn ? "bg-red-500" : "bg-gray-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </Progress>
    </div>
  );
};

export default Timer;