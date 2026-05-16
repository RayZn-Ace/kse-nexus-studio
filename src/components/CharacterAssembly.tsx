import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-driven background for the pinned CHARAKTER section.
 * Phase 1 (0→60%): 12 media icon tiles fly in from off-screen into a 4×3 grid.
 * Phase 2 (60→80%): tiles shrink and drift outward, fading.
 * Phase 3 (80→100%): three human figures fade/scale in, label appears below.
 *
 * Everything is driven by the `progress` MotionValue passed in from the
 * parent's useScroll — no timers, no CSS transitions.
 */

const VB_W = 1568;
const VB_H = 768;
const CX = VB_W / 2; // 784
const CY = VB_H / 2; // 384

const TILE = 64;
const GAP = 16;
const COLS = 4;
const ROWS = 3;
const GRID_W = COLS * TILE + (COLS - 1) * GAP; // 304
const GRID_H = ROWS * TILE + (ROWS - 1) * GAP; // 224
const GRID_X0 = CX - GRID_W / 2 + TILE / 2; // first-col center x
const GRID_Y0 = CY - GRID_H / 2 + TILE / 2; // first-row center y

type IconKey =
  | "phone"
  | "meta"
  | "tiktok"
  | "instagram"
  | "camera"
  | "youtube"
  | "linkedin"
  | "clap"
  | "mic"
  | "bulb"
  | "chart"
  | "star";

/** Drawn inside a 32×32 viewbox centered at origin (use -16..16). */
function Icon({ name }: { name: IconKey }) {
  const stroke = "#f0ede8";
  const sw = 1.5;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "phone":
      return (
        <g {...common}>
          <rect x={-7} y={-12} width={14} height={24} rx={2} />
          <line x1={-2} y1={8} x2={2} y2={8} />
        </g>
      );
    case "meta":
      return (
        <g {...common}>
          <path d="M -12 4 C -10 -6, -4 -8, 0 0 C 4 8, 10 6, 12 -4" />
        </g>
      );
    case "tiktok":
      return (
        <g {...common}>
          <path d="M 2 -12 L 2 6 a 5 5 0 1 1 -5 -5" />
          <path d="M 2 -12 c 1 4, 4 6, 8 6" />
        </g>
      );
    case "instagram":
      return (
        <g {...common}>
          <rect x={-11} y={-11} width={22} height={22} rx={5} />
          <circle cx={0} cy={0} r={5} />
          <circle cx={6} cy={-6} r={1.2} fill={stroke} />
        </g>
      );
    case "camera":
      return (
        <g {...common}>
          <rect x={-12} y={-8} width={24} height={16} rx={2} />
          <circle cx={0} cy={0} r={5} />
          <line x1={-4} y1={-8} x2={-2} y2={-11} />
          <line x1={4} y1={-8} x2={2} y2={-11} />
        </g>
      );
    case "youtube":
      return (
        <g {...common}>
          <rect x={-12} y={-8} width={24} height={16} rx={3} />
          <path d="M -3 -4 L 5 0 L -3 4 Z" />
        </g>
      );
    case "linkedin":
      return (
        <g {...common}>
          <rect x={-11} y={-11} width={22} height={22} rx={3} />
          <line x1={-6} y1={-3} x2={-6} y2={6} />
          <circle cx={-6} cy={-7} r={1.2} fill={stroke} />
          <path d="M 0 6 L 0 -3 M 0 0 c 0 -3 6 -3 6 0 L 6 6" />
        </g>
      );
    case "clap":
      return (
        <g {...common}>
          <rect x={-12} y={-3} width={24} height={14} rx={1} />
          <path d="M -12 -3 L -8 -10 L -4 -5 L 0 -10 L 4 -5 L 8 -10 L 12 -3" />
        </g>
      );
    case "mic":
      return (
        <g {...common}>
          <rect x={-4} y={-12} width={8} height={14} rx={4} />
          <path d="M -8 -2 a 8 8 0 0 0 16 0" />
          <line x1={0} y1={6} x2={0} y2={12} />
          <line x1={-4} y1={12} x2={4} y2={12} />
        </g>
      );
    case "bulb":
      return (
        <g {...common}>
          <path d="M -6 2 a 6 7 0 1 1 12 0 c 0 4 -3 4 -3 7 L -3 9 c 0 -3 -3 -3 -3 -7 Z" />
          <line x1={-3} y1={12} x2={3} y2={12} />
        </g>
      );
    case "chart":
      return (
        <g {...common}>
          <line x1={-11} y1={11} x2={11} y2={11} />
          <line x1={-11} y1={11} x2={-11} y2={-9} />
          <path d="M -8 6 L -3 0 L 2 4 L 9 -7" />
          <path d="M 5 -7 L 9 -7 L 9 -3" />
        </g>
      );
    case "star":
      return (
        <g {...common}>
          <path d="M 0 -11 L 3 -3 L 11 -3 L 4 2 L 7 10 L 0 5 L -7 10 L -4 2 L -11 -3 L -3 -3 Z" />
        </g>
      );
  }
}

