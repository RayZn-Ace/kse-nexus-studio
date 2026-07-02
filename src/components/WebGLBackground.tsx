import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

/**
 * Permanent generative WebGL backdrop: a drifting particle field with
 * connective lines, tinted in sparse blue/violet/red neon accents against
 * near-black. Reacts to cursor position (damped) and global scroll progress
 * (subtle depth parallax + slow rotation). No external assets.
 */
export function WebGLBackground({ progress }: { progress: MotionValue<number> }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const check = () =>
      window.matchMedia("(hover: none)").matches || window.innerWidth < 768;
    setIsMobile(check());
    const onResize = () => setIsMobile(check());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, background: "#050506" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(22,22,28,0.5) 0%, rgba(6,6,8,0.95) 55%, #000 100%)",
        }}
      />
      {mounted && (
        <Canvas
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Field progress={progress} count={isMobile ? 200 : 340} />
          {!isMobile && (
            <EffectComposer>
              <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.2} />
            </EffectComposer>
          )}
        </Canvas>
      )}
    </div>
  );
}

const NEON = {
  blue: new THREE.Color("#4f7dff"),
  violet: new THREE.Color("#a855f7"),
  red: new THREE.Color("#ff4d5e"),
  grey: new THREE.Color("#55555c"),
};

function Field({ progress, count }: { progress: MotionValue<number>; count: number }) {
  const points = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const wrap = useRef<THREE.Group>(null);
  const { size } = useThree();

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

  const COUNT = count;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const radius = 7.5;
      const r = Math.sqrt(Math.random()) * radius;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3 + 0] = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(theta) * r * 0.72;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;

      const roll = Math.random();
      const c =
        roll < 0.06 ? NEON.blue : roll < 0.1 ? NEON.violet : roll < 0.13 ? NEON.red : NEON.grey;
      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [COUNT]);

  const linePositions = useMemo(() => {
    const maxDist = 1.6;
    const segs: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < maxDist && Math.random() < 0.5) {
          segs.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
          segs.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
        }
      }
    }
    return new Float32Array(segs);
  }, [positions, COUNT]);

  useFrame((_, dt) => {
    current.current.x += (target.current.x - current.current.x) * 0.03;
    current.current.y += (target.current.y - current.current.y) * 0.03;

    const p = progress.get();
    if (wrap.current) {
      wrap.current.position.x = current.current.x * 0.22;
      wrap.current.position.y = current.current.y * 0.22 + p * -0.4;
      wrap.current.rotation.z = p * 0.05;
    }
    if (points.current) points.current.rotation.y += dt * 0.006;
    if (lines.current) lines.current.rotation.y += dt * 0.006;
  });

  return (
    <group ref={wrap}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            count={colors.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
      <lineSegments ref={lines}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={linePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#3a3a44"
          transparent
          opacity={0.22}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}