'use client';

import React from 'react';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
import { Bot } from 'lucide-react';

const PersonaSidebar = () => {
  const { availablePersonas, selectedPersona, changePersona, isConnecting } = useLiveAPIContext();

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-4 shadow-lg z-40 border-r border-gray-700 flex flex-col">
      <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
        <Bot className="h-5 w-5" />
        <span>Select Persona</span>
      </h2>
      <ScrollArea className="flex-grow pr-2 -mr-2"> {/* Offset scrollbar */} 
        <div className="space-y-2">
          {availablePersonas.map((persona) => (
            <Button
              key={persona.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left px-3 py-2 rounded-md transition-colors duration-150",
                selectedPersona.id === persona.id
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              )}
              onClick={() => changePersona(persona.id)}
              disabled={isConnecting || selectedPersona.id === persona.id}
            >
              {persona.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
      {isConnecting && (
        <div className="mt-4 text-sm text-gray-400 text-center">Connecting...</div>
      )}
    </div>
  );
};

export default PersonaSidebar; 