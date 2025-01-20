import { CellState, TurnPhase, PATTERN_RATIO } from '../../types/game';
import { PatternManager } from '../../utils/PatternManager';
import { socket } from '../../utils/socket';
import { useToast } from "@/hooks/use-toast";
import { useGame } from '@/context/GameContext';
import  { useState } from 'react';


const Grid = ({ 
  grid, 
  gridSize, 
  currentTeam, 
  isCurrentTurn,
  previewPattern
}) => {
  const { makeMove, gameState } = useGame();
  const [hoveredCell, setHoveredCell] = useState(null);
  const { toast } = useToast();
  
  const isPatternTurn = gameState?.currentTurn?.generation % PATTERN_RATIO === 0;
  
  const handleCellClick = (x, y) => {
    if (!isCurrentTurn || 
        gameState?.currentTurn?.phase !== TurnPhase.PLACEMENT || 
        !grid[y] || grid[y][x] === undefined) {
      return;
    }

    if (isPatternTurn && previewPattern) {
      if (!PatternManager.isValidPlacement(grid, x, y, previewPattern, gridSize)) {
        toast({
          variant: "destructive",
          title: "Invalid placement",
          description: PatternManager.checkPatternOverlap(grid, x, y, previewPattern)
            ? "Pattern overlaps with existing cells. Please choose another location."
            : "Pattern doesn't fit within the grid boundaries."
        });
        return;
      }

      socket.emit('place_pattern', {
        gameId: gameState.id,
        pattern: previewPattern,
        x,
        y
      });
      socket.emit('complete_turn', { gameId: gameState.id });
    } else if (grid[y][x] === CellState.EMPTY) {
      makeMove(x, y);
    }
  };

  const getPreviewStyle = (x, y) => {
    if (!hoveredCell || !previewPattern) return '';

    const hasOverlap = PatternManager.checkPatternOverlap(grid, hoveredCell.x, hoveredCell.y, previewPattern);
    const isInPattern = PatternManager.isInPatternPreview(x, y, hoveredCell.x, hoveredCell.y, previewPattern);
    
    if (isInPattern) {
      if (hasOverlap) {
        return 'bg-red-400 opacity-50';
      }
      return currentTeam === 'red' 
        ? 'bg-red-200 hover:bg-red-300' 
        : 'bg-blue-200 hover:bg-blue-300';
    }
    return '';
  };

  const getCellColor = (x, y, cell) => {
    // Show pattern preview
    if (isPatternTurn && 
        previewPattern && 
        hoveredCell && 
        isCurrentTurn &&
        gameState?.currentTurn?.phase === TurnPhase.PLACEMENT &&
        PatternManager.canPlacePattern(hoveredCell.x, hoveredCell.y, previewPattern, gridSize)) {
      const previewStyle = getPreviewStyle(x, y);
      if (previewStyle) return previewStyle;
    }

    // Regular cell coloring
    switch (cell) {
      case CellState.RED:
        return 'bg-red-500';
      case CellState.BLUE:
        return 'bg-blue-500';
      default:
        return isCurrentTurn && gameState?.currentTurn?.phase === TurnPhase.PLACEMENT
          ? currentTeam === 'red' 
            ? 'bg-background hover:bg-red-100' 
            : 'bg-background hover:bg-blue-100'
          : 'bg-background';
    }
  };

  const getCellCursor = (x, y) => {
    if (!isCurrentTurn || gameState?.currentTurn?.phase !== TurnPhase.PLACEMENT) {
      return 'cursor-not-allowed';
    }

    if (isPatternTurn) {
      if (hoveredCell && previewPattern) {
        return PatternManager.isValidPlacement(grid, x, y, previewPattern, gridSize)
          ? 'cursor-pointer' 
          : 'cursor-not-allowed';
      }
      return 'cursor-not-allowed';
    }

    return grid[y][x] === CellState.EMPTY ? 'cursor-pointer' : 'cursor-not-allowed';
  };

  return (
    <div className="w-full h-full">
      <div 
        className="grid w-full h-full" 
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: '1px',
          backgroundColor: 'rgb(var(--border))',
          padding: '1px',
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              onMouseEnter={() => setHoveredCell({ x, y })}
              onMouseLeave={() => setHoveredCell(null)}
              className={`
                ${getCellColor(x, y, cell)}
                ${getCellCursor(x, y)}
                w-full 
                h-full 
                border 
                border-border 
                transition-colors
              `}
              role="button"
              tabIndex={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Grid;