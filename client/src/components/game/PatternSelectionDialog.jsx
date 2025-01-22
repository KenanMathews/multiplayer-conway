import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, X } from "lucide-react";
import { PatternManager } from '../../utils/PatternManager';
import FlipCard from './FlipCard';

const PatternSelectionDialog = ({ 
  isOpen,
  onClose,
  currentTeam,
  patternSize,
  onPatternSelect,
  confirmPatternSize,
}) => {
  const [selectedPatternKey, setSelectedPatternKey] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [patternGroups, setPatternGroups] = useState([]);
  const [hasFlippedCard, setHasFlippedCard] = useState(false);

  React.useEffect(() => {
    if (isOpen && patternSize) {
      // Generate pattern groups from patternSize down to 3x3
      const groups = [];
      for (let size = patternSize; size >= 3; size--) {
        const patterns = PatternManager.getPatternsBySize(size);
        const shuffled = [...patterns].sort(() => 0.5 - Math.random());
        const selectedPatterns = shuffled.slice(0, 2); // Get 2 random patterns
        if (selectedPatterns.length > 0) {
          groups.push({
            size,
            patterns: selectedPatterns
          });
        }
      }
      setPatternGroups(groups);
      setSelectedPatternKey(null);
      setRotation(0);
      setHasFlippedCard(false);
    }
  }, [isOpen, patternSize]);

  if (!isOpen) return null;

  const handleFlipComplete = () => {
    setHasFlippedCard(true);
    if (confirmPatternSize) {
      confirmPatternSize();
    }
  };

  const handleRotate = () => {
    if (!selectedPatternKey) return;
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
  };

  const handlePatternSelect = (patternKey) => {
    setSelectedPatternKey(patternKey);
    setRotation(0);
  };

  const handleConfirm = () => {
    if (!selectedPatternKey) return;
    const pattern = PatternManager.getPattern(selectedPatternKey).pattern;
    const rotatedPattern = PatternManager.getRotatedPattern(pattern, rotation);
    onPatternSelect(rotatedPattern);
    onClose();
  };

  const PatternCard = ({ pattern }) => {
    const patternData = PatternManager.getPattern(pattern.key);
    const isSelected = selectedPatternKey === pattern.key;
    
    return (
      <Card 
        className={`p-2 cursor-pointer transition-all h-full ${
          isSelected 
            ? 'ring-2 ring-primary shadow-lg scale-[1.01]' 
            : 'hover:shadow-md'
        }`}
        onClick={() => handlePatternSelect(pattern.key)}
      >
        <div className="flex gap-3">
          <div className="flex-none">
            <div 
              className="grid gap-0.5"
              style={{ 
                gridTemplateColumns: `repeat(${patternData.pattern[0].length}, 6px)`
              }}
            >
              {(PatternManager.getRotatedPattern(patternData.pattern, isSelected ? rotation : 0))
                .map((row, i) => 
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
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold truncate">{patternData.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {patternData.pattern.length}×{patternData.pattern.length}
                </p>
              </div>
              {isSelected && (
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {patternData.description}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in-0">
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="max-w-3xl w-full h-[90vh] bg-background rounded-lg shadow-lg p-6 mx-4 relative overflow-hidden">
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {!hasFlippedCard ? (
            // Flip Card View
            <div className="h-full flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-8">Select Pattern Size</h2>
              <FlipCard 
                value={patternSize} 
                onFlipComplete={handleFlipComplete}
              />
            </div>
          ) : (
            // Pattern Selection View
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Select Your Pattern</h2>
                <p className="text-muted-foreground">Choose a pattern to place on the grid</p>
              </div>

              {/* Content */}
              <div className="h-[calc(100%-10rem)] overflow-y-auto">
                <div className="px-1">
                {patternGroups.map((group) => (
                  <div key={group.size} className="mb-6">
                    <h3 className="text-sm font-semibold mb-2">{group.size}×{group.size}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {group.patterns.map((pattern) => (
                        <PatternCard key={pattern.key} pattern={pattern} />
                      ))}
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                <div className="flex gap-4">
                  {selectedPatternKey && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleRotate}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rotate Pattern
                    </Button>
                  )}
                  <Button
                    className="flex-1"
                    disabled={!selectedPatternKey}
                    onClick={handleConfirm}
                  >
                    Confirm Selection
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternSelectionDialog;