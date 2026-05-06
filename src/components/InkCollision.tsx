import { motion } from "framer-motion";

/**
 * Animated fog / Nebel: blue and orange smoke clouds drift toward each
 * other and merge in the middle. SVG turbulence + displacement gives the
 * organic, fluid ink-in-water look from the KSE Group reference.
 */
export function InkCollision() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-background">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Turbulence-driven distortion = smoke/ink feel */}
          <filter id="fog" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="7">
              <animate attributeName="baseFrequency" dur="22s" values="0.012 0.02;0.018 0.012;0.012 0.02" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="160" />
            <feGaussianBlur stdDeviation="22" />
          </filter>

          <radialGradient id="blueFog" cx="50%" cy="50%">
            <stop offset="0%"  stopColor="oklch(0.85 0.18 255)" stopOpacity="1" />
            <stop offset="45%" stopColor="oklch(0.55 0.28 260)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.20 0.18 265)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orangeFog" cx="50%" cy="50%">
            <stop offset="0%"  stopColor="oklch(0.90 0.16 65)" stopOpacity="1" />
            <stop offset="45%" stopColor="oklch(0.70 0.22 45)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.40 0.18 35)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g filter="url(#fog)" style={{ mixBlendMode: "screen" }}>
          {/* BLUE nebel rolling in from the right */}
          <motion.ellipse
            cx="1300" cy="450" rx="380" ry="320" fill="url(#blueFog)"
            animate={{ cx: [1450, 950, 900, 1450], cy: [380, 460, 520, 380], rx: [380, 460, 420, 380] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="1500" cy="250" rx="260" ry="220" fill="url(#blueFog)"
            animate={{ cx: [1550, 1100, 1250, 1550], cy: [220, 360, 600, 220], rx: [260, 320, 280, 260] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          <motion.ellipse
            cx="1200" cy="700" rx="280" ry="240" fill="url(#blueFog)"
            animate={{ cx: [1250, 850, 1080, 1250], cy: [700, 520, 740, 700], rx: [280, 340, 300, 280] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />

          {/* ORANGE nebel drifting from the left */}
          <motion.ellipse
            cx="300" cy="450" rx="380" ry="320" fill="url(#orangeFog)"
            animate={{ cx: [150, 700, 740, 150], cy: [470, 500, 380, 470], rx: [380, 460, 420, 380] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="100" cy="650" rx="260" ry="220" fill="url(#orangeFog)"
            animate={{ cx: [60, 540, 380, 60], cy: [650, 460, 280, 650], rx: [260, 320, 280, 260] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
          />
          <motion.ellipse
            cx="400" cy="180" rx="280" ry="240" fill="url(#orangeFog)"
            animate={{ cx: [380, 760, 480, 380], cy: [180, 380, 160, 180], rx: [280, 340, 300, 280] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </g>
      </svg>

      {/* atmospheric overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,oklch(0.06_0.01_260)_90%)] pointer-events-none" />
    </div>
  );
}
