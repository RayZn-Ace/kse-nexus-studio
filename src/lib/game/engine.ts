import { LEVELS, VILLAINS, isLevelCleared, type Level, type VillainKind } from "./levels";
import type { GameProgress } from "./progress";

export const WIDTH = 720;
export const HEIGHT = 480;
export const STEP = 1 / 60;
export const LANES = [150, 245, 340];
export const MAX_PARTICLES = 64;
export const MAX_WEBS = 12;
export const SHOT_INTERVAL = 0.22;
export type Enemy = {
  id: number;
  kind: VillainKind;
  x: number;
  y: number;
  lane: number;
  hp: number;
  maxHp: number;
  hit: boolean;
  age: number;
  flash: number;
  deadAge: number;
  switched: boolean;
  warning: number;
  warningTargetLane: number | null;
};
export type Web = { x: number; y: number; targetX: number; targetY: number; age: number };
export type Particle = { x: number; y: number; vx: number; vy: number; age: number };
export type GameState = {
  level: Level;
  endless: boolean;
  running: boolean;
  outcome: "playing" | "cleared" | "failed";
  tick: number;
  elapsed: number;
  spawnTimer: number;
  wave: number;
  idCounter: number;
  villains: Enemy[];
  webs: Web[];
  particles: Particle[];
  score: number;
  kills: number;
  lives: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
  bossPhase: number;
  bossOpen: boolean;
  aim: { x: number; y: number; active: boolean };
  firing: boolean;
  pointerId: number | null;
  cooldown: number;
  ramp: number;
  spidey: { x: number; y: number; swing: number };
  beatsDone: Set<number>;
  message: { who: string; text: string } | null;
  messageUntil: number;
};
export const MECHANICS: Record<number, string> = {
  1: "8 Handlanger stoppen. Drei feste Angriffsspuren, ein Netztreffer pro Gegner.",
  2: "12 Gegner stoppen. Sprinter blinken vor dem Spurwechsel – verfolge ihre neue Position.",
  3: "14 Gegner stoppen. Panzer brauchen drei Treffer; Sprinter kommen in den Lücken.",
  4: "18 Gegner stoppen. Dreierwellen: erst Sprinter, dann Panzer und Handlanger. Ziele priorisieren.",
  5: "22 Gegner stoppen, zwei Leben. Gelbe Pfeile kündigen Ausweichmanöver 0,7 Sekunden vorher an.",
  6: "Netzbrecher besiegen: 18 Treffer. Gelber Ring: Schild lädt. Grüner Ring: 3 Sekunden verwundbar. Durchbruch bedeutet Niederlage.",
  99: "Überlebe die geplanten Mischwellen. Tempo steigt dauerhaft; Sprinter wechseln die Spur.",
};
export type WaveEntry = { kind: VillainKind; lane: number };
export function plannedWave(level: Level, wave: number): WaveEntry[] {
  const lane = wave % 3;
  if (level.id === 1) return [{ kind: "grunt", lane }];
  if (level.id === 2) return [{ kind: wave % 3 === 1 ? "runner" : "grunt", lane }];
  if (level.id === 3) return [{ kind: wave % 2 === 0 ? "tank" : "runner", lane }];
  if (level.id === 4)
    return [
      { kind: "runner", lane },
      { kind: "tank", lane: (lane + 1) % 3 },
      { kind: "grunt", lane: (lane + 2) % 3 },
    ];
  if (level.id === 5)
    return [
      { kind: "runner", lane },
      { kind: wave % 2 === 0 ? "tank" : "grunt", lane: (lane + 1) % 3 },
    ];
  if (level.boss)
    return [{ kind: wave % 2 === 0 ? "grunt" : "runner", lane: wave % 2 === 0 ? 0 : 2 }];
  return [
    { kind: "runner", lane },
    { kind: wave % 3 === 0 ? "tank" : "grunt", lane: (lane + 1) % 3 },
  ];
}
export function waveInterval(level: Level, ramp = 1): number {
  const interval: Record<number, number> = {
    1: 1.7,
    2: 1.5,
    3: 1.45,
    4: 3.6,
    5: 2.3,
    6: 2.8,
    99: 2.2,
  };
  return Math.max(0.55, (interval[level.id] ?? 2) / ramp);
}
export function createGame(level: Level = LEVELS[0], endless = false): GameState {
  return {
    level,
    endless,
    running: true,
    outcome: "playing",
    tick: 0,
    elapsed: 0,
    spawnTimer: 0.8,
    wave: 0,
    idCounter: 1,
    villains: [],
    webs: [],
    particles: [],
    score: 0,
    kills: 0,
    lives: level.lives,
    bossSpawned: false,
    bossDefeated: false,
    bossPhase: 0,
    bossOpen: false,
    aim: { x: WIDTH / 2, y: HEIGHT / 2, active: false },
    firing: false,
    pointerId: null,
    cooldown: 0,
    ramp: 1,
    spidey: { x: 630, y: 245, swing: 0 },
    beatsDone: new Set(),
    message: null,
    messageUntil: 0,
  };
}
export function spawnEnemy(s: GameState, kind: VillainKind, lane: number, offset = 0): Enemy {
  const spec = VILLAINS[kind];
  const enemy: Enemy = {
    id: s.idCounter++,
    kind,
    x: -spec.radius - offset,
    y: LANES[lane],
    lane,
    hp: spec.hp,
    maxHp: spec.hp,
    hit: false,
    age: 0,
    flash: 0,
    deadAge: 0,
    switched: false,
    warning: 0,
    warningTargetLane: null,
  };
  s.villains.push(enemy);
  return enemy;
}
export function announce(s: GameState, text: string, who = "KayI") {
  s.message = { who, text };
  s.messageUntil = s.elapsed + 3;
}
export function damageEnemy(s: GameState, enemy: Enemy): boolean {
  if (!s.running || enemy.hit || (enemy.kind === "boss" && !s.bossOpen)) return false;
  enemy.hp -= 1;
  enemy.flash = 0.12;
  if (enemy.hp <= 0) {
    enemy.hit = true;
    enemy.deadAge = 0;
    s.kills++;
    s.score += VILLAINS[enemy.kind].points;
    if (enemy.kind === "boss") s.bossDefeated = true;
  } else s.score += 2;
  for (let i = 0; i < 6 && s.particles.length < MAX_PARTICLES; i++) {
    const angle = (i * Math.PI) / 3;
    s.particles.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * 85,
      vy: Math.sin(angle) * 85,
      age: 0,
    });
  }
  resolveOutcome(s);
  return true;
}
export function reachPlayer(s: GameState, enemy: Enemy) {
  if (!s.running || enemy.hit) return;
  enemy.hit = true;
  enemy.deadAge = 0;
  s.lives = enemy.kind === "boss" ? 0 : Math.max(0, s.lives - 1);
  announce(
    s,
    enemy.kind === "boss"
      ? "Er hat den Antennenknoten erreicht. Rückzug!"
      : "Durchbruch! Die nächste Spur im Blick behalten.",
  );
  resolveOutcome(s);
}
export function resolveOutcome(s: GameState) {
  if (s.lives <= 0) {
    s.running = false;
    s.outcome = "failed";
  } else if (isLevelCleared(s.level, s.kills, s.bossDefeated)) {
    s.running = false;
    s.outcome = "cleared";
  }
  if (!s.running) {
    s.firing = false;
    s.pointerId = null;
  }
}
export function shoot(s: GameState, x: number, y: number) {
  if (!s.running) return;
  if (s.webs.length >= MAX_WEBS) s.webs.shift();
  s.webs.push({ x: s.spidey.x - 22, y: s.spidey.y, targetX: x, targetY: y, age: 0 });
  let best: Enemy | undefined;
  let distance = Infinity;
  for (const enemy of s.villains) {
    if (enemy.hit || enemy.x < 0) continue;
    const d = Math.hypot(enemy.x - x, enemy.y - y);
    if (d <= VILLAINS[enemy.kind].radius + 14 && d < distance) {
      best = enemy;
      distance = d;
    }
  }
  if (best) damageEnemy(s, best);
}
export function pointerPosition(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
) {
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: Math.max(0, Math.min(WIDTH, ((clientX - rect.left) * WIDTH) / rect.width)),
    y: Math.max(0, Math.min(HEIGHT, ((clientY - rect.top) * HEIGHT) / rect.height)),
  };
}
export function beginPointer(s: GameState, id: number, x: number, y: number) {
  if (!s.running || s.pointerId !== null) return false;
  s.pointerId = id;
  s.aim = { x, y, active: true };
  s.firing = true;
  if (s.cooldown <= 0) {
    shoot(s, x, y);
    s.cooldown = SHOT_INTERVAL;
  }
  return true;
}
export function endPointer(s: GameState, id?: number) {
  if (id !== undefined && s.pointerId !== id) return;
  s.firing = false;
  s.pointerId = null;
  s.aim.active = false;
}
export function stepGame(s: GameState) {
  if (!s.running) return;
  const dt = STEP;
  s.tick++;
  s.elapsed = s.tick * STEP;
  s.ramp = s.endless ? 1 + s.elapsed * 0.021 : 1;
  s.spidey.swing = s.elapsed * 2.4;
  s.spidey.x = 630 + Math.sin(s.spidey.swing) * 8;
  s.spidey.y = 245 + Math.cos(s.spidey.swing * 1.3) * 9;
  if (s.message && s.elapsed > s.messageUntil) s.message = null;
  if (s.level.boss) {
    if (!s.bossSpawned) {
      spawnEnemy(s, "boss", 1);
      s.bossSpawned = true;
    }
    const boss = s.villains.find((v) => v.kind === "boss");
    const phase = boss ? (boss.hp > 12 ? 1 : boss.hp > 6 ? 2 : 3) : 1;
    const cycle = s.elapsed % 6;
    const open = cycle >= 3;
    if (s.bossPhase !== phase) {
      s.bossPhase = phase;
      announce(
        s,
        `Phase ${phase}: ${phase === 1 ? "Antennenpanzer" : phase === 2 ? "Kabelsturm" : "Letzter Widerstand"}. Schildrhythmus bleibt: drei Sekunden offen.`,
      );
    }
    if (s.bossOpen !== open) {
      if (boss && open && boss.warningTargetLane !== null) {
        boss.lane = boss.warningTargetLane;
      }
      if (boss) boss.warningTargetLane = null;
      s.bossOpen = open;
      announce(
        s,
        open
          ? "JETZT! Schild offen – drei Sekunden Netzfeuer!"
          : "Schild lädt. Adds abfangen, nächstes Fenster in drei Sekunden.",
      );
    }
    if (boss) {
      // Arm only at the beginning of the full 0.7-second warning, never on an HP change.
      if (!open && phase >= 2 && cycle >= 2.3 && cycle - STEP < 2.3) {
        boss.warningTargetLane = Math.floor(s.elapsed / 6) % 2 === 0 ? 0 : 2;
      }
      boss.warning =
        !open && boss.warningTargetLane !== null ? (3 - cycle) / 0.7 : 0;
    }
  }
  s.cooldown = Math.max(0, s.cooldown - dt);
  if (s.firing && s.cooldown <= 0) {
    shoot(s, s.aim.x, s.aim.y);
    s.cooldown = SHOT_INTERVAL;
  }
  if (!s.running) return;
  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0) {
    const entries = plannedWave(s.level, s.wave);
    if (s.level.boss && s.bossPhase === 3) {
      entries.push({ kind: "runner", lane: (entries[0].lane + 1) % 3 });
    }
    if (s.villains.filter((v) => !v.hit).length + entries.length <= 16)
      entries.forEach((e, i) => spawnEnemy(s, e.kind, e.lane, i * 70));
    s.wave++;
    s.spawnTimer +=
      waveInterval(s.level, s.ramp) / (s.level.boss ? 1 + (s.bossPhase - 1) * 0.2 : 1);
    if (s.level.id === 4) announce(s, "Dreierwelle: Sprinter vorn, Panzer dahinter!");
    if (s.level.id === 5) announce(s, "Hinterhalt! Gelbe Pfeile zeigen die nächste Ausweichspur.");
  }
  for (const v of s.villains) {
    v.age += dt;
    v.flash = Math.max(0, v.flash - dt);
    if (v.hit) {
      v.deadAge += dt;
      continue;
    }
    const changes =
      (v.kind === "runner" && s.level.id >= 2) || (s.level.id === 5 && v.kind !== "tank");
    if (changes && !v.switched) {
      if (v.age >= 1.3 && v.age < 2) v.warning = (2 - v.age) / 0.7;
      if (v.age >= 2) {
        v.lane = (v.lane + 1) % 3;
        v.switched = true;
        v.warning = 0;
      }
    }
    v.y += (LANES[v.lane] - v.y) * Math.min(1, dt * 8);
    const phaseSpeed = v.kind === "boss" ? 1 + (s.bossPhase - 1) * 0.25 : 1;
    v.x += VILLAINS[v.kind].speed * 60 * s.level.speedMul * s.ramp * phaseSpeed * dt;
    if (v.x >= s.spidey.x - 32) reachPlayer(s, v);
  }
  for (const web of s.webs) web.age += dt;
  s.webs = s.webs.filter((w) => w.age < 0.2);
  for (const p of s.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 130 * dt;
  }
  s.particles = s.particles.filter((p) => p.age < 0.45);
  s.villains = s.villains.filter((v) => !v.hit || v.deadAge < 0.35);
  for (const b of s.level.beats)
    if (s.kills >= b.at && !s.beatsDone.has(b.at)) {
      s.beatsDone.add(b.at);
      announce(s, b.text, b.who);
    }
}
export type Clock = { last: number | null; accumulator: number };
export function createClock(): Clock {
  return { last: null, accumulator: 0 };
}
export function resetClock(clock: Clock) {
  clock.last = null;
  clock.accumulator = 0;
}
export function advanceClock(clock: Clock, timestamp: number, update: () => void): number {
  if (clock.last === null) {
    clock.last = timestamp;
    return 0;
  }
  const delta = Math.max(0, (timestamp - clock.last) / 1000);
  clock.last = timestamp;
  if (delta > 0.25) {
    clock.accumulator = 0;
    return 0;
  }
  clock.accumulator += delta;
  let count = 0;
  while (clock.accumulator + 1e-9 >= STEP && count < 15) {
    update();
    clock.accumulator -= STEP;
    count++;
  }
  return count;
}
export function progressAfterRun(previous: GameProgress, s: GameState): GameProgress {
  const next = {
    ...previous,
    best_score: Math.max(previous.best_score, s.score),
    total_score: previous.total_score + s.score,
  };
  if (s.endless) next.endless_best = Math.max(previous.endless_best, s.score);
  else if (s.outcome === "cleared") {
    next.level = Math.min(6, s.level.id + 1);
    next.unlocked_level = Math.max(previous.unlocked_level, next.level);
    next.endless_unlocked = previous.endless_unlocked || s.level.id === 6;
  }
  return next;
}
export async function persistRun(
  previous: GameProgress,
  s: GameState,
  adapter: { save: (p: GameProgress) => Promise<void> },
) {
  const next = progressAfterRun(previous, s);
  await adapter.save(next);
  return next;
}
