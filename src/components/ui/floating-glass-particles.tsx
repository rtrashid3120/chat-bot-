"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

function GlassShape({ position, rotation, scale, type }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === "dark";

  // Slowly rotate each individual piece for extra dynamism
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  const getGeometry = () => {
    switch (type) {
      case "torus":
        return <torusGeometry args={[1, 0.4, 32, 64]} />;
      case "icosahedron":
        return <icosahedronGeometry args={[1.2, 0]} />;
      case "octahedron":
        return <octahedronGeometry args={[1.2, 0]} />;
      case "sphere":
      default:
        return <sphereGeometry args={[1, 64, 64]} />;
    }
  };

  return (
    <Float 
      speed={2} // Animation speed
      rotationIntensity={1.5} // XYZ rotation intensity
      floatIntensity={2} // Up/down float intensity
      position={position}
    >
      <mesh ref={meshRef} rotation={rotation} scale={scale}>
        {getGeometry()}
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={1.5}
          chromaticAberration={0.4}
          anisotropy={0.3}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[0, 1400]}
          clearcoat={1}
          roughness={0.15}
          transmission={0.95}
          color={isDark ? "#ffffff" : "#f0f0f0"}
          attenuationDistance={isDark ? 5 : 2}
          attenuationColor={isDark ? "#ffffff" : "#c4b5fd"}
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
    
    // Create 45 scattered glass pieces to fill the screen
    for (let i = 0; i < 45; i++) {
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
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
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
