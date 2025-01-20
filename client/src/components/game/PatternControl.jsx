import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { PatternManager } from '../../utils/PatternManager';

const PatternButton = ({ pattern, isSelected, onClick, currentTeam, disabled }) => (
  <Button
    variant={isSelected ? "default" : "outline"}
    className={`h-auto p-2 ${disabled ? 'opacity-50' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    <div className="space-y-1">
      <div className="text-xs font-medium">{pattern.name}</div>
      <div className="grid gap-0.5" 
        style={{ 
          gridTemplateColumns: `repeat(${pattern.pattern[0].length}, 8px)`
        }}>
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
);

const PatternControl = ({ 
  isCurrentTurn, 
  currentTeam,
  currentGeneration,
  setPreviewPattern,
}) => {
  const [selectedPatternKey, setSelectedPatternKey] = useState('glider');
  const [rotation, setRotation] = useState(0);
  const isPatternTurn = currentGeneration % 1 === 0;

  const handleRotate = () => {
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

  // Auto-select pattern on component mount
  useEffect(() => {
    if (isPatternTurn && isCurrentTurn) {
      handlePatternSelect('glider');
    }
  }, [isPatternTurn, isCurrentTurn]);

  const getPatternsByCategory = () => {
    const patterns = PatternManager.getPatternsByCategory();
    return Object.entries(patterns).map(([category, items]) => ({
      category,
      patterns: items
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-48 p-2 overflow-y-auto">
        <div className="space-y-4">
          {getPatternsByCategory().map(({ category, patterns }) => (
            <div key={category} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">{category}</div>
              <div className="space-y-1">
                {patterns.map((pattern) => (
                  <PatternButton
                    key={pattern.key}
                    pattern={PatternManager.getPattern(pattern.key)}
                    isSelected={selectedPatternKey === pattern.key}
                    onClick={() => handlePatternSelect(pattern.key)}
                    currentTeam={currentTeam}
                    disabled={!isPatternTurn || !isCurrentTurn}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedPatternKey && isCurrentTurn && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleRotate}
          disabled={!isPatternTurn}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PatternControl;