
import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { HandData, SingleHandData, Point } from '../types';

interface HandTrackerContextType {
  handDataRef: React.MutableRefObject<HandData | null>;
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;
}

const HandTrackerContext = createContext<HandTrackerContextType | null>(null);

// Smoothing: Lower is smoother but laggier. 0.2 is a sweet spot for jitter vs lag.
const SMOOTHING_ALPHA = 0.22; 
const PINCH_THRESHOLD_START = 0.038;
const PINCH_THRESHOLD_END = 0.058;

// Map the center 55% of the camera to the 100% of the screen
const ACTIVE_MARGIN = 0.22; 

export const useHandTracker = () => {
  const context = useContext(HandTrackerContext);
  if (!context) throw new Error('useHandTracker must be used within HandTrackerProvider');
  return context;
};

export const HandTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handDataRef = useRef<HandData | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const lastCursorsRef = useRef<Record<string, Point>>({});
  const pinchingStateRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let cameraInstance: any = null;

    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0, // 0 is fastest for web
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
      selfieMode: true
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const uniqueHands: SingleHandData[] = [];

        results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
          const classification = results.multiHandedness[index];
          const label = classification.label as 'Left' | 'Right';
          
          // ANCHOR: Using landmark 9 (Middle MCP) as it doesn't move when pinching
          const anchor = landmarks[9];
          const indexTip = landmarks[8];
          const thumbTip = landmarks[4];
          
          const mapCoord = (val: number) => {
            const min = ACTIVE_MARGIN;
            const max = 1 - ACTIVE_MARGIN;
            const scaled = (val - min) / (max - min);
            return Math.max(0, Math.min(1, scaled));
          };

          const targetX = mapCoord(anchor.x);
          const targetY = mapCoord(anchor.y);

          // Exponential Moving Average for jitter reduction
          const lastCursor = lastCursorsRef.current[label] || { x: targetX, y: targetY };
          const smoothedX = lastCursor.x + (targetX - lastCursor.x) * SMOOTHING_ALPHA;
          const smoothedY = lastCursor.y + (targetY - lastCursor.y) * SMOOTHING_ALPHA;
          
          const currentCursor = { x: smoothedX, y: smoothedY };
          lastCursorsRef.current[label] = currentCursor;

          // Pinch logic
          const dx = indexTip.x - thumbTip.x;
          const dy = indexTip.y - thumbTip.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let isPinching = pinchingStateRef.current[label] || false;
          if (!isPinching && distance < PINCH_THRESHOLD_START) {
            isPinching = true;
          } else if (isPinching && distance > PINCH_THRESHOLD_END) {
            isPinching = false;
          }
          pinchingStateRef.current[label] = isPinching;

          uniqueHands.push({
            landmarks,
            isPinching,
            cursor: currentCursor,
            label
          });
        });

        handDataRef.current = { hands: uniqueHands };
      } else {
        handDataRef.current = null;
      }
    });

    if (videoRef.current) {
      // @ts-ignore
      cameraInstance = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && hands) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 360,
      });

      cameraInstance.start()
        .then(() => setIsReady(true))
        .catch((err: any) => console.error("Camera Error:", err));
    }

    return () => {
      if (cameraInstance) cameraInstance.stop();
      hands.close();
    };
  }, []);

  return (
    <HandTrackerContext.Provider value={{ handDataRef, videoRef, isReady }}>
      <div className="fixed inset-0 pointer-events-none opacity-0 overflow-hidden">
        <video ref={videoRef} className="absolute w-1 h-1" playsInline muted />
      </div>
      {children}
    </HandTrackerContext.Provider>
  );
};
