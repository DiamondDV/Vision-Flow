
import React, { useEffect, useRef } from 'react';
import { useHandTracker } from './HandTracker';

const VirtualCursor: React.FC = () => {
  const { handDataRef } = useHandTracker();
  const cursorsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationId: number;

    const updateCursors = () => {
      const handData = handDataRef.current;
      const container = cursorsContainerRef.current;
      
      if (!container) {
        animationId = requestAnimationFrame(updateCursors);
        return;
      }

      // Clear previous frame state (simple approach for low hand count)
      const existingCursors = container.querySelectorAll('.cursor-dot');
      
      if (!handData || handData.hands.length === 0) {
        existingCursors.forEach(c => (c as HTMLElement).style.opacity = '0');
      } else {
        handData.hands.forEach((hand, idx) => {
          let cursorEl = container.querySelector(`.cursor-${hand.label}`) as HTMLElement;
          if (!cursorEl) return;

          const { x, y } = hand.cursor;
          const screenX = x * window.innerWidth;
          const screenY = y * window.innerHeight;
          
          cursorEl.style.opacity = '1';
          cursorEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%) ${hand.isPinching ? 'scale(0.8)' : 'scale(1)'}`;
          
          const labelEl = cursorEl.querySelector('.cursor-label') as HTMLElement;
          const dotEl = cursorEl.querySelector('.inner-dot') as HTMLElement;
          
          if (hand.isPinching) {
            cursorEl.classList.add('pinching');
            dotEl.style.transform = 'scale(0)';
          } else {
            cursorEl.classList.remove('pinching');
            dotEl.style.transform = 'scale(1)';
          }
        });
        
        // Hide hands that aren't present
        const activeLabels = handData.hands.map(h => h.label);
        ['Left', 'Right'].forEach(label => {
          if (!activeLabels.includes(label as any)) {
            const el = container.querySelector(`.cursor-${label}`) as HTMLElement;
            if (el) el.style.opacity = '0';
          }
        });
      }

      animationId = requestAnimationFrame(updateCursors);
    };

    animationId = requestAnimationFrame(updateCursors);
    return () => cancelAnimationFrame(animationId);
  }, [handDataRef]);

  return (
    <div ref={cursorsContainerRef} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {['Left', 'Right'].map((label) => (
        <div 
          key={label}
          className={`cursor-dot cursor-${label} absolute opacity-0 transition-opacity duration-200`}
          style={{ willChange: 'transform', left: 0, top: 0 }}
        >
          {/* Main Visual Ring */}
          <div className={`w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center transition-all duration-150
            ${label === 'Right' ? 'ring-blue-500/20' : 'ring-purple-500/20'} cursor-ring`}>
            <div className={`inner-dot w-2 h-2 rounded-full bg-white transition-transform duration-150`} />
          </div>

          {/* Pinch Indicator - CSS Only for speed */}
          <div className="absolute inset-0 rounded-full bg-blue-500/0 transition-all duration-150 active-glow" />

          {/* Label */}
          <div className={`cursor-label absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-black/50 backdrop-blur-md border border-white/10 ${label === 'Right' ? 'text-blue-400' : 'text-purple-400'}`}>
            {label}
          </div>
        </div>
      ))}

      <style>{`
        .cursor-dot.pinching .cursor-ring {
          background-color: rgba(59, 130, 246, 0.4);
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
          transform: scale(0.9);
        }
        .cursor-dot.pinching .active-glow {
           box-shadow: 0 0 30px 10px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
};

export default VirtualCursor;
