import * as THREE from "three";
import React, { useRef, useEffect, memo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    Object_8: THREE.SkinnedMesh;
    GLTF_created_0_rootJoint: THREE.Bone;
  };
  materials: {
    Wolf3D_Avatar: THREE.MeshStandardMaterial;
  };
};

type ActionName = "Animation";
type GLTFActions = Record<ActionName, THREE.AnimationAction>;

interface TalkingManModelProps {
  play: boolean;
}

// Memoized model component for better performance
export const TalkingManModel = memo(({ play }: TalkingManModelProps) => {
  const group = useRef<THREE.Group>(null);
  const { nodes, materials, animations } = useGLTF(
    "/assets/3d/talking-man.glb"
  ) as GLTFResult;
  
  const { actions } = useAnimations(animations, group);
  const animatingRef = useRef(false);
  const timeRef = useRef(0);

  // Handle animation playback based on play prop
  useEffect(() => {
    const animationAction = actions["Animation"];
    
    if (play && animationAction) {
      // Only restart animation if not already playing
      if (!animatingRef.current) {
        animationAction
          .reset()
          .setEffectiveTimeScale(1.0)
          .setEffectiveWeight(1.0)
          .fadeIn(0.2)
          .play();
        animatingRef.current = true;
      }
    } else if (animationAction && animatingRef.current) {
      // Fade out animation smoothly
      animationAction.fadeOut(0.2).stop();
      animatingRef.current = false;
    }
    
    return () => {
      // Cleanup animation on unmount
      if (animationAction) {
        animationAction.stop();
      }
    };
  }, [play, actions]);

  // Add subtle idle animation when not playing the talking animation
  useFrame((_, delta) => {
    if (!play && group.current) {
      // Subtle breathing/idle motion
      timeRef.current += delta;
      const sinValue = Math.sin(timeRef.current * 1.5) * 0.05;
      
      // Apply subtle movement
      group.current.position.y = sinValue * 0.1;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        sinValue * 0.05,
        0.1
      );
    }
  });

  return (
    <group ref={group} dispose={null}>
      <group name="Scene">
        <group
          name="Model"
          position={[-0.0068, -0.6, -0.0042]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.2}
        >
          <group name="root">
            <group name="RootNode" rotation={[Math.PI / 2, 0, 0]}>
              <group name="Character">
                <group name="Skeleton">
                  <skinnedMesh
                    name="AvatarMesh"
                    geometry={nodes.Object_8.geometry}
                    material={materials.Wolf3D_Avatar}
                    skeleton={nodes.Object_8.skeleton}
                    castShadow
                    receiveShadow
                  />
                  <primitive object={nodes.GLTF_created_0_rootJoint} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

// Set display name for debugging
TalkingManModel.displayName = 'TalkingManModel';

// Preload the model for better performance
useGLTF.preload("/assets/3d/talking-man.glb");
