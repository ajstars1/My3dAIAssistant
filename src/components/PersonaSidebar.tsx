'use client';

import React from 'react';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bot, X } from 'lucide-react';

// Define props for the component
interface PersonaSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const PersonaSidebar: React.FC<PersonaSidebarProps> = ({ isOpen, setIsOpen }) => {
  const { availablePersonas, selectedPersona, changePersona, isConnecting } = useLiveAPIContext();

  return (
    <>
      {/* Backdrop for mobile */} 
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar container */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-4 shadow-lg z-40 border-r border-gray-700 flex flex-col transition-transform duration-300 ease-in-out",
          // Mobile state
          "md:translate-x-0", // Always visible on md+
          isOpen ? "translate-x-0" : "-translate-x-full", // Slide in/out on mobile
        )}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span>Select Persona</span>
          </h2>
          {/* Close button - visible only on mobile when open */} 
          <Button 
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
              <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-grow pr-2 -mr-2"> 
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
                onClick={() => {
                    changePersona(persona.id);
                    setIsOpen(false); // Close sidebar on selection (mobile)
                }}
                disabled={isConnecting || selectedPersona.id === persona.id}
              >
                {persona.name}
                {persona.id === 'business_advisor' && (
                  <span className="ml-2 inline-block bg-transparent border border-red-400 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                    HOT
                  </span>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
        {isConnecting && (
          <div className="mt-4 text-sm text-gray-400 text-center">Connecting...</div>
        )}
      </div>
    </>
  );
};

export default PersonaSidebar; 