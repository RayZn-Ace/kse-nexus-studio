import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, Float } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

/**
 * Active-Theory-inspired persistent 3D stage.
 * Real Three.js: refractive metallic orb, instanced drifting particles,
 * bloom + chromatic aberration + vignette postprocessing.
 * SSR-safe — Canvas only mounts after client hydration.
 */
export default function CinemaStage({ progress }: { progress: MotionValue<number> }) {
  const [mounted, setMounted] = useState(false);
  const progressRef = useRef(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => progress.on("change", (v) => (progressRef.current = v)), [progress]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, background: "#020207" }}
    >
      {/* radial vignette below the canvas for depth even before mount */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(20,28,60,0.55) 0%, rgba(4,4,12,0.92) 45%, #000 100%)",
        }}
      />
      {mounted && (
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 6], fov: 38 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <color attach="background" args={["#000004"]} />
          <fog attach="fog" args={["#000004", 8, 22]} />

          <ambientLight intensity={0.25} />
          <pointLight position={[8, 6, 4]} intensity={2.2} color="#b9c8ff" />
          <pointLight position={[-6, -4, 3]} intensity={1.6} color="#e8ff00" />
          <pointLight position={[0, 0, -8]} intensity={1.4} color="#6e7bd1" />

          <Environment preset="night" />

          <Scene progressRef={progressRef} />

          <EffectComposer multisampling={0}>
            <Bloom intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.85} mipmapBlur />
            <ChromaticAberration
              offset={new THREE.Vector2(0.0014, 0.0014)}
              radialModulation={false}
              modulationOffset={0}
              blendFunction={BlendFunction.NORMAL}
            />
            <Vignette eskil={false} offset={0.2} darkness={0.85} />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  );
}

function Scene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);
  const pointer = useRef(new THREE.Vector2());
  const { size } = useThree();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / size.width) * 2 - 1;
      pointer.current.y = -((e.clientY / size.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [size]);

  useFrame((state, dt) => {
    const p = progressRef.current;
    // Orb travels across the page as user scrolls
    if (group.current) {
      const tx = Math.sin(p * Math.PI * 1.4) * 2.5;
      const ty = -p * 1.5 + Math.cos(p * Math.PI) * 0.3;
      const tz = -p * 2.2;
      group.current.position.x += (tx - group.current.position.x) * 0.04;
      group.current.position.y += (ty - group.current.position.y) * 0.04;
      group.current.position.z += (tz - group.current.position.z) * 0.04;
      // pointer parallax
      group.current.rotation.x += (pointer.current.y * 0.25 - group.current.rotation.x) * 0.04;
      group.current.rotation.y += (pointer.current.x * 0.4 - group.current.rotation.y) * 0.04;

      const targetScale = 1 - p * 0.45;
      group.current.scale.setScalar(
        group.current.scale.x + (targetScale - group.current.scale.x) * 0.05,
      );
    }
    if (orb.current) orb.current.rotation.y += dt * 0.25;
    if (ringA.current) ringA.current.rotation.z += dt * 0.08;
    if (ringB.current) {
      ringB.current.rotation.x += dt * 0.12;
      ringB.current.rotation.y -= dt * 0.06;
    }
    if (ringC.current) ringC.current.rotation.y += dt * 0.18;
  });

  return (
    <>
      <group ref={group}>
        {/* Refractive orb */}
        <mesh ref={orb}>
          <icosahedronGeometry args={[1.1, 24]} />
          <MeshTransmissionMaterial
            transmission={1}
            thickness={1.6}
            roughness={0.05}
            ior={1.55}
            chromaticAberration={0.18}
            anisotropy={0.4}
            distortion={0.35}
            distortionScale={0.4}
            temporalDistortion={0.15}
            attenuationDistance={1.5}
            attenuationColor="#b9c8ff"
            color="#e8ecff"
            backside
          />
        </mesh>

        {/* Inner glowing core */}
        <mesh scale={0.55}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#e8ff00"
            emissive="#e8ff00"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>

        {/* Rings */}
        <mesh ref={ringA} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.7, 0.008, 16, 200]} />
          <meshStandardMaterial
            color="#b9c8ff"
            emissive="#6e7bd1"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={ringB} rotation={[0, 0, Math.PI / 3]}>
          <torusGeometry args={[2.1, 0.006, 16, 200]} />
          <meshStandardMaterial
            color="#e8ff00"
            emissive="#e8ff00"
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={ringC} rotation={[Math.PI / 1.5, Math.PI / 6, 0]}>
          <torusGeometry args={[2.5, 0.004, 16, 200]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#b9c8ff"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
      </group>

      <Particles count={1400} />
      <Particles count={300} warm size={0.04} radius={9} />

      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.2}>
        <Jelly position={[-3.5, -1.5, -2]} />
      </Float>
      <Float speed={0.9} rotationIntensity={0.3} floatIntensity={1.4}>
        <Jelly position={[3.8, 1.2, -3]} scale={0.7} />
      </Float>
    </>
  );
}

/* ───────── Particle field ───────── */
function Particles({
  count = 1200,
  warm = false,
  size = 0.025,
  radius = 12,
}: { count?: number; warm?: boolean; size?: number; radius?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sp = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = Math.cbrt(Math.random()) * radius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 2;
      sp[i] = 0.02 + Math.random() * 0.08;
    }
    return { positions: pos, speeds: sp };
  }, [count, radius]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      if (arr[i * 3 + 1] > radius) arr[i * 3 + 1] = -radius;
    }
    attr.needsUpdate = true;
    ref.current.rotation.y += dt * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={warm ? "#e8ff00" : "#9fb8ff"}
        transparent
        opacity={warm ? 0.95 : 0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/* ───────── Jellyfish ───────── */
function Jelly({
  position = [0, 0, 0] as [number, number, number],
  scale = 1,
}: { position?: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.3;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.4}
          roughness={0.15}
          ior={1.4}
          chromaticAberration={0.08}
          color="#a8c0ff"
          attenuationColor="#6e7bd1"
          attenuationDistance={0.6}
          backside
        />
      </mesh>
      {/* tendrils */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.35, -0.5, Math.sin(a) * 0.35]}
          >
            <cylinderGeometry args={[0.005, 0.002, 0.8, 6]} />
            <meshStandardMaterial
              color="#b9c8ff"
              emissive="#6e7bd1"
              emissiveIntensity={0.4}
              transparent
              opacity={0.5}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}