'use client';
import ControlTray from '@/components/control-tray/ControlTray';
import AITalkingMan from '@/components/pageRender'
import "./App.scss";
import { LiveAPIProvider } from '@/contexts/LiveAPIContext';
import React, { useRef, useState } from 'react'

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
      <AITalkingMan />
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