const ICONS: { key: IconKey; startX: number; startY: number }[] = [
  { key: "phone",     startX: -400, startY: -200 },
  { key: "meta",      startX:  500, startY: -300 },
  { key: "tiktok",    startX: -300, startY:  300 },
  { key: "instagram", startX:  600, startY:  200 },
  { key: "camera",    startX: -500, startY:  100 },
  { key: "youtube",   startX:  400, startY: -100 },
  { key: "linkedin",  startX: -200, startY: -400 },
  { key: "clap",      startX:  300, startY:  400 },
  { key: "mic",       startX: -600, startY:   50 },
  { key: "bulb",      startX:  200, startY: -350 },
  { key: "chart",     startX:  500, startY:  300 },
  { key: "star",      startX: -100, startY:  400 },
];

function Tile({
  progress,
  index,
  iconKey,
  startX,
  startY,
}: {
  progress: MotionValue<number>;
  index: number;
  iconKey: IconKey;
  startX: number;
  startY: number;
}) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const finalX = GRID_X0 + col * (TILE + GAP);
  const finalY = GRID_Y0 + row * (TILE + GAP);

  // Outward drift vector during phase 2
  const dx = finalX - CX;
  const dy = finalY - CY;
  const driftX = finalX + dx * 0.6;
  const driftY = finalY + dy * 0.6;

  const x = useTransform(progress, [0, 0.6, 0.8], [CX + startX, finalX, driftX]);
  const y = useTransform(progress, [0, 0.6, 0.8], [CY + startY, finalY, driftY]);
  const opacity = useTransform(
    progress,
    [0, 0.15, 0.6, 0.75, 0.85],
    [0, 1, 1, 0.6, 0],
  );
  const scale = useTransform(progress, [0, 0.6, 0.8], [0.3, 1, 0.4]);

  return (
    <motion.g style={{ x, y, scale, opacity }}>
      <rect
        x={-TILE / 2}
        y={-TILE / 2}
        width={TILE}
        height={TILE}
        rx={12}
        fill="rgba(240,237,232,0.04)"
        stroke="rgba(240,237,232,0.15)"
        strokeWidth={1}
      />
      <Icon name={iconKey} />
    </motion.g>
  );
}

function Figure({
  progress,
  cx,
  cy,
  scale = 1,
  range,
}: {
  progress: MotionValue<number>;
  cx: number;
  cy: number;
  scale?: number;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  const s = useTransform(progress, range, [0.7 * scale, scale]);
  const stroke = "#f0ede8";
  return (
    <motion.g style={{ x: cx, y: cy, scale: s, opacity }}>
      {/* Halo */}
      <circle cx={0} cy={-58} r={4} fill="#e8ff00" className="kse-pulse" style={{ opacity: 0.8 }} />
      {/* Head */}
      <circle cx={0} cy={-34} r={18} fill="none" stroke={stroke} strokeWidth={1.5} />
      {/* Body */}
      <path d="M 0 -16 L 0 24" fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      {/* Arms */}
      <line x1={0} y1={-6} x2={-22} y2={10} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={0} y1={-6} x2={22} y2={10} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      {/* Legs */}
      <line x1={0} y1={24} x2={-14} y2={56} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={0} y1={24} x2={14} y2={56} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </motion.g>
  );
}

export function CharacterAssembly({ progress }: { progress: MotionValue<number> }) {
  const labelOpacity = useTransform(progress, [0.92, 1], [0, 1]);

  const fig1Range: [number, number] = [0.78, 0.92];
  const fig2Range: [number, number] = [0.82, 0.95];
  const fig3Range: [number, number] = [0.8, 0.93];

  const tiles: ReactNode = ICONS.map((cfg, i) => (
    <Tile
      key={cfg.key}
      progress={progress}
      index={i}
      iconKey={cfg.key}
      startX={cfg.startX}
      startY={cfg.startY}
    />
  ));

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes ksePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.4); } }
        .kse-pulse { transform-box: fill-box; transform-origin: center; animation: ksePulse 2s ease-in-out infinite; }
      `}</style>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        {/* Phase 1+2 — media tiles */}
        {tiles}

        {/* Phase 3 — figures */}
        <Figure progress={progress} cx={CX - 184} cy={CY} range={fig1Range} />
        <Figure progress={progress} cx={CX} cy={CY - 14} scale={1.15} range={fig2Range} />
        <Figure progress={progress} cx={CX + 184} cy={CY} range={fig3Range} />

        {/* Small CHARAKTER label below figures */}
        <motion.text
          x={CX}
          y={CY + 110}
          textAnchor="middle"
          style={{ opacity: labelOpacity }}
          fill="#e8ff00"
          fontSize={16}
          fontWeight={600}
          letterSpacing="4.8"
        >
          CHARAKTER.
        </motion.text>
      </svg>
    </div>
  );
}