import { useEffect, useRef } from 'react';

interface Icon {
  label: string;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
}

export default function CharacterAssembly({ scrollProgress }: { scrollProgress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const progressRef = useRef(scrollProgress);

  progressRef.current = scrollProgress;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const icons: Icon[] = [
      { label: 'phone', draw: (c,x,y,s) => { c.strokeRect(x-s*0.3,y-s*0.5,s*0.6,s); c.beginPath(); c.arc(x,y+s*0.35,s*0.06,0,Math.PI*2); c.stroke(); } },
      { label: 'meta', draw: (c,x,y,s) => { c.beginPath(); c.ellipse(x-s*0.2,y,s*0.25,s*0.15,0,0,Math.PI*2); c.stroke(); c.beginPath(); c.ellipse(x+s*0.2,y,s*0.25,s*0.15,0,0,Math.PI*2); c.stroke(); } },
      { label: 'tiktok', draw: (c,x,y,s) => { c.beginPath(); c.arc(x+s*0.1,y+s*0.25,s*0.25,0,Math.PI*2); c.stroke(); c.beginPath(); c.moveTo(x+s*0.1,y-s*0.5); c.lineTo(x+s*0.1,y+s*0.1); c.bezierCurveTo(x+s*0.1,y+s*0.1,x+s*0.4,y-s*0.1,x+s*0.4,y-s*0.35); c.stroke(); } },
      { label: 'instagram', draw: (c,x,y,s) => { c.strokeRect(x-s*0.4,y-s*0.4,s*0.8,s*0.8); c.beginPath(); c.arc(x,y,s*0.25,0,Math.PI*2); c.stroke(); c.beginPath(); c.arc(x+s*0.25,y-s*0.25,s*0.06,0,Math.PI*2); c.fill(); } },
      { label: 'camera', draw: (c,x,y,s) => { c.strokeRect(x-s*0.45,y-s*0.3,s*0.9,s*0.6); c.beginPath(); c.arc(x,y,s*0.2,0,Math.PI*2); c.stroke(); c.beginPath(); c.moveTo(x-s*0.2,y-s*0.3); c.lineTo(x-s*0.1,y-s*0.45); c.lineTo(x+s*0.1,y-s*0.45); c.lineTo(x+s*0.2,y-s*0.3); c.stroke(); } },
      { label: 'youtube', draw: (c,x,y,s) => { c.strokeRect(x-s*0.45,y-s*0.3,s*0.9,s*0.6); c.beginPath(); c.moveTo(x-s*0.15,y-s*0.2); c.lineTo(x+s*0.25,y); c.lineTo(x-s*0.15,y+s*0.2); c.closePath(); c.stroke(); } },
      { label: 'linkedin', draw: (c,x,y,s) => { c.strokeRect(x-s*0.4,y-s*0.4,s*0.8,s*0.8); c.beginPath(); c.arc(x-s*0.15,y-s*0.2,s*0.08,0,Math.PI*2); c.fill(); c.beginPath(); c.moveTo(x-s*0.15,y-s*0.05); c.lineTo(x-s*0.15,y+s*0.3); c.moveTo(x+s*0.05,y-s*0.05); c.lineTo(x+s*0.05,y+s*0.3); c.bezierCurveTo(x+s*0.05,y+s*0.05,x+s*0.35,y+s*0.05,x+s*0.35,y+s*0.3); c.stroke(); } },
      { label: 'clapper', draw: (c,x,y,s) => { c.strokeRect(x-s*0.45,y-s*0.1,s*0.9,s*0.55); c.beginPath(); c.moveTo(x-s*0.45,y-s*0.1); c.lineTo(x-s*0.45,y-s*0.35); c.lineTo(x+s*0.45,y-s*0.35); c.lineTo(x+s*0.45,y-s*0.1); c.stroke(); c.beginPath(); [-0.3,-0.1,0.1,0.3].forEach(o => { c.moveTo(x+o*s,y-s*0.35); c.lineTo(x+(o+0.15)*s,y-s*0.1); }); c.stroke(); } },
      { label: 'mic', draw: (c,x,y,s) => { c.strokeRect(x-s*0.15,y-s*0.5,s*0.3,s*0.55); c.beginPath(); c.arc(x,y-s*0.22,s*0.15,0,Math.PI*2); c.stroke(); c.beginPath(); c.arc(x,y+s*0.05,s*0.3,Math.PI,0,false); c.stroke(); c.beginPath(); c.moveTo(x,y+s*0.35); c.lineTo(x,y+s*0.5); c.moveTo(x-s*0.2,y+s*0.5); c.lineTo(x+s*0.2,y+s*0.5); c.stroke(); } },
      { label: 'bulb', draw: (c,x,y,s) => { c.beginPath(); c.arc(x,y-s*0.1,s*0.35,0,Math.PI*2); c.stroke(); c.beginPath(); c.moveTo(x-s*0.15,y+s*0.25); c.lineTo(x+s*0.15,y+s*0.25); c.moveTo(x-s*0.12,y+s*0.38); c.lineTo(x+s*0.12,y+s*0.38); c.moveTo(x,y+s*0.38); c.lineTo(x,y+s*0.52); c.stroke(); } },
      { label: 'chart', draw: (c,x,y,s) => { c.beginPath(); c.moveTo(x-s*0.4,y+s*0.4); c.lineTo(x-s*0.4,y-s*0.4); c.moveTo(x-s*0.4,y+s*0.4); c.lineTo(x+s*0.4,y+s*0.4); c.stroke(); c.beginPath(); c.moveTo(x-s*0.3,y+s*0.1); c.lineTo(x-s*0.05,y-s*0.15); c.lineTo(x+s*0.15,y+s*0.05); c.lineTo(x+s*0.35,y-s*0.3); c.stroke(); } },
      { label: 'star', draw: (c,x,y,s) => { c.beginPath(); for(let i=0;i<5;i++){ const a=i*Math.PI*2/5-Math.PI/2; const b=a+Math.PI/5; i===0?c.moveTo(x+Math.cos(a)*s*0.45,y+Math.sin(a)*s*0.45):c.lineTo(x+Math.cos(a)*s*0.45,y+Math.sin(a)*s*0.45); c.lineTo(x+Math.cos(b)*s*0.2,y+Math.sin(b)*s*0.2); } c.closePath(); c.stroke(); } },
    ];

    const cols = 4, rows = 3, tileSize = 72, gap = 18;
    const gridW = cols * tileSize + (cols-1) * gap;
    const gridH = rows * tileSize + (rows-1) * gap;
    const getTarget = (i: number) => ({
      x: (canvas.width - gridW) / 2 + (i % cols) * (tileSize + gap) + tileSize / 2,
      y: (canvas.height - gridH) / 2 + Math.floor(i / cols) * (tileSize + gap) + tileSize / 2,
    });

    const starts = [
      {x:-200,y:-200},{x:900,y:-300},{x:-300,y:500},{x:1000,y:200},
      {x:-400,y:100},{x:800,y:-100},{x:-100,y:-350},{x:700,y:500},
      {x:-500,y:50},{x:300,y:-400},{x:900,y:400},{x:-150,y:400},
    ];

    const drawHuman = (c: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number) => {
      c.save();
      c.globalAlpha = alpha;
      c.strokeStyle = '#f0ede8';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y - s*0.45, s*0.12, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(x, y-s*0.33); c.lineTo(x, y+s*0.1); c.stroke();
      c.beginPath(); c.moveTo(x-s*0.22, y-s*0.15); c.lineTo(x, y-s*0.25); c.lineTo(x+s*0.22, y-s*0.15); c.stroke();
      c.beginPath(); c.moveTo(x, y+s*0.1); c.lineTo(x-s*0.15, y+s*0.45); c.moveTo(x, y+s*0.1); c.lineTo(x+s*0.15, y+s*0.45); c.stroke();
      const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.3;
      c.fillStyle = '#e8ff00';
      c.globalAlpha = alpha * 0.9;
      c.beginPath(); c.arc(x, y - s*0.62, 4 * pulse, 0, Math.PI*2); c.fill();
      c.restore();
    };

    const ease = (t: number) => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const mapRange = (v: number, a: number, b: number) => clamp((v-a)/(b-a),0,1);

    const draw = () => {
      const p = progressRef.current;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = '#f0ede8';
      ctx.fillStyle = '#f0ede8';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      icons.forEach((icon, i) => {
        const target = getTarget(i);
        const start = starts[i];
        const t = ease(mapRange(p, 0, 0.65));
        const fadeOut = p > 0.65 ? ease(mapRange(p, 0.65, 0.82)) : 0;
        const x = start.x + (target.x - start.x) * t;
        const y = start.y + (target.y - start.y) * t;
        const scale = (0.3 + 0.7 * t) * (1 - fadeOut * 0.6);
        const alpha = t * (1 - fadeOut);
        if (alpha < 0.01) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        const r = 10, hs = tileSize/2;
        ctx.beginPath();
        (ctx as any).roundRect(-hs, -hs, tileSize, tileSize, r);
        ctx.fillStyle = 'rgba(240,237,232,0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(240,237,232,0.18)';
        ctx.stroke();
        ctx.strokeStyle = '#f0ede8';
        ctx.fillStyle = '#f0ede8';
        icon.draw(ctx, 0, 0, 22);
        ctx.restore();
      });

      if (p > 0.78) {
        const humanAlpha = ease(mapRange(p, 0.78, 0.96));
        const cx = W / 2, cy = H / 2;
        drawHuman(ctx, cx - 140, cy + 10, 120, humanAlpha * 0.7);
        drawHuman(ctx, cx, cy - 10, 140, humanAlpha);
        drawHuman(ctx, cx + 140, cy + 10, 120, humanAlpha * 0.7);

        if (humanAlpha > 0.3) {
          ctx.save();
          ctx.globalAlpha = (humanAlpha - 0.3) / 0.7;
          ctx.fillStyle = '#e8ff00';
          ctx.font = '600 13px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CHARAKTER.', cx, cy + 130);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
}
