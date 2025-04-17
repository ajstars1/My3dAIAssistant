'use client';
import React, { memo } from 'react';
import ControlPanel from '@/components/control-panel/ControlPanel';
import AITalkingMan from '@/components/pageRender';
import PersonaSidebar from '@/components/PersonaSidebar';
import "../app/App.scss";
import { LiveAPIProvider } from '@/contexts/LiveAPIContext';
import { Bot } from 'lucide-react';

interface MainContentProps {
  apiKey: string;
  wsUri: string;
}

const MainContent = memo(({ apiKey, wsUri }: MainContentProps) => {
  return (
    <LiveAPIProvider url={wsUri} apiKey={apiKey}>
      <div className="relative min-h-screen bg-black flex">
        {/* Sidebar - Fixed position */} 
        <PersonaSidebar />

        {/* Main Content Area - Padded left to make space for the sidebar */} 
        <div className="flex-grow pl-64"> {/* Add padding-left equal to sidebar width */} 
          <div className="relative h-screen"> {/* Use h-screen for full height */} 
            {/* Canvas Content */} 
            <div className="absolute inset-0 flex items-center justify-center"> {/* Center canvas within this padded area */} 
              <div id="canvas-container" className="w-full h-full">
                <AITalkingMan />
              </div>
            </div>

            {/* UI Overlay - Title Banner */} 
            {/* Adjust positioning if needed, but centering relative to viewport might still be okay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
              <div 
                className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-6 py-3 rotate-[-1deg] shadow-lg pointer-events-auto hover:rotate-[1deg] transition-all duration-300"
                style={{ willChange: 'transform' }}
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
        </div>
      </div>
      {/* Control panel - Placed outside the main flex container, might need position review */}
      <ControlPanel />
    </LiveAPIProvider>
  );
});

MainContent.displayName = 'MainContent';

export default MainContent; 