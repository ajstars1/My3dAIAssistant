"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function TalkingMan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Camera position
    camera.position.z = 5;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // Audio setup
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();

    // Load audio file
    audioLoader.load(
      "/assets/audio/talking.mp3",
      (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);
        sound.play();
      },
      undefined,
      (error) => {
        console.error("An error occurred loading the audio:", error);
        setError(
          "Failed to load audio. The animation will continue without sound."
        );
      }
    );

    // Model and animation variables
    let mixer: THREE.AnimationMixer;
    let talkAction: THREE.AnimationAction;

    // Load 3D model
    const loader = new GLTFLoader();
    loader.load(
      "/assets/3d/talking-man.glb",
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Set up animations
        mixer = new THREE.AnimationMixer(model);
        const animations = gltf.animations;
        talkAction = mixer.clipAction(
          animations.find((clip) => clip.name === "talk") || animations[0]
        );

        // Start the talking animation
        startTalking();
      },
      undefined,
      (error) => {
        console.error("An error occurred loading the model:", error);
        setError("Failed to load 3D model. Please try refreshing the page.");
      }
    );

    // Function to start random talking animations
    function startTalking() {
      if (talkAction) {
        talkAction.play();

        // Randomly pause and resume the talking animation
        setInterval(() => {
          if (Math.random() > 0.5) {
            talkAction.paused = !talkAction.paused;
          }
        }, 1000); // Check every second
      }
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (mixer) {
        mixer.update(0.016); // Update animations (assuming 60fps)
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      sound.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
