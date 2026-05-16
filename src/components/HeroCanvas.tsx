import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Three.js wireframe icosahedron field used as the hero background.
 * - 180 small wireframe icosahedra scattered in a -12..12 cube
 * - Slow group rotation + per-mesh self-rotation
 * - Mouse parallax (lerped) on the camera
 * - Transparent renderer so the section's bg shows through
 */
export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(0.06, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xe8ff00, wireframe: true });

    const meshes: THREE.Mesh[] = [];
    for (let i = 0; i < 180; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 24,
      );
      group.add(m);
      meshes.push(m);
    }
    scene.add(group);

    const mouse = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const tick = () => {
      group.rotation.y += 0.0003;
      for (const m of meshes) {
        m.rotation.x += 0.004;
        m.rotation.z += 0.004;
      }
      camera.position.x += (mouse.x - camera.position.x) * 0.02;
      camera.position.y += (mouse.y - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}