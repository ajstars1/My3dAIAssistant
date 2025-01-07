import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { ReactThreeFiber } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>;
    }
  }
}

export function Man({ play }: { play: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { nodes, materials, animations } = useGLTF(
    "/assets/3d/talking-man.glb"
  ) as unknown as {
    nodes: { [key: string]: THREE.SkinnedMesh }; // Change the structure of the nodes object to be dynamic
    materials: { [key: string]: THREE.Material };
    animations: THREE.AnimationClip[];
  };
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (play) {
      actions["talk"]?.play();
    } else {
      actions["talk"]?.stop();
    }
  }, [play, actions]);
   const meshNode = Object.values(nodes).find((node) => node.isSkinnedMesh);

   if (!meshNode) {
     console.error("SkinnedMesh not found in the model.");
     return null;
   }

  return (
    <group ref={group} dispose={null}>
      <group name="Scene">
        <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <primitive object={nodes.mixamorigHips} />
          <skinnedMesh
            name="Ch14"
            geometry={meshNode.geometry}
            material={materials.Ch14_Body}
            skeleton={meshNode.skeleton}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/assets/3d/talking-man.glb");
