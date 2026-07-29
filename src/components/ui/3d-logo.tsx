"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Environment, Float, Sparkles } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { cn } from "@/lib/utils";

function LogoCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const coreColor = isDark ? "#ffffff" : "#000000";
  const glowColor = isDark ? "#a855f7" : "#3b82f6";

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate constantly
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
      
      // Gentle scale pulse on hover
      const targetScale = hovered ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[1.5, 0]} />
        <MeshDistortMaterial
          color={coreColor}
          envMapIntensity={isDark ? 1 : 0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.8}
          roughness={0.2}
          distort={0.1}
          speed={1.5}
        />
      </mesh>
      
      {/* Wireframe outer shell */}
      <mesh scale={1.2}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color={glowColor} wireframe transparent opacity={0.3} />
      </mesh>

      <Sparkles count={80} scale={4} size={3} speed={0.4} color={glowColor} opacity={isDark ? 0.8 : 0.4} />
    </Float>
  );
}

export function AILogo3D({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-full min-h-[300px] relative z-10 cursor-pointer", className)}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
        <LogoCore />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
