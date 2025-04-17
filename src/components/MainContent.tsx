'use client';
import React, { useRef, memo } from 'react';
import ControlPanel from '@/components/control-panel/ControlPanel';
import AITalkingMan from '@/components/pageRender';
import "../app/App.scss";
import { LiveAPIProvider } from '@/contexts/LiveAPIContext';
import { Bot } from 'lucide-react';

interface MainContentProps {
  apiKey: string;
  wsUri: string;
}

// Memoize component to prevent unnecessary re-renders
const MainContent = memo(({ apiKey, wsUri }: MainContentProps) => {
  return (
    <LiveAPIProvider url={wsUri} apiKey={apiKey}>
      <div className="relative min-h-screen bg-black">
        {/* Canvas Content - This is where the 3D rendering happens */}
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div id="canvas-container" className="w-full h-full">
            {/* Using React.memo on AITalkingMan would further optimize if needed */}
            <AITalkingMan />
          </div>
        </div>

        {/* UI Overlay - Positioning for title banner */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Title Banner */}
          <div 
            className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-6 py-3 rotate-[-1deg] shadow-lg pointer-events-auto hover:rotate-[1deg] transition-all duration-300"
            style={{ willChange: 'transform' }} // Performance hint for animations
          >
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-black" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-black">
                AJ Stars&apos;s assistant
              </h1>
            </div>
          </div>
        </div>
      </div>
      {/* Control panel with our custom component */}
      <ControlPanel />
    </LiveAPIProvider>
  );
});

// Set display name for better debugging
MainContent.displayName = 'MainContent';

export default MainContent; 