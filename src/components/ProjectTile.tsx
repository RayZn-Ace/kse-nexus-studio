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

const SECONDARY_ACCENT: Record<ProjectTileData["accent"], ProjectTileData["accent"]> = {
  blue: "violet",
  violet: "red",
  red: "blue",
};

const NOISE_URI =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/></svg>\")";

/**
 * Living background for a tile: two large soft blurred blobs slowly drifting
 * in opposite directions, plus a fine noise overlay to kill the flat-gradient
 * look. Screen-blended over the tile's near-black base.
 */
function TileVisual({ accent }: { accent: ProjectTileData["accent"] }) {
  const reduced = useReducedMotion();
  const c1 = ACCENT_HEX[accent];
  const c2 = ACCENT_HEX[SECONDARY_ACCENT[accent]];
  const blobBase = {
    width: "90%",
    height: "90%",
    borderRadius: "50%",
    position: "absolute" as const,
  };
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none opacity-35 group-hover:opacity-70 transition-opacity duration-500"
      style={{ mixBlendMode: "screen" }}
    >
      <motion.div
        style={{
          ...blobBase,
          top: "-10%",
          left: "-20%",
          background: `radial-gradient(circle, ${c1} 0%, transparent 65%)`,
          opacity: 0.6,
        }}
        animate={
          reduced
            ? undefined
            : {
                x: ["-20%", "30%", "-20%"],
                y: ["-10%", "25%", "-10%"],
              }
        }
        transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        style={{
          ...blobBase,
          bottom: "-15%",
          right: "-15%",
          background: `radial-gradient(circle, ${c2} 0%, transparent 65%)`,
          opacity: 0.45,
        }}
        animate={
          reduced
            ? undefined
            : {
                x: ["25%", "-15%", "25%"],
                y: ["20%", "-20%", "20%"],
              }
        }
        transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: NOISE_URI, mixBlendMode: "overlay" }}
      />
    </div>
  );
}

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
        <TileVisual accent={data.accent} />
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
            <div
              className="mt-5 text-[11px] uppercase tracking-[0.3em] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
              style={{ color: accent }}
            >
              Mehr erfahren →
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}