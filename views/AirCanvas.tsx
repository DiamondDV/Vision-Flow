
import React, { useEffect, useRef, useState } from 'react';
import { useHandTracker } from '../components/HandTracker';
import GazeButton from '../components/GazeButton';
import { Trash2, Download, Pencil, Eraser, Square, Circle, Minus, Type, Plus } from 'lucide-react';

type Tool = 'brush' | 'eraser' | 'square' | 'circle' | 'line' | 'text';

const AirCanvas: React.FC = () => {
  const { handDataRef } = useHandTracker();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(10);
  
  // High-perf refs
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);
  const startPointRef = useRef<{ x: number, y: number } | null>(null);
  const toolRef = useRef<Tool>('brush');
  const colorRef = useRef('#3b82f6');
  const sizeRef = useRef(10);

  // Sync state to refs for the animation loop
  useEffect(() => { toolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = brushSize; }, [brushSize]);

  useEffect(() => {
    const handleResize = () => {
      [canvasRef, previewRef].forEach(ref => {
        if (ref.current) {
          const rect = ref.current.parentElement?.getBoundingClientRect();
          if (rect) {
            // Only update if dimensions actually changed to avoid wiping canvas
            if (ref.current.width !== rect.width || ref.current.height !== rect.height) {
              const temp = ref.current.getContext('2d')?.getImageData(0,0,ref.current.width, ref.current.height);
              ref.current.width = rect.width;
              ref.current.height = rect.height;
              if (temp) ref.current.getContext('2d')?.putImageData(temp, 0, 0);
            }
          }
        }
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    let animationId: number;
    const tick = () => {
      const handData = handDataRef.current;
      if (!handData || handData.hands.length === 0 || !canvasRef.current || !previewRef.current) {
        if (isDrawingRef.current) commitDrawing();
        animationId = requestAnimationFrame(tick);
        return;
      }

      const primaryHand = handData.hands[0];
      const ctx = canvasRef.current.getContext('2d');
      const pCtx = previewRef.current.getContext('2d');
      if (!ctx || !pCtx) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (primaryHand.cursor.x * window.innerWidth) - rect.left;
      const y = (primaryHand.cursor.y * window.innerHeight) - rect.top;

      if (primaryHand.isPinching) {
        if (!isDrawingRef.current) {
          isDrawingRef.current = true;
          startPointRef.current = { x, y };
          lastPointRef.current = { x, y };
        }

        const currentTool = toolRef.current;
        const currentSize = sizeRef.current;
        const currentCol = colorRef.current;

        if (currentTool === 'brush' || currentTool === 'eraser') {
          ctx.beginPath();
          ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
          ctx.strokeStyle = currentCol;
          ctx.lineWidth = currentSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          const from = lastPointRef.current || { x, y };
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          lastPointRef.current = { x, y };
        } else {
          // Live Preview for shapes
          pCtx.clearRect(0, 0, previewRef.current.width, previewRef.current.height);
          pCtx.beginPath();
          pCtx.strokeStyle = currentCol;
          pCtx.lineWidth = currentSize;
          pCtx.setLineDash([5, 5]);
          const start = startPointRef.current!;
          
          if (currentTool === 'square') pCtx.strokeRect(start.x, start.y, x - start.x, y - start.y);
          else if (currentTool === 'circle') {
            const r = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
            pCtx.arc(start.x, start.y, r, 0, Math.PI * 2);
            pCtx.stroke();
          }
          else if (currentTool === 'line') {
            pCtx.moveTo(start.x, start.y);
            pCtx.lineTo(x, y);
            pCtx.stroke();
          }
        }
      } else {
        if (isDrawingRef.current) commitDrawing(x, y);
      }

      animationId = requestAnimationFrame(tick);
    };

    const commitDrawing = (endX?: number, endY?: number) => {
      isDrawingRef.current = false;
      const ctx = canvasRef.current?.getContext('2d');
      const pCtx = previewRef.current?.getContext('2d');
      if (!ctx || !pCtx || !startPointRef.current) return;

      pCtx.clearRect(0, 0, previewRef.current!.width, previewRef.current!.height);
      
      const tool = toolRef.current;
      if (['square', 'circle', 'line', 'text'].includes(tool) && endX !== undefined && endY !== undefined) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.setLineDash([]);
        ctx.strokeStyle = colorRef.current;
        ctx.fillStyle = colorRef.current;
        ctx.lineWidth = sizeRef.current;
        const start = startPointRef.current;

        if (tool === 'square') ctx.strokeRect(start.x, start.y, endX - start.x, endY - start.y);
        else if (tool === 'circle') {
          const r = Math.sqrt(Math.pow(endX - start.x, 2) + Math.pow(endY - start.y, 2));
          ctx.beginPath();
          ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        else if (tool === 'line') {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        else if (tool === 'text') {
          const text = window.prompt("Text content:");
          if (text) {
            ctx.font = `${sizeRef.current * 4}px Inter, sans-serif`;
            ctx.fillText(text, start.x, start.y);
          }
        }
      }
      
      lastPointRef.current = null;
      startPointRef.current = null;
    };

    animationId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [handDataRef]);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050505] flex">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />
        <canvas ref={previewRef} className="absolute inset-0 z-20 pointer-events-none w-full h-full" />
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-4 items-center w-full max-w-2xl px-4 pointer-events-none">
        <div className="flex gap-2 p-2 glass rounded-full items-center shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
            {[
              { id: 'brush', icon: Pencil },
              { id: 'eraser', icon: Eraser },
              { id: 'line', icon: Minus },
              { id: 'square', icon: Square },
              { id: 'circle', icon: Circle },
              { id: 'text', icon: Type }
            ].map((t) => (
              <GazeButton
                key={t.id}
                onClick={() => setActiveTool(t.id as Tool)}
                className={`p-3 rounded-full transition-all ${activeTool === t.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:bg-white/5'}`}
              >
                <t.icon size={18} className={t.id === 'line' ? '-rotate-45' : ''} />
              </GazeButton>
            ))}
          </div>

          <div className={`flex items-center gap-2 border-r border-white/10 px-2 transition-opacity ${activeTool === 'eraser' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff'].map(c => (
              <GazeButton
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              >
                <div />
              </GazeButton>
            ))}
          </div>

          <div className="flex items-center gap-1 pl-1">
            <GazeButton onClick={clearCanvas} className="p-3 text-white/40 hover:text-red-400">
              <Trash2 size={18} />
            </GazeButton>
            <GazeButton onClick={() => {
              const link = document.createElement('a');
              link.download = 'vision-flow-art.png';
              link.href = canvasRef.current?.toDataURL() || '';
              link.click();
            }} className="p-3 text-white/40 hover:text-blue-400">
              <Download size={18} />
            </GazeButton>
          </div>
        </div>

        <div className="flex items-center gap-4 p-2 px-6 glass rounded-full text-xs font-bold tracking-widest text-white/50 shadow-xl border-white/5 pointer-events-auto">
          <GazeButton onClick={() => setBrushSize(Math.max(2, brushSize - 4))} className="p-1 hover:text-white">
            <Minus size={14} />
          </GazeButton>
          <div className="flex items-center gap-3 min-w-[140px] justify-center">
            <span className="uppercase text-[8px] opacity-60">{activeTool === 'text' ? 'FONT' : 'SIZE'}:</span>
            <div className="h-1 bg-white/10 rounded-full flex-1 overflow-hidden w-20">
               <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ width: `${(brushSize/40)*100}%` }} />
            </div>
            <span className="w-5 text-center text-white/80">{brushSize}</span>
          </div>
          <GazeButton onClick={() => setBrushSize(Math.min(40, brushSize + 4))} className="p-1 hover:text-white">
            <Plus size={14} />
          </GazeButton>
        </div>
      </div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
         <div className="px-6 py-2 glass rounded-full border-blue-500/20">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
               Pinch mid-air to sketch
            </span>
         </div>
      </div>
    </div>
  );
};

export default AirCanvas;
