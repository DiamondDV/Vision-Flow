
import React, { useRef, useEffect } from 'react';
import { useHandTracker } from '../components/HandTracker';

const HandMimic: React.FC = () => {
  const { handData } = useHandTracker();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const connections = [
      [0, 1, 2, 3, 4], // thumb
      [0, 5, 6, 7, 8], // index
      [0, 9, 10, 11, 12], // middle
      [0, 13, 14, 15, 16], // ring
      [0, 17, 18, 19, 20], // pinky
      [5, 9, 13, 17], // palm base
    ];

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rect = canvas.getBoundingClientRect();
      
      if (handData && handData.hands.length > 0) {
        handData.hands.forEach((hand) => {
          const isRight = hand.label === 'Right';
          const color = isRight ? '#3b82f6' : '#a855f7';
          const glow = isRight ? 'rgba(59, 130, 246, 0.5)' : 'rgba(168, 85, 247, 0.5)';

          ctx.shadowBlur = 15;
          ctx.shadowColor = glow;

          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          const getCanvasCoords = (p: {x: number, y: number}) => {
             // landmarks are normalized 0-1 of image
             // but our handData.cursor is already scaled to screen.
             // We need to decide if we use landmarks (raw) or cursor (scaled).
             // Landmarks are better for skeleton.
             const screenX = p.x * window.innerWidth;
             const screenY = p.y * window.innerHeight;
             return {
                x: screenX - rect.left,
                y: screenY - rect.top
             };
          };

          connections.forEach(path => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            path.forEach((idx, i) => {
              const p = hand.landmarks[idx];
              const coords = getCanvasCoords(p);
              if (i === 0) ctx.moveTo(coords.x, coords.y);
              else ctx.lineTo(coords.x, coords.y);
            });
            ctx.stroke();
          });

          hand.landmarks.forEach((p, i) => {
            const coords = getCanvasCoords(p);
            
            ctx.beginPath();
            ctx.fillStyle = i === 8 || i === 4 ? '#fff' : color;
            ctx.arc(coords.x, coords.y, i === 8 || i === 4 ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();

            if (hand.isPinching && (i === 8 || i === 4)) {
                ctx.beginPath();
                ctx.strokeStyle = '#fff';
                ctx.arc(coords.x, coords.y, 12, 0, Math.PI * 2);
                ctx.stroke();
            }
          });
        });
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [handData]);

  return (
    <div className="relative h-full w-full bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
        <div className="w-[500px] h-[500px] border border-blue-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-0 w-[500px] h-[500px] border border-purple-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse] scale-90" />
      </div>

      <div className="absolute bottom-12 left-12 z-20 flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-white/20 uppercase">Neural Mirror</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/50">High Fidelity Link Active</p>
      </div>
    </div>
  );
};

export default HandMimic;
