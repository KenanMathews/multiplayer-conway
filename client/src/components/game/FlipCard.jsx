import React, { useState } from 'react';

const FlipCard = ({ value, onFlipComplete }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);

  const handleClick = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    
    // Update the shown value mid-flip when card is face down
    setTimeout(() => {
      setShowValue(true);
    }, 150);

    // Complete the flip and trigger the callback only on first flip
    setTimeout(() => {
      setIsFlipping(false);
      if (!hasFlipped) {
        setHasFlipped(true);
        onFlipComplete(value);
      }
    }, 300);
  };

  return (
    <div className="w-32 h-48 cursor-pointer perspective-1000" onClick={handleClick}>
      <div
        className={`
          relative w-full h-full 
          transform-style-preserve-3d 
          transition-transform duration-300
          hover:scale-105
          ${isFlipping ? 'rotate-y-180' : ''}
        `}
      >
        {/* Front face */}
        <div 
          className={`
            absolute inset-0 
            bg-white rounded-xl 
            shadow-lg border-2 border-gray-200
            flex items-center justify-center
            backface-hidden
          `}
        >
          <span className="text-6xl font-bold">
            {showValue ? value : '?'}
          </span>
        </div>

        {/* Back face */}
        <div 
          className={`
            absolute inset-0 
            bg-blue-500 rounded-xl 
            shadow-lg border-2 border-blue-600
            flex items-center justify-center
            backface-hidden rotate-y-180
          `}
        >
          <div className="grid grid-cols-3 grid-rows-3 gap-1 w-12 h-12">
            {Array(9).fill(null).map((_, i) => (
              <div key={i} className="w-2 h-2 bg-white rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Required CSS classes
const styles = `
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default FlipCard;