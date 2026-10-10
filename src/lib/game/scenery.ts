import { WIDTH, HEIGHT, type GameState, type Enemy } from "./engine";
import { VILLAINS } from "./levels";
// Canvas semantic palette: shared roles, never per-frame random detail.
export const INK = {
  sky: "#111921",
  distant: "#253440",
  steel: "#40515b",
  dark: "#111b22",
  edge: "#71868d",
  light: "#e3f1ef",
  amber: "#ffc86a",
  cyan: "#68e5dc",
  red: "#ee4555",
  blue: "#2462bd",
  green: "#7be29d",
  water: "#182e39",
  dusk: "#ae7e84",
};
export const SCENES = [
  "BAHNHOFSPASSAGE",
  "LINDENER HAFEN",
  "CONTAINERREIHE C",
  "LINDEN-NORD",
  "AEGI · DACH 04",
  "ANTENNENKNOTEN",
];
type Layer = HTMLCanvasElement;
export type SceneCache = { sky: Layer; city: Layer; foreground: Layer; id: number };
function layer(draw: (ctx: CanvasRenderingContext2D) => void): Layer {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH + 32;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return canvas;
}
function line(c: CanvasRenderingContext2D, points: number[], color = INK.edge, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.stroke();
}
function box(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke?: string,
) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.strokeRect(x, y, w, h);
  }
}
function label(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = INK.light,
  size = 12,
) {
  c.fillStyle = color;
  c.font = `700 ${size}px monospace`;
  c.fillText(text, x, y);
}
function building(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  box(c, x, y, w, h, INK.distant);
  box(c, x + 6, y - 5, w - 12, 5, INK.steel);
  for (let row = 0; row < h / 18 - 1; row++)
    for (let col = 0; col < w / 14 - 1; col++) {
      const lit = (row * 13 + col * 7 + seed) % 9 < 3;
      box(c, x + 7 + col * 14, y + 9 + row * 18, 5, 8, lit ? INK.amber : INK.steel);
    }
}
function crane(c: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  line(c, [0, 210, 12, 0, 24, 210], INK.edge, 4);
  line(c, [-70, 24, 145, 24, 12, 0, -70, 24], INK.steel, 4);
  for (let i = 0; i < 7; i++)
    line(c, [-65 + i * 30, 24, -50 + i * 30, 8, -35 + i * 30, 24], INK.edge);
  line(c, [120, 24, 120, 100, 112, 107, 122, 112], INK.amber, 2);
  box(c, 0, 36, 30, 20, INK.dark, INK.amber);
  c.restore();
}
function container(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  serial: string,
) {
  box(c, x, y, w, h, color, INK.edge);
  for (let i = x + 8; i < x + w - 4; i += 12) {
    line(c, [i, y + 4, i, y + h - 4], INK.dark, 2);
    line(c, [i + 2, y + 4, i + 2, y + h - 4], INK.edge, 0.5);
  }
  box(c, x + 10, y + 12, 58, 20, INK.dark);
  label(c, serial, x + 15, y + 26, INK.light, 9);
  line(c, [x + w - 18, y + 5, x + w - 18, y + h - 5], INK.amber, 2);
}
export function createScene(id: number): SceneCache {
  const actual = id === 99 ? 6 : id;
  const sky = layer((c) => {
    const g = c.createLinearGradient(0, 0, 0, HEIGHT);
    g.addColorStop(0, INK.sky);
    g.addColorStop(0.65, actual === 6 ? INK.dusk : INK.distant);
    g.addColorStop(1, INK.dark);
    c.fillStyle = g;
    c.fillRect(0, 0, WIDTH + 32, HEIGHT);
    if (actual === 6) {
      c.fillStyle = INK.amber;
      c.beginPath();
      c.arc(505, 220, 47, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 11; i++)
      building(c, i * 74 - 20, 180 + ((i * 37) % 80), 48 + ((i * 17) % 30), HEIGHT, i + actual);
    if (actual === 2 || actual === 3) {
      crane(c, 170, 80, 0.6);
      crane(c, 420, 45, 0.85);
      crane(c, 635, 65, 0.65);
    }
    if (actual === 4) {
      line(c, [0, 92, 752, 116], INK.edge);
      line(c, [0, 125, 752, 98], INK.edge);
    }
    c.globalAlpha = 0.2;
    for (let i = 0; i < 12; i++) box(c, 0, 60 + i * 19, 752, 5, INK.edge);
    c.globalAlpha = 1;
  });
  const city = layer((c) => {
    if (actual === 1) {
      box(c, 0, 0, 752, 70, INK.dark);
      box(c, 0, 70, 752, 8, INK.steel);
      for (let i = 0; i < 6; i++) {
        const x = i * 144;
        box(c, x, 75, 10, 326, INK.steel);
        line(c, [x + 10, 80, x + 122, 80, x + 132, 195], INK.edge, 2);
        box(c, x + 30, 95, 91, 113, INK.dark, INK.steel);
        for (let j = 0; j < 5; j++) line(c, [x + 32 + j * 18, 96, x + 32 + j * 18, 206], INK.edge);
      }
      box(c, 54, 19, 280, 38, INK.dark, INK.cyan);
      label(c, "HANNOVER HBF →", 72, 44, INK.cyan, 23);
      box(c, 462, 24, 210, 32, INK.dark, INK.amber);
      label(c, "NACHTZUG · 23:14", 474, 45, INK.amber, 15);
      box(c, 26, 270, 90, 87, INK.dark, INK.edge);
      label(c, "KIOSK", 43, 291, INK.red, 19);
      box(c, 37, 306, 68, 41, INK.amber);
      box(c, 400, 215, 64, 134, INK.dark, INK.edge);
      for (let i = 0; i < 8; i++) {
        box(c, 408, 224 + i * 14, 48, 8, INK.steel);
        box(c, 442, 226 + i * 14, 4, 3, INK.cyan);
      }
      label(c, "SERVER / 01", 407, 369, INK.cyan, 9);
    }
    if (actual === 2) {
      box(c, 0, 355, 752, 125, INK.water);
      crane(c, 90, 35, 1.3);
      crane(c, 405, 10, 1.1);
      container(c, 275, 310, 152, 58, INK.steel, "KSE 041");
      container(c, 470, 305, 173, 63, INK.dark, "NORD 12");
      for (let i = 0; i < 42; i++) {
        c.globalAlpha = 0.15 + (i % 4) * 0.07;
        box(
          c,
          (i * 79) % 752,
          375 + ((i * 13) % 90),
          14 + (i % 5) * 8,
          2,
          i % 3 ? INK.cyan : INK.amber,
        );
      }
      c.globalAlpha = 1;
      box(c, 50, 331, 8, 36, INK.amber);
      box(c, 664, 332, 8, 34, INK.amber);
    }
    if (actual === 3) {
      container(c, -45, 60, 240, 88, INK.steel, "NORD / C-01");
      container(c, 410, 76, 340, 80, INK.dark, "C-08");
      container(c, -30, 328, 228, 85, INK.dark, "C-03");
      container(c, 416, 330, 336, 94, INK.steel, "C-12");
      container(c, -55, 225, 110, 90, INK.steel, "C-02");
      line(c, [260, 65, 260, 340], INK.edge, 4);
      box(c, 231, 55, 58, 12, INK.amber);
      line(c, [551, 175, 551, 320], INK.edge, 3);
      box(c, 531, 167, 41, 8, INK.cyan);
      label(c, "CONTAINERREIHE C", 245, 37, INK.amber, 17);
    }
    if (actual === 4) {
      building(c, -20, 86, 160, 335, 3);
      building(c, 560, 40, 194, 372, 5);
      box(c, 152, 310, 390, 100, INK.steel, INK.edge);
      box(c, 157, 314, 378, 16, INK.amber);
      for (let i = 0; i < 6; i++) {
        box(c, 164 + i * 60, 342, 48, 33, INK.dark, INK.edge);
        box(c, 170 + i * 60, 346, 3, 25, INK.amber);
      }
      label(c, "10 · AHLEM", 363, 325, INK.dark, 10);
      box(c, 165, 385, 373, 14, INK.dark);
      for (let i = 0; i < 4; i++) {
        c.fillStyle = INK.dark;
        c.beginPath();
        c.arc(203 + i * 90, 410, 10, 0, Math.PI * 2);
        c.fill();
      }
      line(c, [0, 436, 752, 413], INK.edge, 3);
      line(c, [0, 451, 752, 428], INK.edge, 3);
      box(c, 526, 194, 8, 128, INK.steel);
      box(c, 515, 188, 30, 61, INK.dark, INK.edge);
      box(c, 523, 230, 14, 12, INK.red);
      label(c, "LINDEN-NORD", 168, 74, INK.amber, 18);
    }
    if (actual === 5) {
      box(c, 0, 377, 752, 103, INK.dark);
      line(c, [0, 380, 752, 380], INK.edge, 4);
      for (let i = 0; i < 3; i++) {
        const x = 80 + i * 235;
        box(c, x, 303, 115, 73, INK.steel, INK.edge);
        box(c, x - 8, 292, 132, 16, INK.dark, INK.edge);
        for (let j = 0; j < 6; j++)
          line(c, [x + 12, 316 + j * 8, x + 102, 316 + j * 8], INK.dark, 3);
      }
      line(c, [0, 392, 240, 428, 752, 402], INK.steel, 3);
      label(c, "AEGI / ZUGANG 04", 224, 55, INK.amber, 19);
      box(c, 638, 243, 54, 130, INK.dark, INK.red);
      label(c, "!", 655, 279, INK.red, 26);
    }
    if (actual === 6) {
      box(c, 0, 387, 752, 93, INK.dark);
      line(c, [0, 387, 752, 387], INK.edge, 4);
      line(c, [485, 390, 512, 15, 539, 390], INK.steel, 6);
      for (let i = 0; i < 8; i++)
        line(c, [490 + i * 3, 360 - i * 40, 530 - i * 3, 320 - i * 40], INK.edge, 2);
      for (let i = 0; i < 3; i++) {
        box(c, 465, 75 + i * 66, 16, 36, INK.light);
        box(c, 540, 82 + i * 66, 16, 36, INK.light);
        line(c, [480, 90 + i * 66, 549, 90 + i * 66], INK.edge, 2);
      }
      line(c, [513, 15, 513, 0], INK.red, 3);
      box(c, 130, 333, 98, 54, INK.steel, INK.edge);
      box(c, 250, 315, 63, 72, INK.dark, INK.cyan);
      for (let i = 0; i < 4; i++)
        line(c, [514, 350, 320 + i * 40, 405, 100 + i * 90, 440], INK.steel, 3);
      label(c, "NETZKNOTEN / 05:11", 44, 44, INK.light, 18);
    }
  });
  const foreground = layer((c) => {
    if (actual === 2) {
      box(c, 0, 455, 752, 25, INK.dark);
      for (let i = 0; i < 12; i++) box(c, i * 65, 455, 28, 4, INK.amber);
    } else {
      box(c, 0, 440, 752, 40, INK.dark);
      for (let i = 0; i < 30; i++) line(c, [i * 35, 441, i * 35 - 30, 480], INK.steel);
    }
    if (actual === 1 || actual === 5) {
      c.globalAlpha = 0.35;
      for (let i = 0; i < 18; i++)
        box(
          c,
          (i * 93) % 752,
          407 + ((i * 11) % 50),
          35 + (i % 5) * 11,
          2,
          i % 2 ? INK.cyan : INK.amber,
        );
      c.globalAlpha = 1;
    }
    label(c, `KSE / ${SCENES[actual - 1]}`, 20, 466, INK.edge, 10);
  });
  return { sky, city, foreground, id: actual };
}
function limb(c: CanvasRenderingContext2D, points: number[], color: string, width: number) {
  c.lineCap = "round";
  line(c, points, INK.dark, width + 3);
  line(c, points, color, width);
}
export function drawSpidey(c: CanvasRenderingContext2D, s: GameState, reduced: boolean) {
  c.save();
  c.translate(s.spidey.x, s.spidey.y);
  c.rotate(reduced ? 0 : Math.sin(s.spidey.swing) * 0.1);
  line(c, [5, -245, 5, -53], INK.light, 1.3);
  const gait = reduced ? 0 : Math.sin(s.elapsed * 5) * 6;
  limb(c, [-7, 16, -19, 36, -38, 41 + gait], INK.blue, 12);
  limb(c, [8, 16, 22, 32, 17, 53 - gait], INK.blue, 12);
  limb(c, [-38, 41 + gait, -48, 44 + gait], INK.red, 10);
  limb(c, [17, 53 - gait, 31, 54 - gait], INK.red, 10);
  limb(c, [8, -15, 16, -40, 5, -53], INK.red, 9);
  limb(c, [-9, -13, -24, -3, -38, -8], INK.red, 9);
  c.fillStyle = INK.blue;
  c.beginPath();
  c.ellipse(0, 4, 16, 25, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = INK.red;
  c.beginPath();
  c.moveTo(-13, -18);
  c.lineTo(13, -18);
  c.lineTo(8, 12);
  c.lineTo(0, 19);
  c.lineTo(-8, 12);
  c.closePath();
  c.fill();
  c.fillStyle = INK.red;
  c.beginPath();
  c.ellipse(-1, -32, 15, 19, -0.15, 0, Math.PI * 2);
  c.fill();
  for (let i = -2; i <= 2; i++) line(c, [-1, -51, -1 + i * 6, -15], INK.dark, 0.7);
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = INK.dark;
    c.lineWidth = 0.7;
    c.beginPath();
    c.ellipse(-1, -33, 14, 4 + i * 4, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = INK.light;
  c.strokeStyle = INK.dark;
  c.lineWidth = 2;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 2, -34);
    c.lineTo(side * 12, -40);
    c.quadraticCurveTo(side * 14, -25, side * 5, -27);
    c.closePath();
    c.fill();
    c.stroke();
  }
  c.fillStyle = INK.dark;
  c.beginPath();
  c.ellipse(0, -1, 3, 5, 0, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 4; i++) {
    line(c, [0, -2, -8, -7 + i * 5], INK.dark, 1);
    line(c, [0, -2, 8, -7 + i * 5], INK.dark, 1);
  }
  c.restore();
}
function drawEnemy(c: CanvasRenderingContext2D, v: Enemy, s: GameState, reduced: boolean) {
  c.save();
  c.translate(v.x, v.y);
  if (v.hit) {
    c.globalAlpha = Math.max(0, 1 - v.deadAge / 0.35);
    c.rotate(v.deadAge * 3);
  }
  const boss = v.kind === "boss";
  const tank = v.kind === "tank";
  const runner = v.kind === "runner";
  const scale = boss ? 1.75 : tank ? 1.2 : runner ? 0.78 : 1;
  c.scale(scale, scale);
  const tint =
    v.flash > 0 ? INK.light : boss ? INK.red : tank ? INK.steel : runner ? INK.cyan : INK.amber;
  const gait = reduced ? 0 : Math.sin(v.age * (runner ? 16 : 8)) * 9;
  limb(c, [-7, 14, -12 + gait, 30, -22 + gait, 37], INK.steel, tank ? 13 : 9);
  limb(c, [8, 14, 14 - gait, 27, 21 - gait, 38], INK.steel, tank ? 13 : 9);
  limb(c, [-14, -12, -25, -2 + gait, -20, 12 + gait], tint, tank ? 12 : 8);
  limb(c, [14, -12, 26, 1 - gait, 34, -5 - gait], tint, tank ? 12 : 8);
  box(c, -17, -22, 34, 40, INK.dark);
  box(c, -14, -20, 28, 33, tint, INK.edge);
  if (tank || boss) {
    box(c, -25, -26, 19, 17, INK.steel, INK.edge);
    box(c, 7, -26, 19, 17, INK.steel, INK.edge);
    for (let i = 0; i < 3; i++) line(c, [-12, -12 + i * 8, 12, -12 + i * 8], INK.dark, 3);
  }
  c.fillStyle = INK.dark;
  c.beginPath();
  c.ellipse(0, -34, 13, 15, 0, 0, Math.PI * 2);
  c.fill();
  box(c, -11, -40, 22, 9, tint);
  box(c, -8, -34, 16, 4, boss ? INK.red : INK.light);
  if (runner) {
    line(c, [-16, -12, -30, -29, -40, -29], INK.cyan, 3);
    box(c, -8, -49, 21, 8, INK.steel);
  }
  if (boss) {
    for (let i = 0; i < 3; i++)
      line(c, [-17, -16, -35 - i * 3, -28 + i * 10, -28, 15 + i * 9], INK.edge, 2);
  }
  if (v.maxHp > 1) {
    box(c, -24, -64, 48, 5, INK.dark);
    box(
      c,
      -24,
      -64,
      (48 * Math.max(0, v.hp)) / v.maxHp,
      5,
      boss ? (s.bossOpen ? INK.green : INK.amber) : INK.cyan,
    );
  }
  c.restore();
  if (v.warning > 0 && !v.hit) {
    c.save();
    c.setLineDash([5, 5]);
    line(c, [v.x, v.y, v.x + 50, [150, 245, 340][(v.lane + 1) % 3]], INK.amber, 2);
    c.setLineDash([]);
    label(c, "↕", v.x + 16, v.y - 45, INK.amber, 22);
    c.restore();
  }
  if (boss && !v.hit) {
    c.strokeStyle = s.bossOpen ? INK.green : INK.amber;
    c.lineWidth = 2;
    c.setLineDash(s.bossOpen ? [] : [7, 8]);
    c.beginPath();
    c.arc(v.x, v.y, 70, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }
}
export function renderGame(
  c: CanvasRenderingContext2D,
  cache: SceneCache,
  s: GameState,
  reduced: boolean,
) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
  const drift = reduced ? 0 : Math.sin(s.elapsed * 0.25) * 5;
  c.drawImage(cache.sky, -8 + drift * 0.3, 0);
  c.drawImage(cache.city, -8 + drift, 0);
  if (!reduced && cache.id !== 6) {
    c.globalAlpha = 0.25;
    c.strokeStyle = INK.light;
    c.lineWidth = 1;
    for (let i = 0; i < (cache.id === 5 ? 48 : 26); i++) {
      const x = (((i * 97 - s.elapsed * 65) % 752) + 752) % 752;
      const y = (i * 53 + s.elapsed * (cache.id === 5 ? 260 : 170)) % 480;
      line(c, [x, y, x - 6, y + 14], INK.light);
    }
    c.globalAlpha = 1;
  }
  if (cache.id === 2 && !reduced) {
    c.globalAlpha = 0.22;
    for (let i = 0; i < 16; i++)
      box(
        c,
        (i * 47 + s.elapsed * 12) % 720,
        385 + (i % 5) * 12,
        22 + Math.sin(s.elapsed + i) * 10,
        1,
        INK.cyan,
      );
    c.globalAlpha = 1;
  }
  for (const v of s.villains) drawEnemy(c, v, s, reduced);
  for (const w of s.webs) {
    c.globalAlpha = 1 - w.age / 0.2;
    line(c, [w.x, w.y, w.targetX, w.targetY], INK.light, 2);
    c.beginPath();
    c.arc(w.targetX, w.targetY, 8 + w.age * 50, 0, Math.PI * 2);
    c.stroke();
  }
  c.globalAlpha = 1;
  if (!reduced)
    for (const p of s.particles) {
      c.globalAlpha = 1 - p.age / 0.45;
      box(c, p.x, p.y, 3, 3, INK.light);
    }
  c.globalAlpha = 1;
  drawSpidey(c, s, reduced);
  c.drawImage(cache.foreground, -8 + drift * 1.5, 0);
  if (s.aim.active) {
    c.strokeStyle = INK.light;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(s.aim.x, s.aim.y, 15, 0, Math.PI * 2);
    c.stroke();
    for (const d of [-1, 1]) {
      line(c, [s.aim.x + d * 9, s.aim.y, s.aim.x + d * 22, s.aim.y], INK.cyan, 2);
      line(c, [s.aim.x, s.aim.y + d * 9, s.aim.x, s.aim.y + d * 22], INK.cyan, 2);
    }
  }
  if (s.level.boss && s.running) {
    box(c, 230, 60, 260, 25, INK.dark);
    label(
      c,
      `PHASE ${s.bossPhase} / ${s.bossOpen ? "SCHILD OFFEN" : "SCHILD LÄDT"}`,
      245,
      77,
      s.bossOpen ? INK.green : INK.amber,
      12,
    );
  }
}
