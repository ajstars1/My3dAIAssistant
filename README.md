# Talking Man - Interactive AI Assistant

This project demonstrates an interactive 3D character powered by a multimodal AI model. Users can speak to the character, and it responds with generated speech, utilizing technologies like Three.js, React Three Fiber, and a multimodal AI API (like Google's Gemini Pro via Live SDK concepts).

## Features

*   **Interactive 3D Model:** A rigged and animated character model displayed using Three.js and React Three Fiber.
*   **Real-time Audio Input:** Captures microphone audio using the Web Audio API.
*   **AI Interaction:** Sends audio input to a multimodal AI model.
*   **Persona Selection:** Choose different AI personalities (personas) from the sidebar, each with unique system instructions and voices.
    *   **Default Assistant (Voice: Aoede):** General information about the creator.
    *   **Business Advisor (Voice: Charon):** Focuses on entrepreneurial and technical leadership aspects.
    *   **Technical Recruiter (Voice: Puck):** Highlights technical skills and project experience.
    *   **AI Pandit (Voice: Kore):** Discusses the underlying technology and potential of AI/XR.
*   **Generated Speech Output:** Receives audio output from the AI and plays it back.
*   **Lip Sync (Basic):** Animates the character's mouth based on whether the AI is speaking.
*   **Audio Visualization:** Displays a simple visualizer for microphone input volume.
*   **UI Controls:** Sidebar for persona selection and a control panel for connecting/disconnecting and muting the microphone.

## Project Structure

```
/src
├── app                 # Next.js App Router specific files (layout, page)
├── components          # Reusable React components
│   ├── audio-visualizer
│   ├── control-panel
│   ├── model
│   ├── pageRender      # Main 3D canvas setup
│   └── PersonaSidebar  # Sidebar for selecting AI persona
│   └── ui              # Shadcn UI components (Button, ScrollArea)
├── config              # Configuration files
│   └── personas.ts     # Definitions for AI personas and voices
├── contexts            # React Context providers
│   └── LiveAPIContext.tsx # Manages API connection, state, and persona
├── hooks               # Custom React hooks
│   └── use-live-api.ts # Hook abstracting the WebSocket API interaction
├── lib                 # Core logic and utilities
│   ├── audio-recorder.ts # Microphone input handling
│   ├── audio-streamer.ts # Audio output handling
│   ├── multimodal-live-client.ts # WebSocket client class
│   └── utils.ts        # Utility functions
│   └── worklets        # Audio worklets (e.g., volume meter)
└── multimodal-live-types.ts # TypeScript types for API communication
/public                 # Static assets (e.g., 3D model)
README.md               # This file
# ... other config files (next.config.js, tsconfig.json, etc.)
```

## Setup and Running

1.  **Prerequisites:**
    *   Node.js (LTS version recommended)
    *   npm or yarn
2.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
4.  **Environment Variables:**
    *   Create a `.env.local` file in the root directory.
    *   Add your API key for the multimodal service:
        ```
        GEMINI_API_KEY=YOUR_API_KEY_HERE
        ```
5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
6.  Open your browser to `http://localhost:3000`.

## How it Works

1.  **UI (`MainContent`, `PersonaSidebar`, `ControlPanel`):** Provides the main layout, persona selection, and controls for starting/stopping the session and muting.
2.  **Context (`LiveAPIProvider`):** Manages the overall state, including the selected persona, connection status, and API client instance.
3.  **Hook (`useLiveAPI`):** Encapsulates the low-level WebSocket communication using `MultimodalLiveClient`. It handles connecting, disconnecting, sending/receiving messages, and processing audio streams.
4.  **Client (`MultimodalLiveClient`):** A class managing the WebSocket connection, sending setup/data messages, and emitting events for incoming data (audio, content, tool calls, etc.).
5.  **Audio Input (`MicrophoneProcessor`):** Accesses the microphone via `getUserMedia`, processes the audio stream (potentially using an AudioWorklet) to get PCM data chunks, and sends them via the context/hook.
6.  **Audio Output (`AudioPlaybackStreamer`):** Receives PCM audio chunks from the API via events, queues them, and plays them back using the Web Audio API (likely via an AudioWorklet for smooth playback).
7.  **3D Rendering (`AITalkingMan`, `TalkingManModel`):** Uses `@react-three/fiber` and `@react-three/drei` to render the scene, load the 3D model (`.glb`), and control animations based on the `isPlaying` state (derived from AI speech activity).
8.  **Persona Logic:**
    *   Personas (system instructions and voices) are defined in `src/config/personas.ts`.
    *   `PersonaSidebar` displays options and calls `changePersona` from the context.
    *   `LiveAPIContext` handles `changePersona`: updates the selected persona state, disconnects if needed, and updates the internal config in the `useLiveAPI` hook.
    *   `useLiveAPI` uses the config provided by the context (via `setConfig`) when establishing a connection.

## Key Technologies

*   Next.js (React Framework)
*   React Three Fiber / Drei (React renderer for Three.js)
*   Three.js (3D graphics library)
*   TypeScript
*   Web Audio API (Microphone input, Audio output, Worklets)
*   WebSocket API (Real-time communication with AI service)
*   Shadcn UI (Button, ScrollArea - requires manual installation via CLI)
*   Tailwind CSS (Styling)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
