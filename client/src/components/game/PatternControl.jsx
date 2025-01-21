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
  const [randomizedPatterns, setRandomizedPatterns] = useState({});

  const isPatternSizePhase = gameState.currentTurn?.phase === TurnPhase.PATTERN_SIZE_SELECTION;
  const isPatternPlacementPhase = gameState.currentTurn?.phase === TurnPhase.PLACEMENT;
  const patternSize = gameState.currentTurn?.patternSize;

  const getRandomPatterns = (patterns, count = 2) => {
    const shuffled = [...patterns].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const getAllAvailablePatterns = (maxSize) => {
    const patternsBySize = {};
    for (let size = 1; size <= maxSize; size++) {
      const sizePatterns = PatternManager.getPatternsBySize(size);
      if (sizePatterns.length > 0) {
        patternsBySize[size] = getRandomPatterns(sizePatterns, 2);
      }
    }
    return patternsBySize;
  };

  useEffect(() => {
    if (!patternSize) {
      setSelectedPatternKey(null);
      setRotation(0);
      setPreviewPattern(null);
      setRandomizedPatterns({});
      return;
    }

    if (isPatternPlacementPhase) {
      const patterns = getAllAvailablePatterns(patternSize);
      setRandomizedPatterns(patterns);
      
      // Select first available pattern
      const firstSize = Object.keys(patterns)[0];
      if (firstSize && patterns[firstSize].length > 0) {
        const firstPattern = patterns[firstSize][0];
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

  if (Object.keys(randomizedPatterns).length === 0) {
    return (
      <Card className="w-48 p-4">
        <div className="text-center text-muted-foreground">
          No patterns available
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <Card className="w-48 p-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(randomizedPatterns)
            .sort(([sizeA], [sizeB]) => Number(sizeB) - Number(sizeA))
            .map(([size, patterns]) =>
              patterns.map((pattern) => {
                const patternData = PatternManager.getPattern(pattern.key);
                return (
                  <Tooltip key={pattern.key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedPatternKey === pattern.key ? "default" : "outline"}
                        className="p-2 h-auto aspect-square"
                        onClick={() => handlePatternSelect(pattern.key)}
                      >
                        <div 
                          className="grid gap-0.5"
                          style={{ 
                            gridTemplateColumns: `repeat(${patternData.pattern[0].length}, 6px)`
                          }}
                        >
                          {patternData.pattern.map((row, i) => 
                            row.map((cell, j) => (
                              <div
                                key={`${i}-${j}`}
                                className={`
                                  w-1.5 h-1.5 border-[0.5px]
                                  ${cell ? (currentTeam === 'red' ? 'bg-red-500' : 'bg-blue-500') : 'bg-background'}
                                `}
                              />
                            ))
                          )}
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="max-w-[200px]">
                      <div className="space-y-1">
                        <p className="font-semibold">{patternData.name}</p>
                        <p className="text-sm text-muted-foreground">{patternData.description}</p>
                        <p className="text-xs text-muted-foreground">Size: {size}×{size}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })
            )}
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

export default PatternControl;