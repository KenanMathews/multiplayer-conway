import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RotateCcw } from "lucide-react";
import { PatternManager } from '../../utils/PatternManager';
import { useGame } from '../../context/GameContext';
import { TurnPhase } from '../../types/game';
import FlipCard from './FlipCard';

const PatternControl = ({ 
  isCurrentTurn, 
  currentTeam,
  currentGeneration,
  setPreviewPattern,
}) => {
  const { gameState, confirmPatternSize } = useGame();
  const [selectedPatternKey, setSelectedPatternKey] = useState(null);
  const [rotation, setRotation] = useState(0);

  const isPatternSizePhase = gameState.currentTurn?.phase === TurnPhase.PATTERN_SIZE_SELECTION;
  const isPatternPlacementPhase = gameState.currentTurn?.phase === TurnPhase.PLACEMENT;
  const patternSize = gameState.currentTurn?.patternSize;

  useEffect(() => {
    if (!patternSize) {
      setSelectedPatternKey(null);
      setRotation(0);
      setPreviewPattern(null);
      return;
    }

    if (isPatternPlacementPhase) {
      const availablePatterns = PatternManager.getPatternsBySize(patternSize);
      if (availablePatterns.length > 0) {
        const firstPattern = availablePatterns[0];
        setSelectedPatternKey(firstPattern.key);
        setRotation(0);
        setPreviewPattern(PatternManager.getPattern(firstPattern.key).pattern);
      }
    }
  }, [gameState.currentTurn?.playerId, gameState.currentTurn?.phase, patternSize, isPatternPlacementPhase, setPreviewPattern]);

  const handleRotate = () => {
    if (!selectedPatternKey) return;
    
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    const pattern = PatternManager.getPattern(selectedPatternKey).pattern;
    setPreviewPattern(PatternManager.getRotatedPattern(pattern, newRotation));
  };

  const handlePatternSelect = (patternKey) => {
    setSelectedPatternKey(patternKey);
    setRotation(0);
    const pattern = PatternManager.getPattern(patternKey).pattern;
    setPreviewPattern(pattern);
  };

  if (isCurrentTurn && isPatternSizePhase && patternSize) {
    return (
      <Card className="w-48 p-4">
        <FlipCard 
          value={patternSize} 
          onFlipComplete={confirmPatternSize} 
        />
      </Card>
    );
  }

  if (!isCurrentTurn || !patternSize) {
    return null;
  }

  const availablePatterns = PatternManager.getPatternsBySize(patternSize);

  if (availablePatterns.length === 0) {
    return (
      <Card className="w-48 p-4">
        <div className="text-center text-muted-foreground">
          No patterns available for {patternSize}x{patternSize} grid
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <Card className="w-48 p-4">
          <div className="space-y-4">
            <div className="text-sm font-medium border-b pb-2">
              {patternSize}×{patternSize} Patterns
            </div>
            <div className="space-y-2">
              {availablePatterns.map((pattern) => (
                <PatternButton
                  key={pattern.key}
                  pattern={PatternManager.getPattern(pattern.key)}
                  isSelected={selectedPatternKey === pattern.key}
                  onClick={() => handlePatternSelect(pattern.key)}
                  currentTeam={currentTeam}
                />
              ))}
            </div>
          </div>
        </Card>

        {selectedPatternKey && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRotate}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Rotate Pattern</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

const PatternButton = ({ pattern, isSelected, onClick, currentTeam }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={isSelected ? "default" : "outline"}
        className="w-full h-auto p-2"
        onClick={onClick}
      >
        <div className="space-y-1 w-full">
          <div className="text-xs font-medium">{pattern.name}</div>
          <div 
            className="grid gap-0.5 mx-auto" 
            style={{ 
              gridTemplateColumns: `repeat(${pattern.pattern[0].length}, 8px)`
            }}
          >
            {pattern.pattern.map((row, i) => 
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`
                    w-2 h-2 border-[0.5px]
                    ${cell ? (currentTeam === 'red' ? 'bg-red-500' : 'bg-blue-500') : 'bg-background'}
                  `}
                />
              ))
            )}
          </div>
        </div>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right" align="start" className="max-w-[200px]">
      <div className="space-y-1">
        <p className="font-semibold">{pattern.name}</p>
        <p className="text-sm text-muted-foreground">{pattern.description}</p>
        <p className="text-xs text-muted-foreground">Type: {pattern.type}</p>
      </div>
    </TooltipContent>
  </Tooltip>
);

export default PatternControl;