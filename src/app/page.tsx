import ClientWrapper from '@/components/ClientWrapper';


// This remains a Server Component
export default function Page() {

  const API_KEY = process.env.GEMINI_API_KEY;

  // Validate API key (can happen on the server)
  if (typeof API_KEY !== "string") {
    throw new Error("GEMINI_API_KEY must be set in environment variables");
  }

  // Server-side configuration
  const host = "generativelanguage.googleapis.com";
  const wsUri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

  // Render the ClientWrapper, which handles the loading delay and MainContent rendering.
  // Suspense here acts as a fallback *if* ClientWrapper itself is slow to load (less likely).
  return (
      <ClientWrapper 
        apiKey={API_KEY}
        wsUri={wsUri}
      />
  );
}