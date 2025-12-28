
import React, { useState, useRef, useEffect } from 'react';
import { useHandTracker } from '../components/HandTracker';
import { analyzeImage } from '../services/geminiService';
import { Loader2, Sparkles, Zap, BrainCircuit } from 'lucide-react';

const VisionLens: React.FC = () => {
  const { videoRef, isReady } = useHandTracker();
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const lastScanTime = useRef(0);
  const SCAN_INTERVAL = 5000; 

  // Synchronize the video stream to the local display element
  useEffect(() => {
    if (isReady && videoRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = videoRef.current.srcObject;
    }
  }, [isReady, videoRef]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active) return;
      
      const now = Date.now();
      if (autoScan && !loading && now - lastScanTime.current > SCAN_INTERVAL) {
        await performAnalysis();
      }
      
      requestAnimationFrame(tick);
    };

    if (autoScan) requestAnimationFrame(tick);
    return () => { active = false; };
  }, [autoScan, loading]);

  const performAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Flip canvas to match mirror view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      const result = await analyzeImage(base64, "Describe the primary objects in the scene concisely. Provide a 1-sentence summary of what you see.");
      if (result) {
        setAnalysis(result);
        lastScanTime.current = Date.now();
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-black">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="w-full max-w-5xl glass rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[85vh] border-white/5">
        <div className="relative flex-1 bg-black overflow-hidden group">
          <video 
            ref={localVideoRef}
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover scale-x-[-1] opacity-60"
          />
          
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-[scan_3s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/2 h-1/2 border border-blue-500/20 rounded-full animate-pulse flex items-center justify-center">
                <div className="w-4/5 h-4/5 border border-blue-500/5 rounded-full" />
              </div>
            </div>
          </div>

          <div className="absolute top-6 left-6 flex items-center gap-3 glass-heavy px-4 py-2 rounded-full border border-blue-500/50">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-white uppercase">Neural Feed Active</span>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-heavy px-8 py-4 rounded-3xl border border-white/10 w-[90%] flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={24} />}
             </div>
             <div className="flex-1">
                <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">AI Observer</div>
                <div className="text-sm text-white/90 font-medium leading-relaxed italic">
                  {analysis || (isReady ? "Analyzing spatial environment..." : "Connecting to optic sensors...")}
                </div>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-10vh); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(85vh); opacity: 0; }
        }
        .glass-heavy {
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(24px);
        }
      `}</style>
    </div>
  );
};

export default VisionLens;
