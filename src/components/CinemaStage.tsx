import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

/**
 * Minimal Active-Theory-inspired atmosphere:
 * a single, very slowly drifting particle field (black/grey) with sparse
 * (~7%) #E8FF00 accents. Reacts subtly to the cursor (max ~15px, heavily damped).
 * No orbs, rings, jellies, or postprocessing — pure breathing space.
 */
export default function CinemaStage({ progress: _progress }: { progress: MotionValue<number> }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, background: "#050505" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(20,20,20,0.4) 0%, rgba(5,5,5,0.95) 55%, #000 100%)",
        }}
      />
      {mounted && (
        <Canvas
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Field />
        </Canvas>
      )}
    </div>
  );
}

function Field() {
  const grey = useRef<THREE.Points>(null);
  const accent = useRef<THREE.Points>(null);
  const wrap = useRef<THREE.Group>(null);
  const { size } = useThree();

  // pointer target (normalized -1..1) and damped current
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / size.width) * 2 - 1;
      target.current.y = -((e.clientY / size.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [size]);

  const TOTAL = 2200;
  const ACCENT_RATIO = 0.07; // ~7% yellow
  const accentCount = Math.round(TOTAL * ACCENT_RATIO);
  const greyCount = TOTAL - accentCount;

  const greyPos = useMemo(() => distributed(greyCount), [greyCount]);
  const accentPos = useMemo(() => distributed(accentCount), [accentCount]);

  useFrame((_, dt) => {
    // heavy damping — feels inertial, max ~15px on screen
    current.current.x += (target.current.x - current.current.x) * 0.03;
    current.current.y += (target.current.y - current.current.y) * 0.03;

    if (wrap.current) {
      // 15px at typical viewport => translate world by ~0.03 units
      wrap.current.position.x = current.current.x * 0.15;
      wrap.current.position.y = current.current.y * 0.15;
    }
    // very slow drift
    if (grey.current) grey.current.rotation.y += dt * 0.008;
    if (accent.current) accent.current.rotation.y += dt * 0.006;
  });

  return (
    <group ref={wrap}>
      <points ref={grey}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[greyPos, 3]}
            count={greyPos.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.018}
          color="#8a8780"
          transparent
          opacity={0.55}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <points ref={accent}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[accentPos, 3]}
            count={accentPos.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#e8ff00"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </group>
  );
}

function distributed(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  const radius = 8;
  for (let i = 0; i < count; i++) {
    // uniform in a slab, biased toward the camera plane
    const r = Math.sqrt(Math.random()) * radius;
    const theta = Math.random() * Math.PI * 2;
    arr[i * 3 + 0] = Math.cos(theta) * r;
    arr[i * 3 + 1] = Math.sin(theta) * r * 0.75;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  return arr;
}