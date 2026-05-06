import { motion } from "framer-motion";

/**
 * Two ink clouds (electric blue + vivid orange) drift toward each other
 * and collide in the center using an SVG gooey filter for that liquid feel.
 */
export function InkCollision() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-background">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 28 -12" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <radialGradient id="blueInk" cx="50%" cy="50%">
            <stop offset="0%" stopColor="oklch(0.78 0.22 255)" stopOpacity="1" />
            <stop offset="60%" stopColor="oklch(0.55 0.28 260)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="oklch(0.30 0.22 265)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orangeInk" cx="50%" cy="50%">
            <stop offset="0%" stopColor="oklch(0.85 0.18 60)" stopOpacity="1" />
            <stop offset="60%" stopColor="oklch(0.70 0.22 45)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="oklch(0.45 0.20 35)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g filter="url(#goo)" style={{ mixBlendMode: "screen" }}>
          {/* BLUE side */}
          <motion.circle
            cx="1300" cy="450" r="220" fill="url(#blueInk)"
            animate={{ cx: [1400, 900, 950, 1400], cy: [400, 450, 500, 400], r: [220, 280, 250, 220] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="1500" cy="300" r="140" fill="url(#blueInk)"
            animate={{ cx: [1500, 1050, 1200, 1500], cy: [250, 380, 600, 250], r: [140, 180, 160, 140] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.circle
            cx="1200" cy="650" r="160" fill="url(#blueInk)"
            animate={{ cx: [1200, 850, 1100, 1200], cy: [650, 500, 720, 650], r: [160, 200, 180, 160] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          {/* ORANGE side */}
          <motion.circle
            cx="300" cy="450" r="220" fill="url(#orangeInk)"
            animate={{ cx: [200, 700, 650, 200], cy: [450, 500, 400, 450], r: [220, 280, 250, 220] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="100" cy="600" r="140" fill="url(#orangeInk)"
            animate={{ cx: [100, 550, 400, 100], cy: [600, 480, 300, 600], r: [140, 180, 160, 140] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          />
          <motion.circle
            cx="400" cy="200" r="160" fill="url(#orangeInk)"
            animate={{ cx: [400, 750, 500, 400], cy: [200, 380, 180, 200], r: [160, 200, 180, 160] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
        </g>
      </svg>

      {/* vignette + grain overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.06_0.01_260)_85%)] pointer-events-none" />
    </div>
  );
}