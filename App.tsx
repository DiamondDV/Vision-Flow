
import React, { useState } from 'react';
import { HandTrackerProvider } from './components/HandTracker';
import VirtualCursor from './components/VirtualCursor';
import GazeButton from './components/GazeButton';
import { AppRoute } from './types';
import VisionLens from './views/VisionLens';
import AirCanvas from './views/AirCanvas';
import HandMimic from './views/HandMimic';
import { LayoutDashboard, Pencil, ScanEye, Settings, Github, Hand, Repeat } from 'lucide-react';

const Dashboard: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <div className="p-6 bg-blue-500/10 rounded-full mb-8 animate-pulse">
      <Hand size={64} className="text-blue-400" />
    </div>
    <h1 className="text-6xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
      VISION FLOW <span className="text-blue-500">OS</span>
    </h1>
    <p className="text-white/40 text-lg max-w-lg mb-12">
      The world's first spatial operating system built for the web. Powered by Gemini AI and real-time hand-tracking.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      <div className="glass p-8 rounded-[40px] border-white/5 flex flex-col items-center gap-4 hover:bg-white/10 transition-colors">
        <ScanEye size={32} className="text-blue-400" />
        <h2 className="text-lg font-bold">Live Vision</h2>
        <p className="text-white/40 text-xs">Continuous neural analysis of your camera feed.</p>
      </div>
      <div className="glass p-8 rounded-[40px] border-white/5 flex flex-col items-center gap-4 hover:bg-white/10 transition-colors">
        <Pencil size={32} className="text-purple-400" />
        <h2 className="text-lg font-bold">Air Sketch</h2>
        <p className="text-white/40 text-xs">Pinch and draw mid-air with precision controls.</p>
      </div>
      <div className="glass p-8 rounded-[40px] border-white/5 flex flex-col items-center gap-4 hover:bg-white/10 transition-colors">
        <Repeat size={32} className="text-green-400" />
        <h2 className="text-lg font-bold">Hand Mimic</h2>
        <p className="text-white/40 text-xs">Real-time skeleton tracking and mimicry engine.</p>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.DASHBOARD);

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.VISION_LENS: return <VisionLens />;
      case AppRoute.AIR_CANVAS: return <AirCanvas />;
      case AppRoute.HAND_MIMIC: return <HandMimic />;
      default: return <Dashboard />;
    }
  };

  return (
    <HandTrackerProvider>
      <div className="relative h-screen w-screen overflow-hidden bg-[#050505]">
        <VirtualCursor />
        
        {/* Navigation Sidebar */}
        <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 p-3 glass rounded-[40px] border-white/5 shadow-2xl">
          {[
            { id: AppRoute.DASHBOARD, icon: LayoutDashboard, label: 'Home' },
            { id: AppRoute.VISION_LENS, icon: ScanEye, label: 'Vision' },
            { id: AppRoute.AIR_CANVAS, icon: Pencil, label: 'Sketch' },
            { id: AppRoute.HAND_MIMIC, icon: Repeat, label: 'Mimic' },
            { id: AppRoute.SETTINGS, icon: Settings, label: 'System' },
          ].map((item) => (
            <div key={item.id} className="relative group">
              <GazeButton
                onClick={() => setActiveRoute(item.id)}
                className={`p-4 rounded-full transition-all ${activeRoute === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon size={22} />
              </GazeButton>
              <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 glass rounded-xl text-[9px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </div>
            </div>
          ))}
        </nav>

        {/* Branding */}
        <div className="fixed top-8 left-8 z-50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/20">V</div>
          <div className="hidden md:block">
            <div className="font-black text-base tracking-widest text-white leading-none mb-1">VISIONFLOW</div>
            <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest opacity-80">Spatial Cognitive OS</div>
          </div>
        </div>

        {/* Footer info */}
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-8 text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            Neural Link Active
          </div>
          <GazeButton onClick={() => window.open('https://github.com', '_blank')}>
            <Github size={16} />
          </GazeButton>
        </div>

        {/* Content Area */}
        <main className="h-full w-full pl-24 transition-all duration-500">
          <div className="h-full w-full animate-in fade-in duration-700">
            {renderContent()}
          </div>
        </main>

        {/* Backdrop Glows */}
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      </div>
    </HandTrackerProvider>
  );
};

export default App;
