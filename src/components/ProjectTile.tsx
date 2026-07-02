import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

export interface ProjectTileData {
  index: string;
  title: string;
  description: string;
  tags: string[];
  accent: "blue" | "violet" | "red";
}

const ACCENT_HEX: Record<ProjectTileData["accent"], string> = {
  blue: "#4f7dff",
  violet: "#a855f7",
  red: "#ff4d5e",
};

/**
 * A single case/project tile. Entrance: blur-to-sharp + fade + slight
 * rotation as it scrolls into view (offset by `offset` for asymmetric
 * placement). Hover: 3D tilt following the cursor + glowing accent border +
 * a slowly drifting gradient underneath.
 */
export function ProjectTile({
  data,
  offset = 0,
  span = "col-span-6",
}: {
  data: ProjectTileData;
  offset?: number;
  span?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const accent = ACCENT_HEX[data.accent];
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });
  const drift = reduced ? 0 : 22 + offset / 4;
  const parY = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22, mass: 0.4 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22, mass: 0.4 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const rotateX = useTransform(srx, (v) => `${v}deg`);
  const rotateY = useTransform(sry, (v) => `${v}deg`);
  const glowBg = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      `radial-gradient(420px circle at ${gx}% ${gy}%, ${accent}33, transparent 70%)`,
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * 14);
    rx.set((0.5 - py) * 14);
    glowX.set(px * 100);
    glowY.set(py * 100);
  }

  function onMouseLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={wrapRef}
      className={`${span} relative`}
      style={{ marginTop: offset, y: parY }}
      initial={{ opacity: 0, scale: 0.94, rotate: -2, filter: "blur(14px)" }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        className="group relative aspect-[4/3] rounded-sm overflow-hidden border border-white/10 bg-[#0b0b0d] transition-colors duration-300"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: glowBg }}
        />
        <div
          aria-hidden
          className="absolute inset-0 rounded-sm pointer-events-none transition-[box-shadow] duration-500 group-hover:shadow-[inset_0_0_0_1px_var(--tile-accent),0_0_40px_-10px_var(--tile-accent)]"
          style={{ ["--tile-accent" as string]: accent }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.14] mix-blend-screen"
          style={{ background: `linear-gradient(135deg, ${accent}, transparent 60%)` }}
        />

        <div className="relative h-full flex flex-col justify-between p-7 md:p-9">
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/40">
            / {data.index}
          </span>
          <div>
            <h3
              className="font-black text-2xl md:text-3xl leading-[0.95] mb-3"
              style={{ letterSpacing: "-0.03em" }}
            >
              {data.title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-4">
              {data.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-[0.2em] text-white/40 border border-white/10 rounded-full px-2.5 py-1"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}