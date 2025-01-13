"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { TalkingManModel } from "../model/TalkingManModel";

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

export default function AITalkingMan() {
  // const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { client, setConfig, connected, connect, disconnect } = useLiveAPIContext();

  // Configure model
  useEffect(() => {
   setConfig({
     model: "models/gemini-2.0-flash-exp",
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
    // setConfig({
    //   model: "models/gemini-2.0-flash-exp",
    //   systemInstruction: {
    //     parts: [
    //       {
    //         text: 'You are a helpful AI assistant. When I speak to you, respond concisely and call the "generate_audio_response" function with your response. If someone asks anything about "Ayush", provide relevant information. Ayush Jamwal is a Senior Frontend Engineer with over 3 years of experience in scalable web applications. He is the Founder and Tech Lead of 0Unveiled, a skill-based collaboration platform for students, launched on January 2, 2025. He has expertise in full-stack development, frontend frameworks like React.js, Next.js, and backend technologies such as Prisma, Supabase, and PostgreSQL. Ayush also created an innovative XR Business Card using WebXR and AI. He has won 1st Prize at the J&K Startup Conclave 2024 and completed a web development internship at IIT Jammu. In addition to his technical skills, he excels in leadership, problem-solving, and team building.',
    //       },
    //     ],
    //   },
    //   tools: [{ functionDeclarations: [declaration] }],
    // });

  }, [setConfig]);

  // Handle AI responses and animations
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
      }, 500); // Adjust timeout as needed
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

        // Simulate TTS duration or integrate with actual TTS
        try {
          const audioBlob = await synthesizeSpeech(responseText);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          await audio.play();
        } catch (error) {
          console.error("TTS Error:", error);
          setError("Failed to synthesize speech.");
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

    // Cleanup
    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
      client
        .off("content", onContent)
        .off("turncomplete", onTurnComplete)
        .off("audio", onAudio)
        .off("toolcall", onToolCall);
    };
  }, [client]);

  // Rest of your component code...
  return (
    <div className="relative w-full h-screen">
      <Canvas camera={{ position: [0, 1.5, 3] }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <TalkingManModel play={isPlaying} />
        <OrbitControls  />
      </Canvas>
      {/* ... rest of your UI components ... */}
    </div>
  );
}

// Helper function for TTS (replace with actual implementation)
async function synthesizeSpeech(text: string): Promise<Blob> {
  // Implement your text-to-speech logic here
  await new Promise((resolve) => setTimeout(resolve, text.length * 50));
  return new Blob([""], { type: "audio/mpeg" });
}
