
import React, { useRef, useEffect, useState } from 'react';
import { useHandTracker } from './HandTracker';

interface GazeButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GazeButton: React.FC<GazeButtonProps> = ({ onClick, children, className, style }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { handDataRef } = useHandTracker();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const wasPinching = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let animationId: number;
    
    const checkInteraction = () => {
      const handData = handDataRef.current;
      const btn = buttonRef.current;
      
      if (!handData || !btn) {
        setIsHovered(false);
        setIsPressed(false);
        animationId = requestAnimationFrame(checkInteraction);
        return;
      }

      const rect = btn.getBoundingClientRect();
      const padding = 15;
      let hovering = false;
      let pressing = false;
      let clicked = false;

      handData.hands.forEach(hand => {
        const cx = hand.cursor.x * window.innerWidth;
        const cy = hand.cursor.y * window.innerHeight;

        const isInside = (
          cx >= rect.left - padding &&
          cx <= rect.right + padding &&
          cy >= rect.top - padding &&
          cy <= rect.bottom + padding
        );

        if (isInside) {
          hovering = true;
          if (hand.isPinching) {
            pressing = true;
            if (!wasPinching.current[hand.label]) {
              clicked = true;
            }
          }
        }
        wasPinching.current[hand.label] = hand.isPinching;
      });

      setIsHovered(hovering);
      setIsPressed(pressing);
      if (clicked) onClick();

      animationId = requestAnimationFrame(checkInteraction);
    };

    animationId = requestAnimationFrame(checkInteraction);
    return () => cancelAnimationFrame(animationId);
  }, [handDataRef, onClick]);

  return (
    <button
      ref={buttonRef}
      style={style}
      className={`transition-all duration-150 relative outline-none ring-offset-2 ring-offset-black focus:ring-2 ring-blue-500/50 ${
        isHovered ? 'scale-110 shadow-xl z-10' : 'scale-100'
      } ${
        isPressed ? 'brightness-150 scale-95' : ''
      } ${className}`}
    >
      <div className={`absolute inset-0 rounded-inherit transition-opacity duration-200 bg-white/10 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      <span className="relative z-10 flex items-center justify-center gap-2 pointer-events-none">{children}</span>
    </button>
  );
};

export default GazeButton;
