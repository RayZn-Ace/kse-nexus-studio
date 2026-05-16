import { useEffect, useRef } from "react";

type Shape =
  | "phone"
  | "phone-sm"
  | "meta"
  | "youtube"
  | "laptop"
  | "camera"
  | "linkedin"
  | "browser"
  | "film"
  | "star"
  | "mic"
  | "triangle-l"
  | "triangle-r"
  | "diamond";

interface Block {
  label: string;
  shape: Shape;
  finalX: number;
  finalY: number;
  startX: number;
  startY: number;
  activates: [number, number];
  accent?: boolean;
}

const STROKE = "rgba(240,237,232,0.6)";
const FILL = "rgba(240,237,232,0.04)";
const ACCENT_STROKE = "#e8ff00";
const ACCENT_FILL = "rgba(232,255,0,0.08)";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const mapRange = (v: number, a: number, b: number, c = 0, d = 1) =>
  c + easeOut(clamp((v - a) / (b - a), 0, 1)) * (d - c);

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  switch (shape) {
    case "phone": {
      roundRect(ctx, -20, -35, 40, 70, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(11, -27, 1.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "phone-sm": {
      roundRect(ctx, -16, -30, 32, 60, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "meta": {
      roundRect(ctx, -40, -15, 80, 30, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-12, 2, 10, Math.PI, 0, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 2, 10, Math.PI, 0, false);
      ctx.stroke();
      break;
    }
    case "youtube": {
      roundRect(ctx, -40, -15, 80, 30, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6, -7);
      ctx.lineTo(10, 0);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "laptop": {
      roundRect(ctx, -50, -30, 100, 60, 3);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -55, 32, 110, 8, 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "camera": {
      roundRect(ctx, -32, -18, 64, 36, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();
      roundRect(ctx, -22, -25, 14, 7, 1);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "linkedin": {
      roundRect(ctx, -22, -22, 44, 44, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = STROKE;
      ctx.font = '600 16px "Inter", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("in", 0, 1);
      ctx.fillStyle = FILL;
      break;
    }
    case "browser": {
      roundRect(ctx, -40, -25, 80, 50, 3);
      ctx.fill();
      ctx.stroke();
      [-32, -26, -20].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, -18, 1.6, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-30, -2);
      ctx.lineTo(30, -2);
      ctx.moveTo(-30, 6);
      ctx.lineTo(20, 6);
      ctx.moveTo(-30, 14);
      ctx.lineTo(25, 14);
      ctx.stroke();
      break;
    }
    case "film": {
      roundRect(ctx, -35, -22, 70, 44, 2);
      ctx.fill();
      ctx.stroke();
      for (let i = -28; i <= 28; i += 9) {
        roundRect(ctx, i - 2, -22, 4, 5, 1);
        ctx.stroke();
        roundRect(ctx, i - 2, 17, 4, 5, 1);
        ctx.stroke();
      }
      break;
    }
    case "star": {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const b = a + Math.PI / 5;
        const px = Math.cos(a) * 22;
        const py = Math.sin(a) * 22;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        ctx.lineTo(Math.cos(b) * 9, Math.sin(b) * 9);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "mic": {
      roundRect(ctx, -8, -28, 16, 32, 8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 4, 16, 0, Math.PI, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(0, 30);
      ctx.moveTo(-10, 30);
      ctx.lineTo(10, 30);
      ctx.stroke();
      break;
    }
    case "triangle-l": {
      ctx.beginPath();
      ctx.moveTo(-60, 30);
      ctx.lineTo(60, 30);
      ctx.lineTo(40, -40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "triangle-r": {
      ctx.beginPath();
      ctx.moveTo(-60, 30);
      ctx.lineTo(60, 30);
      ctx.lineTo(-40, -40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "diamond": {
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(20, 0);
      ctx.lineTo(0, 22);
      ctx.lineTo(-20, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export default function VillaBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0,
      H = 0;
    let blocks: Block[] = [];

    const buildBlocks = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = W / 2;
      const cy = H / 2;

      blocks = [
        { label: "INSTAGRAM", shape: "phone", finalX: cx - 200, finalY: cy + 180, startX: -300, startY: cy + 400, activates: [0, 0.15] },
        { label: "TIKTOK",    shape: "phone-sm", finalX: cx - 120, finalY: cy + 185, startX: W + 600, startY: cy + 500, activates: [0.02, 0.17] },
        { label: "META",      shape: "meta", finalX: cx - 40, finalY: cy + 190, startX: cx, startY: -200, activates: [0.04, 0.18] },
        { label: "YOUTUBE",   shape: "youtube", finalX: cx + 40, finalY: cy + 190, startX: -400, startY: cy + 300, activates: [0.05, 0.19] },
        { label: "LAPTOP",    shape: "laptop", finalX: cx - 160, finalY: cy + 80, startX: -500, startY: cy, activates: [0.12, 0.28] },
        { label: "KAMERA",    shape: "camera", finalX: cx, finalY: cy + 60, startX: W + 600, startY: cy - 200, activates: [0.15, 0.30] },
        { label: "LINKEDIN",  shape: "linkedin", finalX: cx + 160, finalY: cy + 80, startX: W + 600, startY: cy + 300, activates: [0.17, 0.32] },
        { label: "WEBSITE",   shape: "browser", finalX: cx - 80, finalY: cy + 80, startX: cx, startY: -300, activates: [0.20, 0.35] },
        { label: "CONTENT",   shape: "film", finalX: cx - 140, finalY: cy - 40, startX: -500, startY: cy - 300, activates: [0.30, 0.46] },
        { label: "BRANDING",  shape: "star", finalX: cx, finalY: cy - 60, startX: W + 600, startY: cy - 400, activates: [0.33, 0.49] },
        { label: "PODCAST",   shape: "mic", finalX: cx + 140, finalY: cy - 40, startX: cx + 400, startY: -300, activates: [0.36, 0.52] },
        { label: "STRATEGIE", shape: "triangle-l", finalX: cx - 80, finalY: cy - 160, startX: -400, startY: -200, activates: [0.50, 0.66] },
        { label: "KSE GROUP", shape: "triangle-r", finalX: cx + 80, finalY: cy - 160, startX: W + 600, startY: -200, activates: [0.53, 0.69], accent: true },
        { label: "CHARAKTER", shape: "diamond", finalX: cx, finalY: cy - 260, startX: cx, startY: -400, activates: [0.70, 0.88], accent: true },
      ];
    };

    const readScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressRef.current = clamp(window.scrollY / max, 0, 1);
    };

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      buildBlocks();
      readScroll();
    };

    buildBlocks();
    readScroll();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", readScroll, { passive: true });

    const draw = () => {
      const p = progressRef.current;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      // Glow under villa (fades in late)
      if (p > 0.88) {
        const glow = mapRange(p, 0.88, 1);
        const grad = ctx.createRadialGradient(cx, cy - 40, 0, cx, cy - 40, 320);
        grad.addColorStop(0, `rgba(232,255,0,${0.06 * glow})`);
        grad.addColorStop(0.6, `rgba(232,255,0,${0.02 * glow})`);
        grad.addColorStop(1, "rgba(232,255,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy - 40, 320, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const block of blocks) {
        const [a, b] = block.activates;
        const localP = clamp((p - a) / (b - a), 0, 1);
        if (localP === 0) continue;
        const eased = easeOut(localP);
        const x = block.startX + (block.finalX - block.startX) * eased;
        const y = block.startY + (block.finalY - block.startY) * eased;
        const alpha = eased;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);

        if (eased > 0.9) {
          ctx.shadowColor = "rgba(232,255,0,0.15)";
          ctx.shadowBlur = 8;
        }

        ctx.strokeStyle = block.accent ? ACCENT_STROKE : STROKE;
        ctx.fillStyle = block.accent ? ACCENT_FILL : FILL;
        drawShape(ctx, block.shape);

        ctx.shadowBlur = 0;
        ctx.fillStyle = block.accent
          ? "rgba(232,255,0,0.7)"
          : "rgba(240,237,232,0.4)";
        ctx.font = '500 9px "Inter", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(block.label, 0, 48);

        ctx.restore();
      }

      // Final text reveal
      if (p > 0.92) {
        const ta = mapRange(p, 0.92, 1);
        ctx.save();
        ctx.globalAlpha = ta;
        ctx.fillStyle = "#e8ff00";
        ctx.textAlign = "center";
        ctx.font = '600 16px "Inter", sans-serif';
        const text = "WIR BAUEN KEINE MARKEN.  WIR BAUEN CHARAKTER.";
        // Manual letter-spacing
        drawSpaced(ctx, text, cx, cy + 140, 3.2);
        ctx.restore();
      }
      if (p > 0.95) {
        const sa = mapRange(p, 0.95, 1);
        ctx.save();
        ctx.globalAlpha = sa;
        ctx.fillStyle = "rgba(240,237,232,0.6)";
        ctx.textAlign = "center";
        ctx.font = '500 11px "Inter", sans-serif';
        drawSpaced(ctx, "KSEGROUP.EU", cx, cy + 168, 4);
        ctx.restore();
      }

      // Scroll hint (fades after p > 0.1)
      if (p < 0.12) {
        const ha = 1 - mapRange(p, 0, 0.1);
        ctx.save();
        ctx.globalAlpha = ha;
        ctx.fillStyle = "#e8ff00";
        ctx.font = '500 10px "Inter", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText("●  SCROLL TO BUILD", W - 24, H - 28);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", readScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
) {
  const chars = text.split("");
  const widths = chars.map((c) => ctx.measureText(c).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let x = cx - total / 2;
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y);
    x += widths[i];
  }
}
