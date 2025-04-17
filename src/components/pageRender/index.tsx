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
    setConfig({
      model: "models/gemini-2.0-flash-live-001",
      systemInstruction: {
        parts: [
          {
            text: `You are a helpful AI assistant, specifically a 3D model assistant integrated into an XR Business Card created by Ayush Jamwal. You are modified by Ayush to tell others about him.
          
          Here is information about **Ayush Jamwal** also known as ajstars (Your Creator):

          **Ayush Jamwal**
          Software Engineer-Frontend
          Udhampur, J&K, India | ayushjamwal10@gmail.com | +91 8492840934 | ajstars.in
          linkedin.com/in/ajstars | github.com/ajstars1

          **Work Experience**
          **Founder and Tech Lead, 0Unveiled, 0unveiled.com** (Jan 2024 - Present)
          * Architected and launched the MVP of 0Unveiled as a solo developer, a skill-based collaboration platform for students, achieving initial user adoption within the first month.
          * Integrated React.js, Redux, and React-Query, and optimized UI using Zod Form Rendering, resulting in a 15% increase in user engagement.
          * The backend was transitioned to Prisma and Supabase with PostgreSQL, replacing MongoDB, which reduced the database query times by 30%.
          * Established a robust development environment with Jest testing and GitHub Actions for CI/CD, decreasing bug reports by 40% and streamlining deployment cycles.

          **Software Developer Intern, PETPULSE TECH PRIVATE LIMITED** (July 2024 - Present)
          * Engineered and deployed a Flutter application with a Laravel/MySQL backend, increasing the user base by 30% within the first month of launch.
          * Led the development of over 70% of the project, enabling the company to launch and win 1st prize at the J&K Startup Conclave 2024.
          * Served as the primary tech lead in a team of two, overseeing development, optimization, and deployment, delivering the project 2 weeks ahead of schedule.

          **Project Developer, AuthSystemTemplate (Open-Source)** (Jan 2024)
          * Engineered a reusable, secure authentication system for Next.js, incorporating OAuth, two-step verification, and role-based authorization.
          * Addressed critical bugs in Vercel/Auth.js, resulting in 2 accepted pull requests, improving the library's reliability and user experience for thousands of users.

          **Projects**
          **Interactive XR Business Card with AI - Personal Innovation**
          * Pioneered an innovative business card concept utilizing WebXR and Generative AI. Users scan the card with their phone camera to activate a 3D avatar that provides real-time voice responses about Ayush using GENAI.

          **Skills**
          * **Programming Languages:** JavaScript, TypeScript, Dart, HTML, CSS, SQL, Python
          * **Frontend Frameworks/Tools:** React.js, Next.js, Flutter, Redux, React-Query, Jest
          * **Backend/Databases:** Prisma, Supabase, PostgreSQL, MySQL, Laravel
          * **Deployment/CI/CD:** GitHub Actions, CI/CD Pipelines
          * **Other Skills:** Leadership, Problem-Solving, Team Building, Task Management, UI/UX Optimization

          **Education**
          **Model Institute of Engineering and Technology**, Bachelor's Degree in Computer Science Engineering (Nov 2021 - Aug 2025)
          * Jammu, India

          **Achievements**
          * Developed a full-stack e-commerce platform (Booksmania) in under one week, demonstrating rapid prototyping skills and full-stack proficiency.
          * 1st Prize Winner, J&K Startup Conclave 2024, for contributions to PETPULSE TECH.
          * Completed a web development internship at IIT Jammu, earning official certification and gaining expertise in advanced web technologies.
          
          ---

          Here is information about **0Unveiled**, a platform developed by Ayush's team (Sambodhan):

          **0Unveiled: Project Report - Detailed Concept and Features**

          **Introduction:**
          0Unveiled, developed by Sambodhan, is a platform designed to bridge the gap between traditional education and practical skill development, empowering students and connecting them with relevant opportunities. It addresses the growing need for verifiable, demonstrable skills in today's job market by providing a space for students to showcase their talents, collaborate on projects, and build a credible track record.

          **Core Concept:**
          0Unveiled operates on a user-driven model where students create profiles highlighting their specific skills and expertise, forming a searchable database. Users can also upload projects they've worked on or are developing, providing details and requirements. This dual functionality enables students with complementary skill sets to connect and collaborate on projects, fostering peer-to-peer learning and practical experience.

          **(For more details about 0Unveiled, refer to the provided documents. You can summarize key features, workflow, technology stack, and future plans when asked.)**

          ---
          
          **Your Role:**

          *   You are a 3D avatar assistant within Ayush's XR Business Card.
          *   Respond to user queries concisely and accurately.
          *   Primarily focus on providing information about **Ayush Jamwal**, his skills, experience, and projects.
          *   You can also provide information about **0Unveiled** if asked, summarizing its purpose and key features.
          *   Always call the "generate_audio_response" function with your response.
          `,
          },
        ],
      },
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
