"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

function GlassShape({ position, rotation, scale, type }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === "dark";

  // Slowly rotate each individual piece for extra dynamism
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  const getGeometry = () => {
    return <torusGeometry args={[1, 0.35, 16, 32]} />; // Lower poly count for better performance
  };

  return (
    <Float 
      speed={1.5} // Slightly slower for smoother feel
      rotationIntensity={1}
      floatIntensity={1.5}
      position={position}
    >
      <mesh ref={meshRef} rotation={rotation} scale={scale}>
        {getGeometry()}
        {/* Swapped MeshTransmissionMaterial for MeshPhysicalMaterial for massive FPS boost */}
        <meshPhysicalMaterial
          color={isDark ? "#ffffff" : "#f0f0f0"}
          metalness={0.1}
          roughness={0.1}
          transmission={0.9} // Glass effect
          ior={1.5}
          thickness={0.5}
          envMapIntensity={isDark ? 1.5 : 1}
          transparent={true}
          opacity={isDark ? 0.8 : 0.6}
        />
      </mesh>
    </Float>
  );
}

export function FloatingGlassParticles() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Pre-generate random positions, scales, and types for the glass pieces
  const particles = useMemo(() => {
    const items = [];
    
    // Create 30 scattered glass pieces (down from 45 for better performance, but still fills screen)
    for (let i = 0; i < 30; i++) {
      items.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 35, // Spread much wider across X axis
          (Math.random() - 0.5) * 25, // Spread much wider across Y axis
          (Math.random() - 0.5) * 15 - 5, // Z axis 
        ] as [number, number, number],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ] as [number, number, number],
        scale: Math.random() * 0.4 + 0.2, // Slightly smaller sizes (0.2 to 0.6) so it doesn't feel cluttered
        type: "torus", // Exclusively donut shape
      });
    }
    return items;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }} // Disabled antialias for speed, glass doesn't strictly need it
        dpr={[1, 1.5]} // Capped at 1.5 to prevent massive 4K resolution rendering lag
        frameloop="always"
      >
        <ambientLight intensity={isDark ? 0.3 : 0.8} />
        <directionalLight position={[10, 10, 5]} intensity={isDark ? 1.5 : 2.5} color={isDark ? "#a78bfa" : "#ffffff"} />
        <directionalLight position={[-10, -10, -5]} intensity={isDark ? 1 : 1.5} color={isDark ? "#38bdf8" : "#e2e8f0"} />
        
        {particles.map((p) => (
          <GlassShape
            key={p.id}
            position={p.position}
            rotation={p.rotation}
            scale={p.scale}
            type={p.type}
          />
        ))}
        
        {/* Environment mapping is crucial for realistic glass reflections */}
        <Environment preset={isDark ? "city" : "studio"} />
      </Canvas>
    </div>
  );
}
