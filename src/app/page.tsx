import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import MainContent with no SSR (since it uses browser APIs)
const MainContent = dynamic(() => import('@/components/MainContent'), {
  ssr: false,
  loading: () => <LoadingFallback />
});

// Simple loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-white text-xl">Loading 3D Experience...</div>
    </div>
  );
}

export default function Page() {
  const API_KEY = process.env.GEMINI_API_KEY;

  // Validate API key
  if (typeof API_KEY !== "string") {
    throw new Error("GEMINI_API_KEY must be set in environment variables");
  }

  // Server-side configuration
  const host = "generativelanguage.googleapis.com";
  const wsUri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MainContent 
        apiKey={API_KEY}
        wsUri={wsUri}
      />
    </Suspense>
  );
}