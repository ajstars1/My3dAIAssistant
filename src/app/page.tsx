import MainContent from '@/components/MainContent';

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
    <MainContent 
      apiKey={API_KEY}
      wsUri={wsUri}
    />
  );
}