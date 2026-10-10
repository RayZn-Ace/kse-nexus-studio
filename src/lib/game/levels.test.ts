import "./bun-test.d.ts";
import { describe, expect, test } from "bun:test";
import { ENDLESS_LEVEL, LEVELS, isLevelCleared } from "./levels";
import {
  advanceClock,
  beginPointer,
  createClock,
  createGame,
  damageEnemy,
  endPointer,
  MAX_PARTICLES,
  MAX_WEBS,
  persistRun,
  plannedWave,
  pointerPosition,
  reachPlayer,
  resetClock,
  shoot,
  spawnEnemy,
  stepGame,
  waveInterval,
} from "./engine";
import type { GameProgress } from "./progress";
const bossLevel = LEVELS.find((l) => l.boss);
if (!bossLevel) throw new Error("Missing boss stage");
const BOSS = bossLevel;
const previous: GameProgress = {
  level: 1,
  unlocked_level: 1,
  best_score: 10,
  total_score: 20,
  endless_best: 5,
  endless_unlocked: false,
  display_name: "Local test",
};

describe("real shared boss callbacks", () => {
  test("grunt and runner kills do not clear living boss", () => {
    const s = createGame(BOSS);
    spawnEnemy(s, "boss", 1);
    damageEnemy(s, spawnEnemy(s, "grunt", 0));
    damageEnemy(s, spawnEnemy(s, "runner", 2));
    expect(s.kills).toBe(2);
    expect(s.outcome).toBe("playing");
    expect(s.bossDefeated).toBe(false);
  });
  test("17 hits do not clear; 18 damage hits clear", () => {
    const s = createGame(BOSS);
    s.bossOpen = true;
    const b = spawnEnemy(s, "boss", 1);
    for (let i = 0; i < 17; i++) damageEnemy(s, b);
    expect(b.hp).toBe(1);
    expect(s.running).toBe(true);
    damageEnemy(s, b);
    expect(s.bossDefeated).toBe(true);
    expect(s.outcome).toBe("cleared");
  });
  test("shield rejects damage and has announced 3-second window", () => {
    const s = createGame(BOSS);
    stepGame(s);
    const b = s.villains[0];
    damageEnemy(s, b);
    expect(b.hp).toBe(18);
    for (let i = 1; i < 180; i++) stepGame(s);
    expect(s.elapsed).toBe(3);
    expect(s.bossOpen).toBe(true);
    expect(s.message?.text.includes("drei Sekunden")).toBe(true);
    damageEnemy(s, b);
    expect(b.hp).toBe(17);
  });
  test("boss breakthrough is failure even with more than three lives", () => {
    const s = createGame(BOSS);
    s.lives = 10;
    const b = spawnEnemy(s, "boss", 1);
    reachPlayer(s, b);
    expect(b.hit).toBe(true);
    expect(s.lives).toBe(0);
    expect(s.bossDefeated).toBe(false);
    expect(s.outcome).toBe("failed");
  });
  test("multiple kills, ordinary breakthrough, boss alive: no clear", () => {
    const s = createGame(BOSS);
    const b = spawnEnemy(s, "boss", 1);
    s.bossOpen = true;
    for (let i = 0; i < 5; i++) damageEnemy(s, spawnEnemy(s, "grunt", 0));
    reachPlayer(s, spawnEnemy(s, "runner", 2));
    for (let i = 0; i < 10; i++) damageEnemy(s, b);
    expect(s.lives).toBe(2);
    expect(s.outcome).toBe("playing");
  });
  test("restart resets every timer, effect, aim, pointer and boss state", () => {
    let s = createGame(BOSS);
    s.bossOpen = true;
    const b = spawnEnemy(s, "boss", 1);
    beginPointer(s, 9, 200, 200);
    for (let i = 0; i < 18; i++) damageEnemy(s, b);
    s.tick = 500;
    s.elapsed = 8;
    s.beatsDone.add(1);
    s.message = { who: "KayI", text: "old" };
    s = createGame(BOSS);
    expect(s.tick).toBe(0);
    expect(s.elapsed).toBe(0);
    expect(s.spawnTimer).toBe(0.8);
    expect(s.cooldown).toBe(0);
    expect(s.villains.length + s.webs.length + s.particles.length).toBe(0);
    expect(s.aim.active).toBe(false);
    expect(s.aim.x).toBe(360);
    expect(s.pointerId).toBe(null);
    expect(s.firing).toBe(false);
    expect(s.bossSpawned).toBe(false);
    expect(s.bossDefeated).toBe(false);
    expect(s.bossPhase).toBe(0);
    expect(s.bossOpen).toBe(false);
    expect(s.idCounter).toBe(1);
    expect(s.beatsDone.size).toBe(0);
    expect(s.message).toBe(null);
    expect(s.messageUntil).toBe(0);
  });
});
describe("progression and planned difficulty", () => {
  test("original IDs and targets preserved", () => {
    expect(LEVELS.map((l) => l.id).join(",")).toBe("1,2,3,4,5,6");
    expect(LEVELS.map((l) => l.target).join(",")).toBe("8,12,14,18,22,1");
  });
  test("ordinary stage clears at 8, not 7", () => {
    const s = createGame(LEVELS[0]);
    for (let i = 0; i < 7; i++) damageEnemy(s, spawnEnemy(s, "grunt", 0));
    expect(s.outcome).toBe("playing");
    damageEnemy(s, spawnEnemy(s, "grunt", 0));
    expect(s.outcome).toBe("cleared");
  });
  test("endless never clears and grows continuously", () => {
    expect(isLevelCleared(ENDLESS_LEVEL, 100000, false)).toBe(false);
    const s = createGame(ENDLESS_LEVEL, true);
    for (let i = 0; i < 600; i++) {
      s.lives = 100;
      stepGame(s);
    }
    expect(s.ramp).toBe(1.21);
    expect(s.outcome).toBe("playing");
  });
  test("combinations introduce runners, tanks and coordinated waves", () => {
    expect(plannedWave(LEVELS[0], 0)[0].kind).toBe("grunt");
    expect(plannedWave(LEVELS[1], 1)[0].kind).toBe("runner");
    expect(plannedWave(LEVELS[2], 0)[0].kind).toBe("tank");
    expect(plannedWave(LEVELS[2], 1)[0].kind).toBe("runner");
    expect(
      plannedWave(LEVELS[3], 0)
        .map((e) => e.kind)
        .join(","),
    ).toBe("runner,tank,grunt");
    expect(plannedWave(LEVELS[4], 0).length).toBe(2);
    expect(waveInterval(BOSS)).toBe(2.8);
  });
  test("runner warns before actual lane switch", () => {
    const s = createGame(LEVELS[1]);
    const v = spawnEnemy(s, "runner", 0);
    for (let i = 0; i < 90; i++) stepGame(s);
    expect(v.warning > 0).toBe(true);
    expect(v.lane).toBe(0);
    for (let i = 0; i < 40; i++) stepGame(s);
    expect(v.lane).toBe(1);
    expect(v.switched).toBe(true);
  });
});
describe("fixed timestep, tab switch and bounded effects", () => {
  test("30/60/144 Hz all produce exactly 600 ticks in 10 seconds", () => {
    for (const hz of [30, 60, 144]) {
      const clock = createClock();
      const s = createGame(ENDLESS_LEVEL, true);
      s.lives = 100;
      for (let frame = 0; frame <= hz * 10; frame++)
        advanceClock(clock, (frame * 1000) / hz, () => stepGame(s));
      expect(s.tick).toBe(600);
      expect(s.elapsed).toBe(10);
      expect(s.ramp).toBe(1.21);
    }
  });
  test("background gap and visibility reset cause no time jump", () => {
    const c = createClock();
    let steps = 0;
    advanceClock(c, 0, () => steps++);
    advanceClock(c, 1000, () => steps++);
    expect(steps).toBe(0);
    resetClock(c);
    advanceClock(c, 60000, () => steps++);
    expect(steps).toBe(0);
    advanceClock(c, 60000 + 1000 / 60, () => steps++);
    expect(steps).toBe(1);
  });
  test("web and particle arrays have fixed caps", () => {
    const s = createGame(ENDLESS_LEVEL, true);
    for (let i = 0; i < 100; i++) {
      shoot(s, 200, 200);
      damageEnemy(s, spawnEnemy(s, "grunt", 1));
    }
    expect(s.webs.length).toBe(MAX_WEBS);
    expect(s.particles.length).toBe(MAX_PARTICLES);
  });
});
describe("desktop and touch share actual pointer callbacks", () => {
  test("scaled touch coordinate, capture identity and cancellation", () => {
    const p = pointerPosition(190, 140, { left: 10, top: 20, width: 360, height: 240 });
    expect(p?.x).toBe(360);
    expect(p?.y).toBe(240);
    const s = createGame();
    expect(beginPointer(s, 21, p?.x ?? 0, p?.y ?? 0)).toBe(true);
    expect(beginPointer(s, 22, 0, 0)).toBe(false);
    endPointer(s, 22);
    expect(s.firing).toBe(true);
    endPointer(s, 21);
    expect(s.pointerId).toBe(null);
    expect(s.firing).toBe(false);
    expect(s.aim.active).toBe(false);
  });
  test("mouse aiming and hold shoot share timestep cooldown", () => {
    const s = createGame();
    beginPointer(s, 1, 200, 200);
    expect(s.webs.length).toBe(1);
    for (let i = 0; i < 8; i++) stepGame(s);
    expect(s.webs.length).toBe(1);
    for (let i = 0; i < 6; i++) stepGame(s);
    expect(s.cooldown > 0).toBe(true);
    endPointer(s, 1);
    const count = s.webs.length;
    stepGame(s);
    expect(s.webs.length).toBe(count);
  });
});
describe("unchanged save shape via in-memory adapter", () => {
  test("clearing IDs 1–6 unlocks only next stage, capped at 6", async () => {
    for (const level of LEVELS) {
      const s = createGame(level);
      s.outcome = "cleared";
      s.score = 200;
      let saved: GameProgress | null = null;
      const next = await persistRun(previous, s, {
        save: async (p) => {
          saved = { ...p };
        },
      });
      expect(next.level).toBe(Math.min(6, level.id + 1));
      expect(next.unlocked_level).toBe(Math.min(6, level.id + 1));
      expect(next.best_score).toBe(200);
      expect(next.total_score).toBe(220);
      expect(JSON.stringify(saved)).toBe(JSON.stringify(next));
    }
  });
  test("failure preserves progress and endless best updates independently", async () => {
    const s = createGame(ENDLESS_LEVEL, true);
    s.outcome = "failed";
    s.score = 395;
    const next = await persistRun(previous, s, { save: async () => {} });
    expect(next.level).toBe(1);
    expect(next.unlocked_level).toBe(1);
    expect(next.endless_best).toBe(395);
    expect(next.display_name).toBe("Local test");
    expect(Object.keys(next).sort().join(",")).toBe(Object.keys(previous).sort().join(","));
  });
});

