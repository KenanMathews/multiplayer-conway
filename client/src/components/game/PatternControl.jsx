import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { PatternManager } from '../../utils/PatternManager';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PatternCard = ({ pattern, isSelected, onClick, currentTeam, disabled }) => (
  <div
    className={`
      p-2 border rounded-lg cursor-pointer transition-all
      ${isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    onClick={disabled ? undefined : onClick}
  >
    <div className="space-y-2">
      <div className="text-sm font-medium">{pattern.name}</div>
      
      {/* Pattern Preview */}
      <div className="border p-1 bg-background/50">
        <div className="grid gap-0.5" 
          style={{ 
            gridTemplateColumns: `repeat(${pattern.pattern[0].length}, 16px)`
          }}>
          {pattern.pattern.map((row, i) => 
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`
                  w-4 h-4 border-[0.5px]
                  ${cell ? (currentTeam === 'red' ? 'bg-red-500' : 'bg-blue-500') : 'bg-background'}
                `}
              />
            ))
          )}
        </div>
      </div>

      {/* Size Badge */}
      <div className="flex gap-1">
        <Badge variant="secondary" className="text-xs">
          {pattern.pattern[0].length}×{pattern.pattern.length}
        </Badge>
      </div>
    </div>
  </div>
);

const PatternControl = ({ 
  isCurrentTurn, 
  currentPhase, 
  currentTeam, 
  currentGeneration,
  setPreviewPattern
}) => {
  const [selectedPatternKey, setSelectedPatternKey] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [rotation, setRotation] = useState(0);

  const patternRatio = 1;
  const isPatternTurn = (currentGeneration % patternRatio) === 0;

  const getGenerationsUntilPattern = () => {
    return patternRatio - (currentGeneration % patternRatio);
  };

  const handleRotate = () => {
    setRotation((prev) => {
      const newRotation = (prev + 90) % 360;
      updatePreviewPattern(selectedPatternKey, newRotation);
      return newRotation;
    });
  };

  const updatePreviewPattern = (patternKey, newRotation = rotation) => {
    if (!patternKey) {
      setPreviewPattern(null);
      return;
    }

    const pattern = PatternManager.getPattern(patternKey).pattern;
    const rotatedPattern = PatternManager.getRotatedPattern(pattern, newRotation);
    setPreviewPattern(rotatedPattern);
  };

  const handlePatternSelect = (patternKey) => {
    setSelectedPatternKey(patternKey);
    setRotation(0);
    updatePreviewPattern(patternKey, 0);
  };

  // Get patterns for current category
  const getFilteredPatterns = () => {
    const patterns = PatternManager.getPatternList();
    if (activeCategory === 'All') {
      return patterns;
    }
    return patterns.filter(pattern => pattern.category === activeCategory);
  };

  // Force pattern selection on pattern turns
  useEffect(() => {
    if (isPatternTurn && isCurrentTurn && !selectedPatternKey) {
      const firstPattern = getFilteredPatterns()[0];
      if (firstPattern) {
        handlePatternSelect(firstPattern.key);
      }
    }
  }, [isPatternTurn, isCurrentTurn, selectedPatternKey]);

  // Clear pattern selection when it's not a pattern turn
  useEffect(() => {
    if (!isPatternTurn) {
      setSelectedPatternKey(null);
      setRotation(0);
      setPreviewPattern(null);
    }
  }, [isPatternTurn, setPreviewPattern]);

  const selectedPattern = selectedPatternKey 
    ? PatternManager.getPattern(selectedPatternKey) 
    : null;

  const categories = ['All', ...PatternManager.getCategories()];
  const patternsByCategory = PatternManager.getPatternsByCategory();

  return (
    <Card className={!isPatternTurn ? "opacity-50" : ""}>
      <CardHeader>
        <CardTitle>Pattern Placement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {isPatternTurn 
              ? "Special turn: Place a pattern!" 
              : `Pattern placement available in ${getGenerationsUntilPattern()} turns`}
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4">
              {categories.map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  disabled={!isPatternTurn || !isCurrentTurn}
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Pattern Grid */}
          <div className="grid grid-cols-2 gap-2">
            {getFilteredPatterns().map(({ key, name }) => {
              const pattern = PatternManager.getPattern(key);
              return (
                <PatternCard
                  key={key}
                  pattern={pattern}
                  isSelected={selectedPatternKey === key}
                  onClick={() => handlePatternSelect(key)}
                  currentTeam={currentTeam}
                  disabled={!isPatternTurn || !isCurrentTurn}
                />
              );
            })}
          </div>

          {/* Selected Pattern Preview */}
          {selectedPattern && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{selectedPattern.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedPattern.description}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRotate}
                  disabled={!isPatternTurn || !isCurrentTurn}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="border rounded-lg p-3 bg-background/50">
                <div className="grid gap-1 justify-center" 
                  style={{ 
                    gridTemplateColumns: `repeat(${selectedPattern.pattern[0].length}, 24px)`
                  }}>
                  {selectedPattern.pattern.map((row, i) => 
                    row.map((cell, j) => (
                      <div
                        key={`${i}-${j}`}
                        className={`
                          w-6 h-6 border
                          ${cell ? (currentTeam === 'red' ? 'bg-red-500' : 'bg-blue-500') : 'bg-background'}
                        `}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatternControl;