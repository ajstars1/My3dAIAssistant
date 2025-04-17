"use client";

import { createContext, FC, ReactNode, useContext, useState, useCallback, useEffect } from "react";
import { useLiveAPI, UseLiveAPIResults } from "../hooks/use-live-api";
import { personas, defaultPersona, type Persona } from '@/config/personas';
// import { SessionConfig } from '@google/live-sdk'; // Removed import

// Assuming SessionConfig type might be available via UseLiveAPIResults or implicitly
// We need the actual type name for the config object required by setConfig
type LiveConfig = { model: string; systemInstruction?: any; tools?: any; [key: string]: any }; // Define based on error message
type ConfigType = Partial<LiveConfig>;

// Extend the original results type with persona state and functions
interface LiveAPIContextProps extends Omit<UseLiveAPIResults, 'connect' | 'disconnect' | 'setConfig'> { // Omit functions we'll override
  selectedPersona: Persona;
  availablePersonas: Persona[];
  changePersona: (personaId: string) => void;
  connect: () => Promise<void>; // Ensure connect signature matches previous
  disconnect: () => void; // Ensure disconnect signature matches previous
  setConfig: (config: ConfigType) => void; // Ensure setConfig signature matches previous
  isConnecting: boolean; // Add connecting state
  error: string | null; // Add error state
}

const LiveAPIContext = createContext<LiveAPIContextProps | undefined>(undefined);

export type LiveAPIProviderProps = {
  children: ReactNode;
  url?: string; // Keep optional if it was before
  apiKey: string;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
  url,
  apiKey,
  children,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(defaultPersona);
  const [sessionConfigOverrides, setSessionConfigOverrides] = useState<ConfigType>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pass only necessary props to the hook, config handled separately
  const liveAPI = useLiveAPI({ 
    url, 
    apiKey, 
    // config: liveAPIConfig, // REMOVED - Config likely set via setConfig method
    // dependencies: [selectedPersona.id] // REMOVED - Not a valid prop
  });

  // Combine base config from persona and any dynamic overrides
  const getCombinedConfig = useCallback((): LiveConfig => { // Return full LiveConfig
    return {
      model: sessionConfigOverrides.model || "models/gemini-2.0-flash-live-001", // Ensure model is always present
      ...sessionConfigOverrides, // Spread overrides (potentially overwriting model again if present)
      systemInstruction: selectedPersona.systemInstruction,
      // Use the voiceName from the selected persona
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: selectedPersona.voiceName // Use dynamic voice name
        }
      }
    };
  }, [selectedPersona, sessionConfigOverrides]);

  // Wrap the original connect to set config *before* connecting
  const connectWrapper = useCallback(async () => {
    if (liveAPI.connected || isConnecting) return;
    setIsConnecting(true);
    setError(null);
    // Always get the latest combined config right before connecting
    const configToUse = getCombinedConfig(); 
    console.log('Attempting to connect with persona:', selectedPersona.name);
    console.log('Using config:', configToUse);
    try {
      // Set config via the hook's method *immediately before* connecting
      if (liveAPI.setConfig) { 
        liveAPI.setConfig(configToUse); 
        console.log("Applied config to useLiveAPI hook just before connecting.");
      } else {
        console.warn('useLiveAPI does not provide setConfig, configuration might not be applied.');
      }
      await liveAPI.connect(); // Call the hook's connect
      console.log('Connection successful');
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
    // Pass selectedPersona as dependency to ensure getCombinedConfig uses the latest state
  }, [liveAPI, isConnecting, selectedPersona, getCombinedConfig]); 

  // Wrap disconnect (optional, but good for consistency or adding logs)
  const disconnectWrapper = useCallback(() => {
    if (!liveAPI.connected) return;
    console.log('Disconnecting...');
    liveAPI.disconnect();
    console.log('Disconnected');
  }, [liveAPI]);

  // Allow setting dynamic config overrides
  const setConfigWrapper = useCallback((newConfig: ConfigType) => { // Input can be partial
    setSessionConfigOverrides((prevConfig: ConfigType) => ({ ...prevConfig, ...newConfig })); // Store as partial
    // If connection is active, might need to disconnect and reconnect for changes to apply
    if (liveAPI.connected) {
        console.warn('Session config updated while connected. Reconnecting to apply changes...');
        // Automatically reconnecting might be too disruptive, consider manual trigger
        // disconnectWrapper();
        // setTimeout(() => connectWrapper(), 100);
    }
  }, [liveAPI.connected]); // Removed disconnect/connect wrappers from deps

  const changePersona = useCallback((personaId: string) => {
    const newPersona = personas.find(p => p.id === personaId);
    if (newPersona && newPersona.id !== selectedPersona.id) {
      console.log(`Changing persona to: ${newPersona.name}`);
      
      // Disconnect if currently connected
      if (liveAPI.connected) {
         console.log('Disconnecting before persona change...');
         disconnectWrapper(); // Use the wrapper
      }
      
      // Update the selected persona state
      setSelectedPersona(newPersona);

      // Immediately update the config within the useLiveAPI hook for the *next* connection
      // Calculate config based on the *new* persona
      const newConfig = { 
          ...sessionConfigOverrides, 
          systemInstruction: newPersona.systemInstruction, 
          model: sessionConfigOverrides.model || "models/gemini-2.0-flash-live-001" // Ensure model is included
      } as LiveConfig; // Cast to the expected full type
      
      if (liveAPI.setConfig) {
          liveAPI.setConfig(newConfig);
          console.log("Updated useLiveAPI hook's internal config with new persona.");
      } else {
           console.warn('useLiveAPI does not provide setConfig, config for next connection might be stale.');
      }

      // REMOVED automatic reconnect - User must manually connect again.
    }
  }, [liveAPI, selectedPersona.id, disconnectWrapper, sessionConfigOverrides]); // Added dependencies

  // REMOVED: Automatic connection useEffect - User must manually connect initially


  const contextValue: LiveAPIContextProps = {
    ...liveAPI, // Spread the original hook results
    selectedPersona,
    availablePersonas: personas,
    changePersona,
    connect: connectWrapper, // Provide wrapped connect
    disconnect: disconnectWrapper, // Provide wrapped disconnect
    setConfig: setConfigWrapper, // Provide wrapped setConfig
    isConnecting,
    error,
  };

  return (
    <LiveAPIContext.Provider value={contextValue}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = (): LiveAPIContextProps => {
  const context = useContext(LiveAPIContext);
  if (context === undefined) {
    throw new Error("useLiveAPIContext must be used within a LiveAPIProvider");
  }
  return context;
};
