"use client";

import React, { useRef, useState, useEffect, useCallback, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { TalkingManModel } from "../model/TalkingManModel";

// Define the function declaration once outside component to prevent recreation on renders
const declaration: FunctionDeclaration = {
  name: "generate_audio_response",
  description: "Generates an audio response based on user input.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      response_text: {
        type: SchemaType.STRING,
        description: "The text response to be converted to audio",
      },
    },
    required: ["response_text"],
  },
};

// Create a throttled version of synthesizeSpeech to prevent multiple calls
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      return func(...args);
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        resolve(func(...args));
        timeoutId = null;
      }, delay - timeSinceLastCall);
    });
  };
};

// Memoized component for better performance
const AITalkingMan = memo(() => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { client, setConfig, connected, connect } = useLiveAPIContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Configure model using useCallback to prevent unnecessary recreations
  const configureModel = useCallback(() => {
    // System instruction is now handled by the context during connect
    // We only need to set model-specific tools here if needed.
    setConfig({
      model: "models/gemini-2.0-flash-live-001",
      // systemInstruction: { ... } // REMOVED - Handled by context
      tools: [{ functionDeclarations: [declaration] }],
    });
  }, [setConfig]);

  // Set up model configuration on mount
  useEffect(() => {
    configureModel();
  }, [configureModel]);

  // Throttled version of synthesizeSpeech to prevent multiple calls
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledSynthesizeSpeech = useCallback(
    throttle(async (text: string): Promise<Blob> => {
      // Simulate TTS (replace with actual implementation)
      await new Promise((resolve) => setTimeout(resolve, text.length * 50));
      return new Blob([""], { type: "audio/mpeg" });
    }, 300),
    []
  );

  // Handle AI responses and animations with optimized event handling
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;

    const onContent = () => {
      // Model is generating content, start animation
      setIsPlaying(true);
    };

    const onTurnComplete = () => {
      // Add a small delay before stopping animation to account for any audio playback
      animationTimeout = setTimeout(() => {
        setIsPlaying(false);
      }, 500);
    };

    const onAudio = () => {
      // Received audio data, ensure animation is playing
      setIsPlaying(true);
      
      // Clear any existing timeout to stop animation
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };

    const onToolCall = async (toolCall: any) => {
      const fc = toolCall.functionCalls.find(
        (fc: any) => fc.name === declaration.name
      );
      
      if (fc) {
        setIsPlaying(true);
        const responseText = (fc.args as any).response_text;
        console.log("AI Response:", responseText);

        try {
          // Clean up previous audio element if exists
          if (audioRef.current) {
            audioRef.current.pause();
            URL.revokeObjectURL(audioRef.current.src);
          }

          const audioBlob = await throttledSynthesizeSpeech(responseText);
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
          };
          
          await audio.play();
        } catch (error) {
          // console.error("TTS Error:", error);
          // setError("Failed to synthesize speech.");
          setIsPlaying(false);
        }
      }
    };

    // Register event handlers
    client
      .on("content", onContent)
      .on("turncomplete", onTurnComplete)
      .on("audio", onAudio)
      .on("toolcall", onToolCall);

    // Cleanup - important for preventing memory leaks
    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
      
      // Clean up audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      // Remove event listeners
      client
        .off("content", onContent)
        .off("turncomplete", onTurnComplete)
        .off("audio", onAudio)
        .off("toolcall", onToolCall);
    };
  }, [client, throttledSynthesizeSpeech]);

  return (
    <div className="relative w-full h-screen">
      <Canvas 
        camera={{ position: [0, 1.5, 3] }}
        dpr={[1, 2]} // Optimize for different device pixel ratios
        performance={{ min: 0.5 }} // Allow performance scaling for slower devices
      >
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <TalkingManModel play={isPlaying} />
        <OrbitControls enableDamping dampingFactor={0.2} />
      </Canvas>
      
      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
});

AITalkingMan.displayName = 'AITalkingMan';

export default AITalkingMan;