test("fast repeated clicks cannot bypass fire cooldown", () => {
  const s = createGame();
  beginPointer(s, 1, 200, 200);
  endPointer(s, 1);
  beginPointer(s, 2, 200, 200);
  expect(s.webs.length).toBe(1);
  expect(s.cooldown).toBe(0.22);
});
test("boss phase 2 repositions and phase 3 adds a second attacker", () => {
  const s = createGame(BOSS);
  stepGame(s);
  const b = s.villains[0];
  b.hp = 12;
  for (let i = 1; i < 180; i++) stepGame(s);
  expect(s.bossPhase).toBe(2);
  expect(b.lane).toBe(0);
  b.hp = 6;
  s.spawnTimer = 0;
  const count = s.villains.length;
  stepGame(s);
  expect(s.bossPhase).toBe(3);
  expect(s.villains.length - count).toBe(2);
});

test("phase 1 to 2 during open shield waits for the next fully warned opening", () => {
  const s = createGame(BOSS);
  for (let i = 0; i < 240; i++) stepGame(s);
  const b = s.villains[0];
  expect(s.bossOpen).toBe(true);
  expect(b.lane).toBe(1);
  for (let i = 0; i < 6; i++) damageEnemy(s, b);
  expect(b.hp).toBe(12);
  stepGame(s);
  expect(s.bossPhase).toBe(2);
  expect(b.lane).toBe(1);
  expect(b.warningTargetLane).toBe(null);
  while (s.tick < 498) stepGame(s);
  expect(s.elapsed).toBe(8.3);
  expect(s.bossOpen).toBe(false);
  expect(b.warning > 0).toBe(true);
  expect(b.warningTargetLane).toBe(2);
  expect(b.lane).toBe(1);
  while (s.tick < 539) stepGame(s);
  expect(b.lane).toBe(1);
  expect(b.warningTargetLane).toBe(2);
  stepGame(s);
  expect(s.elapsed).toBe(9);
  expect(s.bossOpen).toBe(true);
  expect(b.lane).toBe(2);
  expect(b.warning).toBe(0);
  expect(b.warningTargetLane).toBe(null);
});
