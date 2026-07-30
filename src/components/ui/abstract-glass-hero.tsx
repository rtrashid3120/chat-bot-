"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment, Float, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

function GlassShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} scale={1.5}>
        <torusKnotGeometry args={[1, 0.3, 256, 64]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={1}
          thickness={0.5}
          chromaticAberration={0.8}
          anisotropy={0.3}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.1}
          ior={1.5}
          color={isDark ? "#ffffff" : "#e0e0e0"}
          resolution={1024}
        />
      </mesh>
    </Float>
  );
}

export function AbstractGlassHero() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="city" />
        <GlassShape />
        <Sparkles count={150} scale={10} size={2} speed={0.4} opacity={0.2} />
      </Canvas>
    </div>
  );
}
