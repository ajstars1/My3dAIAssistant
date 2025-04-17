'use client';
import ControlTray from '@/components/control-tray/ControlTray';
import AITalkingMan from '@/components/pageRender'
import "../app/App.scss";
import { LiveAPIProvider } from '@/contexts/LiveAPIContext';
import React, { useRef } from 'react'
import { Bot} from 'lucide-react';

interface MainContentProps {
  apiKey: string;
  wsUri: string;
}

const MainContent = ({ apiKey, wsUri }: MainContentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <LiveAPIProvider url={wsUri} apiKey={apiKey}>
      <div className="relative min-h-screen bg-black">
        {/* Original 3D Canvas Content */}
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div id="canvas-container">
            {/* Your existing 3D canvas content */}
            <AITalkingMan />
          </div>
        </div>

        {/* Sticker-style Banners */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Top Title Sticker */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-6 py-3 rotate-[-1deg] shadow-lg pointer-events-auto hover:rotate-[1deg] transition-transform">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-black" />
              <h1 className="text-2xl font-bold text-black">
                AJ Stars&apos;s assistant
              </h1>
            </div>
          </div>
        </div>
      </div>
      <ControlTray
        videoRef={videoRef}
        supportsVideo={false}
      >
        {/* put your own buttons here */}
      </ControlTray>
    </LiveAPIProvider>
  );
}

export default MainContent; 