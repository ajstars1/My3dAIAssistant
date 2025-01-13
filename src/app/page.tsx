'use client';
import ControlTray from '@/components/control-tray/ControlTray';
import AITalkingMan from '@/components/pageRender'
import "./App.scss";
import { LiveAPIProvider } from '@/contexts/LiveAPIContext';
import React, { useRef, useState } from 'react'
import { Bot} from 'lucide-react';

const Page = () => {

const API_KEY = process.env.NEXT_PUBLIC_REACT_APP_GEMINI_API_KEY as string;

if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
 const videoRef = useRef<HTMLVideoElement>(null);
 // either the screen capture, the video or null, if null we hide it
//  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  return (
    <LiveAPIProvider url={uri} apiKey={API_KEY}>
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

        
          {/* Bottom Sticker */}
        </div>
      </div>
      <ControlTray
        videoRef={videoRef}
        supportsVideo={false}
        // onVideoStreamChange={setVideoStream}
      >
        {/* put your own buttons here */}
      </ControlTray>
    </LiveAPIProvider>
  );
}

export default Page