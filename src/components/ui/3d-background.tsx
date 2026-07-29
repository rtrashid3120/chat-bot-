"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";

function ParticleField({ count = 3000, color = "#a855f7" }) {
  const ref = useRef<THREE.Points>(null);
  
  const sphere = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 8 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={color}
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

export function ChatBackground3D({ isWalkieMode = false }: { isWalkieMode?: boolean }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const particleColor = isWalkieMode 
    ? (isDark ? "#f43f5e" : "#e11d48") // Rose for Walkie Mode
    : (isDark ? "#a855f7" : "#8b5cf6"); // Purple/Brand for normal

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-40 transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleField count={isWalkieMode ? 4000 : 2500} color={particleColor} />
      </Canvas>
    </div>
  );
}
