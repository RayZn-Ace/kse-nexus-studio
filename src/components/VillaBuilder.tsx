import { useEffect, useRef } from 'react';

export default function VillaBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── EASING ────────────────────────────────────────────────────────────
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
    const mapP = (p: number, a: number, b: number) =>
      easeOutCubic(Math.min(1, Math.max(0, (p - a) / (b - a))));

    // ─── DRAW HELPERS ──────────────────────────────────────────────────────
    const drawRect = (x: number, y: number, w: number, h: number, fill: string, stroke: string, lw = 1) => {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    };

    const drawWindow = (x: number, y: number, w: number, h: number) => {
      // Window frame
      ctx.fillStyle = 'rgba(180,210,240,0.55)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(120,160,200,0.9)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, w, h);
      // Cross divider
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
      ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
      ctx.stroke();
      // Glint
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 3, y + 3, w / 2 - 5, h / 2 - 5);
    };

    const drawDoor = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#5c3d1e';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#8B5E2A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      // Panels
      ctx.strokeStyle = 'rgba(139,94,42,0.6)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 4, y + 4, w / 2 - 6, h / 2 - 6);
      ctx.strokeRect(x + w / 2 + 2, y + 4, w / 2 - 6, h / 2 - 6);
      ctx.strokeRect(x + 4, y + h / 2 + 2, w / 2 - 6, h / 2 - 8);
      ctx.strokeRect(x + w / 2 + 2, y + h / 2 + 2, w / 2 - 6, h / 2 - 8);
      // Knob
      ctx.fillStyle = '#e8d48b';
      ctx.beginPath();
      ctx.arc(x + w - 8, y + h * 0.55, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawTree = (x: number, y: number, scale: number) => {
      // Trunk
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(x - 5 * scale, y, 10 * scale, 30 * scale);
      // Canopy layers
      const greens = ['#2d6a2d', '#3a8a3a', '#4aaa4a'];
      [[0, -20, 50], [-10, -50, 40], [-5, -75, 30]].forEach(([ox, oy, r], i) => {
        ctx.fillStyle = greens[i];
        ctx.beginPath();
        ctx.arc(x + ox * scale, y + oy * scale, r * scale * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // ─── MAIN DRAW ─────────────────────────────────────────────────────────
    const draw = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, scrollY / maxScroll));

      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      // Villa sits in lower 60% of viewport, centered
      const base = H * 0.78;  // ground line Y
      const vw = Math.min(W * 0.65, 700); // villa total width
      const vh = vw * 0.55;   // villa total height

      // ── SKY GRADIENT ──────────────────────────────────────────────────────
      const skyT = mapP(p, 0.3, 1.0);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, base);
      // Shifts from near-black → deep blue → golden hour
      const r1 = Math.round(10 + skyT * 20);
      const g1 = Math.round(10 + skyT * 30);
      const b1 = Math.round(20 + skyT * 60);
      const r2 = Math.round(15 + skyT * 80);
      const g2 = Math.round(15 + skyT * 60);
      const b2 = Math.round(25 + skyT * 20);
      skyGrad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
      skyGrad.addColorStop(1, `rgb(${r2},${g2},${b2})`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, base);

      // ── GROUND ────────────────────────────────────────────────────────────
      const groundT = mapP(p, 0.5, 1.0);
      const gGrad = ctx.createLinearGradient(0, base, 0, H);
      gGrad.addColorStop(0, `rgba(${Math.round(40 + groundT * 50)},${Math.round(60 + groundT * 50)},${Math.round(20 + groundT * 10)},${Math.min(1, groundT + 0.3)})`);
      gGrad.addColorStop(1, `rgba(20,30,10,${Math.min(1, groundT + 0.2)})`);
      ctx.fillStyle = gGrad;
      ctx.fillRect(0, base, W, H - base);

      // Driveway
      if (p > 0.7) {
        const dtA = mapP(p, 0.7, 0.95);
        ctx.globalAlpha = dtA;
        ctx.fillStyle = '#8a8070';
        // Perspective trapezoid
        const dw1 = vw * 0.18, dw2 = vw * 0.08;
        ctx.beginPath();
        ctx.moveTo(cx - dw1, H);
        ctx.lineTo(cx + dw1, H);
        ctx.lineTo(cx + dw2, base);
        ctx.lineTo(cx - dw2, base);
        ctx.closePath();
        ctx.fill();
        // Lane lines
        ctx.strokeStyle = 'rgba(255,255,220,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(cx, base + 5);
        ctx.lineTo(cx, H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // ── FOUNDATION / SUBSTRUCTURE ─────────────────────────────────────────
      const fT = mapP(p, 0, 0.08);
      if (fT > 0) {
        ctx.globalAlpha = fT;
        const fw = vw, fh = 18;
        const fx = cx - fw / 2, fy = base - fh;
        // Concrete base
        ctx.fillStyle = '#b0a898';
        ctx.fillRect(fx, fy, fw, fh);
        ctx.strokeStyle = '#888070';
        ctx.lineWidth = 1;
        ctx.strokeRect(fx, fy, fw, fh);
        // Block texture lines
        ctx.strokeStyle = 'rgba(100,90,80,0.4)';
        ctx.lineWidth = 0.5;
        for (let bx = fx + 40; bx < fx + fw; bx += 40) {
          ctx.beginPath(); ctx.moveTo(bx, fy); ctx.lineTo(bx, fy + fh); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // ── MAIN BODY ─────────────────────────────────────────────────────────
      const bodyT = mapP(p, 0.05, 0.22);
      if (bodyT > 0) {
        ctx.globalAlpha = bodyT;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const bx = cx - bw / 2, by = base - 18 - bh;

        // Wall — warm stucco / cream render
        const wallGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
        wallGrad.addColorStop(0, '#e8e0d0');
        wallGrad.addColorStop(0.5, '#f2ece0');
        wallGrad.addColorStop(1, '#d8d0c0');
        drawRect(bx, by, bw, bh, '#f0e8d8', '#c8c0b0', 1.5);
        ctx.fillStyle = wallGrad;
        ctx.fillRect(bx, by, bw, bh);

        // Cornerstones
        ctx.fillStyle = '#d0c8b8';
        ctx.strokeStyle = '#b0a898';
        ctx.lineWidth = 0.8;
        [[bx, by], [bx + bw - 14, by]].forEach(([qx, qy]) => {
          for (let qi = 0; qi < bh; qi += 22) {
            const qh = qi % 44 === 0 ? 10 : 12;
            ctx.fillRect(qx, qy + qi, 14, qh);
            ctx.strokeRect(qx, qy + qi, 14, qh);
          }
        });

        // Horizontal string courses
        ctx.strokeStyle = 'rgba(180,170,155,0.7)';
        ctx.lineWidth = 2;
        [0.33, 0.66].forEach(frac => {
          const ly = by + bh * frac;
          ctx.beginPath(); ctx.moveTo(bx, ly); ctx.lineTo(bx + bw, ly); ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      // ── SIDE WINGS ────────────────────────────────────────────────────────
      const wingT = mapP(p, 0.15, 0.32);
      if (wingT > 0) {
        ctx.globalAlpha = wingT;
        const mainBh = vh * 0.52;
        const mainBw = vw * 0.72;
        const wingW = vw * 0.14;
        const wingH = mainBh * 0.72;
        const wingY = base - 18 - wingH;

        [cx - mainBw / 2 - wingW, cx + mainBw / 2].forEach((wx) => {
          const wingGrad = ctx.createLinearGradient(wx, wingY, wx + wingW, wingY);
          wingGrad.addColorStop(0, '#e0d8c8');
          wingGrad.addColorStop(1, '#ece4d4');
          ctx.fillStyle = wingGrad;
          ctx.fillRect(wx, wingY, wingW, wingH);
          ctx.strokeStyle = '#c0b8a8';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(wx, wingY, wingW, wingH);
        });
        ctx.globalAlpha = 1;
      }

      // ── WINDOWS — GROUND FLOOR ─────────────────────────────────────────────
      const win1T = mapP(p, 0.2, 0.35);
      if (win1T > 0) {
        ctx.globalAlpha = win1T;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const bx = cx - bw / 2;
        const by = base - 18 - bh;
        const wh = bh * 0.28, ww = bw * 0.14;
        const wy = by + bh * 0.56;
        const positions = [bx + bw * 0.1, bx + bw * 0.32, bx + bw * 0.54, bx + bw * 0.76];
        positions.forEach(wx => drawWindow(wx, wy, ww, wh));
        ctx.globalAlpha = 1;
      }

      // ── WINDOWS — UPPER FLOOR ─────────────────────────────────────────────
      const win2T = mapP(p, 0.28, 0.42);
      if (win2T > 0) {
        ctx.globalAlpha = win2T;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const bx = cx - bw / 2;
        const by = base - 18 - bh;
        const wh = bh * 0.22, ww = bw * 0.12;
        const wy = by + bh * 0.16;
        [bx + bw * 0.12, bx + bw * 0.34, bx + bw * 0.56, bx + bw * 0.76].forEach(wx =>
          drawWindow(wx, wy, ww, wh)
        );
        ctx.globalAlpha = 1;
      }

      // ── BALCONY ────────────────────────────────────────────────────────────
      const balcT = mapP(p, 0.32, 0.46);
      if (balcT > 0) {
        ctx.globalAlpha = balcT;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const bx = cx - bw / 2;
        const by = base - 18 - bh;
        const blW = bw * 0.3, blH = 14;
        const blX = cx - blW / 2, blY = by + bh * 0.5;

        ctx.fillStyle = '#e0d8c8';
        ctx.fillRect(blX, blY, blW, blH);
        ctx.strokeStyle = '#c0b8a8';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(blX, blY, blW, blH);

        // Balustrade balusters
        ctx.strokeStyle = '#c8c0b0';
        ctx.lineWidth = 1;
        for (let bi = 0; bi < blW; bi += 8) {
          ctx.beginPath();
          ctx.moveTo(blX + bi, blY);
          ctx.lineTo(blX + bi, blY - 18);
          ctx.stroke();
        }
        // Top rail
        ctx.strokeStyle = '#b0a898';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(blX, blY - 18);
        ctx.lineTo(blX + blW, blY - 18);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ── COLUMNS / PORTICO ─────────────────────────────────────────────────
      const colT = mapP(p, 0.38, 0.52);
      if (colT > 0) {
        ctx.globalAlpha = colT;
        const bh = vh * 0.52;
        const by = base - 18 - bh;
        const colH = bh * 0.55, colW = 16;
        const colPositions = [cx - 80, cx - 28, cx + 28, cx + 80];

        colPositions.forEach(colX => {
          // Column shaft with taper
          const colGrad = ctx.createLinearGradient(colX, by + bh * 0.45, colX + colW, by + bh * 0.45);
          colGrad.addColorStop(0, '#e8e0d0');
          colGrad.addColorStop(0.4, '#ffffff');
          colGrad.addColorStop(1, '#d0c8b8');
          ctx.fillStyle = colGrad;
          ctx.fillRect(colX, by + bh - colH, colW, colH);
          ctx.strokeStyle = '#c0b8a8';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(colX, by + bh - colH, colW, colH);

          // Capital
          ctx.fillStyle = '#f0e8d8';
          ctx.fillRect(colX - 4, by + bh - colH, colW + 8, 10);
          ctx.strokeStyle = '#c0b0a0';
          ctx.strokeRect(colX - 4, by + bh - colH, colW + 8, 10);

          // Base
          ctx.fillRect(colX - 4, base - 22, colW + 8, 8);
          ctx.strokeRect(colX - 4, base - 22, colW + 8, 8);
        });
        ctx.globalAlpha = 1;
      }

      // ── DOOR ──────────────────────────────────────────────────────────────
      const doorT = mapP(p, 0.44, 0.56);
      if (doorT > 0) {
        ctx.globalAlpha = doorT;
        const bh = vh * 0.52;
        const by = base - 18 - bh;
        const dw = vw * 0.08, dh = bh * 0.32;
        drawDoor(cx - dw / 2, base - 18 - dh, dw, dh);

        // Arch above door
        ctx.strokeStyle = '#c0b0a0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, base - 18 - dh, dw / 2 + 4, Math.PI, 0);
        ctx.stroke();

        // Door steps
        [[vw * 0.12, 8], [vw * 0.10, 8], [vw * 0.08, 8]].forEach(([sw, sh], i) => {
          ctx.fillStyle = '#ccc4b4';
          ctx.fillRect(cx - sw / 2, base - 18 - (i + 1) * sh, sw, sh + 2);
          ctx.strokeStyle = '#b0a898'; ctx.lineWidth = 0.5;
          ctx.strokeRect(cx - sw / 2, base - 18 - (i + 1) * sh, sw, sh + 2);
        });
        ctx.globalAlpha = 1;
      }

      // ── MAIN ROOF ─────────────────────────────────────────────────────────
      const roofT = mapP(p, 0.5, 0.66);
      if (roofT > 0) {
        ctx.globalAlpha = roofT;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const bx = cx - bw / 2;
        const by = base - 18 - bh;
        const roofH = bh * 0.38;
        const overhang = vw * 0.04;

        // Main hip roof
        const roofGrad = ctx.createLinearGradient(cx, by - roofH, cx, by);
        roofGrad.addColorStop(0, '#8B4513');
        roofGrad.addColorStop(0.5, '#A0522D');
        roofGrad.addColorStop(1, '#6B3410');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(bx - overhang, by);
        ctx.lineTo(cx, by - roofH);
        ctx.lineTo(bx + bw + overhang, by);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5c2e08';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Roof tiles (horizontal lines)
        ctx.strokeStyle = 'rgba(80,40,10,0.3)';
        ctx.lineWidth = 1;
        for (let ri = 1; ri < 8; ri++) {
          const frac = ri / 8;
          const lx1 = bx - overhang + (cx - bx + overhang) * frac;
          const lx2 = bx + bw + overhang - (bx + bw + overhang - cx) * frac;
          const ly = by - roofH * frac;
          ctx.beginPath();
          ctx.moveTo(lx1, ly);
          ctx.lineTo(lx2, ly);
          ctx.stroke();
        }

        // Eave detail
        ctx.fillStyle = '#f0e8d8';
        ctx.fillRect(bx - overhang - 2, by - 6, bw + overhang * 2 + 4, 8);
        ctx.strokeStyle = '#c0b0a0'; ctx.lineWidth = 0.8;
        ctx.strokeRect(bx - overhang - 2, by - 6, bw + overhang * 2 + 4, 8);
        ctx.globalAlpha = 1;
      }

      // ── WING ROOFS ────────────────────────────────────────────────────────
      const wroofT = mapP(p, 0.56, 0.70);
      if (wroofT > 0) {
        ctx.globalAlpha = wroofT;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const wingW = vw * 0.14;
        const wingH = bh * 0.72;
        const wingY = base - 18 - wingH;
        const wRoofH = wingH * 0.32;

        [cx - bw / 2 - wingW, cx + bw / 2].forEach((wx) => {
          const wPeak = wx < cx ? wx + wingW / 2 : wx + wingW / 2;
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.moveTo(wx - 4, wingY);
          ctx.lineTo(wPeak, wingY - wRoofH);
          ctx.lineTo(wx + wingW + 4, wingY);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#5c2e08'; ctx.lineWidth = 1;
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      // ── CHIMNEYS ──────────────────────────────────────────────────────────
      const chimneyT = mapP(p, 0.62, 0.74);
      if (chimneyT > 0) {
        ctx.globalAlpha = chimneyT;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const by = base - 18 - bh;
        const roofH = bh * 0.38;
        const roofTop = by - roofH;

        [[cx - bw * 0.22, 28, 12], [cx + bw * 0.18, 22, 10]].forEach(([chX, chH, chW]) => {
          ctx.fillStyle = '#c0785a';
          ctx.fillRect(chX - chW / 2, roofTop - chH, chW, chH);
          ctx.strokeStyle = '#a06040'; ctx.lineWidth = 1;
          ctx.strokeRect(chX - chW / 2, roofTop - chH, chW, chH);
          // Cap
          ctx.fillStyle = '#b06848';
          ctx.fillRect(chX - chW / 2 - 3, roofTop - chH, chW + 6, 6);
          // Smoke
          if (p > 0.75) {
            const smokeA = mapP(p, 0.75, 0.9);
            ctx.globalAlpha = chimneyT * smokeA * 0.4;
            ctx.fillStyle = '#d0d0d0';
            for (let si = 0; si < 3; si++) {
              const t2 = Date.now() * 0.0005 + si;
              ctx.beginPath();
              ctx.arc(
                chX + Math.sin(t2) * 5,
                roofTop - chH - 15 - si * 18,
                6 + si * 3,
                0, Math.PI * 2
              );
              ctx.fill();
            }
          }
        });
        ctx.globalAlpha = 1;
      }

      // ── DORMER WINDOWS ────────────────────────────────────────────────────
      const dormerT = mapP(p, 0.65, 0.76);
      if (dormerT > 0) {
        ctx.globalAlpha = dormerT;
        const bh = vh * 0.52;
        const bw = vw * 0.72;
        const bx = cx - bw / 2;
        const by = base - 18 - bh;
        const roofH = bh * 0.38;
        const roofTop = by - roofH;

        [cx - bw * 0.15, cx + bw * 0.15].forEach(dx => {
          const dwy = roofTop + roofH * 0.25;
          const dwW = 38, dwH = 28, dRoofH = 12;
          // Dormer body
          ctx.fillStyle = '#f0e8d8';
          ctx.fillRect(dx - dwW / 2, dwy, dwW, dwH);
          ctx.strokeStyle = '#c0b0a0'; ctx.lineWidth = 1;
          ctx.strokeRect(dx - dwW / 2, dwy, dwW, dwH);
          // Dormer roof
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.moveTo(dx - dwW / 2 - 4, dwy);
          ctx.lineTo(dx, dwy - dRoofH);
          ctx.lineTo(dx + dwW / 2 + 4, dwy);
          ctx.closePath();
          ctx.fill();
          // Dormer window
          drawWindow(dx - dwW / 2 + 5, dwy + 5, dwW - 10, dwH - 10);
        });
        ctx.globalAlpha = 1;
      }

      // ── LANDSCAPING — HEDGES ──────────────────────────────────────────────
      const hedgeT = mapP(p, 0.68, 0.80);
      if (hedgeT > 0) {
        ctx.globalAlpha = hedgeT;
        const bw = vw * 0.72;

        // Hedge blocks
        [cx - bw / 2 - 50, cx + bw / 2 + 10].forEach(hx => {
          ctx.fillStyle = '#2d5a1e';
          ctx.fillRect(hx, base - 28, 40, 20);
          ctx.fillStyle = '#3a7228';
          ctx.fillRect(hx, base - 36, 44, 12);
          ctx.strokeStyle = '#1e4012'; ctx.lineWidth = 0.8;
          ctx.strokeRect(hx, base - 36, 44, 28);
        });
        ctx.globalAlpha = 1;
      }

      // ── TREES ─────────────────────────────────────────────────────────────
      const treeT = mapP(p, 0.72, 0.85);
      if (treeT > 0) {
        ctx.globalAlpha = treeT;
        const bw = vw * 0.72;
        drawTree(cx - bw / 2 - 110, base, 0.85);
        drawTree(cx + bw / 2 + 110, base, 0.85);
        drawTree(cx - bw / 2 - 170, base + 10, 0.65);
        ctx.globalAlpha = 1;
      }

      // ── GATE / FENCE ──────────────────────────────────────────────────────
      const gateT = mapP(p, 0.76, 0.87);
      if (gateT > 0) {
        ctx.globalAlpha = gateT;
        const gW = vw * 0.5;
        const gx = cx - gW / 2;
        // Gate pillars
        [[gx, 40, 22], [gx + gW, 40, 22]].forEach(([px, ph, pw]) => {
          ctx.fillStyle = '#d8d0c0';
          ctx.fillRect(px - pw / 2, base - ph, pw, ph);
          ctx.strokeStyle = '#b0a898'; ctx.lineWidth = 1;
          ctx.strokeRect(px - pw / 2, base - ph, pw, ph);
          // Pillar cap sphere
          ctx.fillStyle = '#e8e0d0';
          ctx.beginPath();
          ctx.arc(px, base - ph - 6, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#c0b8a8';
          ctx.stroke();
        });
        // Gate bars
        ctx.strokeStyle = '#888070';
        ctx.lineWidth = 2;
        const barCount = 10;
        for (let bi = 0; bi <= barCount; bi++) {
          const bx2 = gx + (gW / barCount) * bi;
          ctx.beginPath();
          ctx.moveTo(bx2, base);
          ctx.lineTo(bx2, base - 30);
          // Spear tip
          ctx.moveTo(bx2 - 3, base - 30);
          ctx.lineTo(bx2, base - 38);
          ctx.lineTo(bx2 + 3, base - 30);
          ctx.stroke();
        }
        // Horizontal bars
        ctx.strokeStyle = '#888070'; ctx.lineWidth = 1.5;
        [0.3, 0.7].forEach(frac => {
          ctx.beginPath();
          ctx.moveTo(gx, base - 30 * frac);
          ctx.lineTo(gx + gW, base - 30 * frac);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      // ── SUN / GOLDEN HOUR ─────────────────────────────────────────────────
      const sunT = mapP(p, 0.8, 1.0);
      if (sunT > 0) {
        ctx.globalAlpha = sunT * 0.6;
        const sunX = cx + vw * 0.3, sunY = H * 0.15;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
        sunGrad.addColorStop(0, 'rgba(255,220,100,0.9)');
        sunGrad.addColorStop(0.2, 'rgba(255,180,60,0.4)');
        sunGrad.addColorStop(1, 'rgba(255,140,20,0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
        ctx.fill();

        // Sun disc
        ctx.globalAlpha = sunT * 0.9;
        ctx.fillStyle = '#FFE566';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ── REFLECTIONS IN WINDOWS ─────────────────────────────────────────────
      if (p > 0.82) {
        const refT = mapP(p, 0.82, 0.96);
        ctx.globalAlpha = refT * 0.5;
        // Warm glow on windows (golden hour)
        ctx.fillStyle = 'rgba(255,200,80,0.25)';
        const bh2 = vh * 0.52;
        const bw2 = vw * 0.72;
        const bx2 = cx - bw2 / 2;
        const by2 = base - 18 - bh2;
        [[0.1, 0.56], [0.32, 0.56], [0.54, 0.56], [0.76, 0.56],
         [0.12, 0.16], [0.34, 0.16], [0.56, 0.16], [0.76, 0.16]].forEach(([fx, fy]) => {
          ctx.fillRect(bx2 + bw2 * fx, by2 + bh2 * fy, bw2 * 0.13, bh2 * 0.24);
        });
        ctx.globalAlpha = 1;
      }

      // ── FINAL LABEL ───────────────────────────────────────────────────────
      if (p > 0.9) {
        const labelT = mapP(p, 0.9, 1.0);
        ctx.globalAlpha = labelT;
        ctx.fillStyle = '#e8ff00';
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '0.25em';
        ctx.fillText('WIR BAUEN CHARAKTER.', cx, base + 50);
        ctx.fillStyle = 'rgba(240,237,232,0.5)';
        ctx.font = '400 10px "Inter", sans-serif';
        ctx.fillText('KSEGROUP.EU', cx, base + 68);
        ctx.globalAlpha = 1;
      }

      // ── SCROLL HINT ───────────────────────────────────────────────────────
      if (p < 0.06) {
        ctx.globalAlpha = 1 - p / 0.06;
        ctx.fillStyle = '#e8ff00';
        ctx.font = '400 11px "Inter", sans-serif';
        ctx.letterSpacing = '0.2em';
        ctx.textAlign = 'center';
        ctx.fillText('↓  SCROLL TO BUILD', cx, H - 30);
        ctx.globalAlpha = 1;
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
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
