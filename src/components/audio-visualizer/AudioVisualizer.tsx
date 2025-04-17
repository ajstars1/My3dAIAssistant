import React, { useEffect, useRef } from 'react';
import './audio-visualizer.scss';
import classNames from 'classnames';

interface AudioVisualizerProps {
  active: boolean;
  volume: number;
  hover?: boolean;
  color?: string;
}

/**
 * Audio visualizer component that displays sound waves based on volume
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  active = false, 
  volume = 0, 
  hover = false,
  color = 'primary'
}) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const numBars = 5; // Number of bars in the visualizer
  
  // Update bar heights based on volume
  useEffect(() => {
    let animationFrame: number;
    
    const updateBars = () => {
      barsRef.current.forEach((bar, i) => {
        if (bar) {
          // Create varied heights based on bar position and volume
          // Center bars are taller than edge bars
          const position = Math.abs(i - Math.floor(numBars / 2));
          const positionFactor = 1 - (position / numBars);
          const randomFactor = active ? (0.5 + Math.random() * 0.5) : 0.2;
          const heightFactor = active ? volume * 20 * positionFactor * randomFactor : 0.2;
          
          // Set height with minimum value
          bar.style.height = `${Math.max(3, heightFactor * 30)}px`;
        }
      });
      
      // Continue animation if active
      if (active) {
        animationFrame = requestAnimationFrame(updateBars);
      }
    };
    
    // Start animation
    updateBars();
    
    // Cleanup animation on unmount or when dependencies change
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [active, volume, numBars]);
  
  return (
    <div className={classNames('audio-visualizer', `color-${color}`, { active, hover })}>
      {Array.from({ length: numBars }).map((_, i) => (
        <div
          key={i}
          className="visualizer-bar"
          ref={el => barsRef.current[i] = el}
          style={{ 
            animationDelay: `${i * 120}ms`,
            animationDuration: `${700 + (i * 100)}ms`
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer; 