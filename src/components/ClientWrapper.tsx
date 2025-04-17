'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingEffect } from '@/components/ui/loading';

// Dynamically import MainContent within the client wrapper
const MainContent = dynamic(() => import('@/components/MainContent'), {
  ssr: false,
  loading: () => <LoadingFallback /> // Fallback during MainContent's own load
});

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="h-[40rem] flex items-center justify-center">
       <LoadingEffect text="AJ" />
      </div>
    </div>
  );
}

interface ClientWrapperProps {
  apiKey: string;
  wsUri: string;
}

export default function ClientWrapper({ apiKey, wsUri }: ClientWrapperProps) {
  const [showMinimumLoaderTime, setShowMinimumLoaderTime] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMinimumLoaderTime(false);
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showMinimumLoaderTime) {
    // Show the main loader for the first 2 seconds
    return <LoadingFallback />;
  }

  // After 2 seconds, render MainContent (Suspense handles its dynamic load)
  // No need for extra Suspense here as dynamic() already handles it with 'loading:'
  return (
      <MainContent
        apiKey={apiKey}
        wsUri={wsUri}
      />
  );
} 