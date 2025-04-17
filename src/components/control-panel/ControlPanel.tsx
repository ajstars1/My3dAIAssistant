'use client';

import React, { useState, useEffect, memo } from 'react';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import AudioVisualizer from '../audio-visualizer/AudioVisualizer';
import { MicrophoneProcessor } from '@/lib/audio-recorder';
import { Mic, MicOff, Play, Pause } from 'lucide-react';
import './control-panel.scss';

// Remove videoRef and supportsVideo props as they're not needed
interface ControlPanelProps {}

/**
 * Control panel for interacting with the AI assistant
 */
const ControlPanel = memo(({}: ControlPanelProps) => {
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new MicrophoneProcessor());
  const [muted, setMuted] = useState(false);
  
  const { client, connected, connect, disconnect, volume } = useLiveAPIContext();

  // Handle microphone input
  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([{
        mimeType: 'audio/pcm;rate=16000',
        data: base64,
      }]);
    };
    
    if (connected && !muted && audioRecorder) {
      audioRecorder.on('audioData', onData).on('volumeUpdate', setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    
    return () => {
      audioRecorder.off('audioData', onData).off('volumeUpdate', setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);
  
  return (
    <div className="control-panel">
      <div className="controls-group">
        <button 
          className={`control-button ${muted ? 'muted' : ''}`}
          onClick={() => setMuted(!muted)}
          disabled={!connected}
        >
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        
        <div className="visualizer-wrapper">
          <AudioVisualizer 
            active={connected} 
            volume={volume} 
            hover={!muted} 
          />
        </div>
      </div>
      
      <div className="connection-control">
        <button 
          className={`connect-button ${connected ? 'connected' : ''}`}
          onClick={connected ? disconnect : connect}
        >
          {connected ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <span className="status-label">
          {connected ? 'Active' : 'Start'}
        </span>
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';

export default ControlPanel; 