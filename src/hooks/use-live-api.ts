import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MultimodalLiveAPIClientConnection,
  MultimodalLiveClient,
} from "../lib/multimodal-live-client";
import { LiveConfig } from "../multimodal-live-types";
import { AudioPlaybackStreamer } from "../lib/audio-streamer";
import VolumeMeterProcessorSource from "../lib/worklets/vol-meter";

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  setConfig: (config: LiveConfig) => void;
  config: LiveConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI({
  url,
  apiKey,
}: MultimodalLiveAPIClientConnection): UseLiveAPIResults {
  const client = useMemo(
    () => new MultimodalLiveClient({ url, apiKey }),
    [url, apiKey],
  );
  const audioStreamerRef = useRef<AudioPlaybackStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConfig>({
    model: "models/gemini-2.0-flash-live-001",
  });
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      try {
        // Directly create AudioContext
        const audioCtx = new AudioContext(); 
        audioStreamerRef.current = new AudioPlaybackStreamer(audioCtx);
        audioStreamerRef.current
          .registerWorklet<any>("vumeter-out", VolumeMeterProcessorSource, (ev: any) => {
            if (ev && typeof ev.volume === 'number') {
                setVolume(ev.volume);
            } else {
                console.warn("Received unexpected volume data format:", ev);
            }
          })
          .then(() => {
            console.log("Volume meter worklet registered successfully.");
          }).catch((error: any) => {
            console.error("Failed to register volume meter worklet:", error);
          });
      } catch (error: any) {
          console.error("Failed to initialize audio context or streamer:", error);
      }
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stopPlayback();

    const onAudio = (data: ArrayBuffer) => {
        if (audioStreamerRef.current) {
            try {
                 audioStreamerRef.current.addPcmChunk(new Uint8Array(data));
            } catch (e) {
                console.error("Error adding PCM chunk:", e);
            }
        }
    }
      
    client
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio);
    };
  }, [client]);

  const connect = useCallback(async () => {
    console.log("Connecting with config:", config);
    if (!config) {
      throw new Error("Configuration has not been set before connecting.");
    }
    try {
        client.disconnect();
        await client.connect(config);
        setConnected(true);
        console.log("Successfully connected.");
    } catch (error) {
        console.error("Connection failed:", error);
        setConnected(false);
    }
  }, [client, setConnected, config]);

  const disconnect = useCallback(async () => {
      try {
        client.disconnect();
        setConnected(false);
        console.log("Successfully disconnected.");
      } catch (error) {
          console.error("Error during disconnection:", error);
      }
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
  };
}
