import { describe, expect, test } from "bun:test";
import {
  ENDLESS_LEVEL,
  LEVELS,
  VILLAINS,
  isLevelCleared,
  type Level,
  type VillainKind,
} from "./levels";

// Minimal mirror of SpideyGame's damage/reach bookkeeping.
type V = { kind: VillainKind; hp: number; hit: boolean };
function makeState(level: Level) {
  return { level, kills: 0, lives: level.lives, bossDefeated: false };
}
function damage(s: ReturnType<typeof makeState>, v: V) {
  v.hp -= 1;
  if (v.hp <= 0) {
    v.hit = true;
    if (v.kind === "boss") s.bossDefeated = true;
    s.kills += 1;
  }
}
function reach(s: ReturnType<typeof makeState>, v: V) {
  if (v.hit) return;
  v.hit = true;
  s.lives -= v.kind === "boss" ? 3 : 1;
}
const spawn = (kind: VillainKind): V => ({ kind, hp: VILLAINS[kind].hp, hit: false });
const cleared = (s: ReturnType<typeof makeState>) =>
  isLevelCleared(s.level, s.kills, s.bossDefeated);
const BOSS = LEVELS.find((l) => l.boss)!;

describe("boss stage clearance", () => {
  test("grunt/runner kills while boss alive do not clear", () => {
    const s = makeState(BOSS);
    spawn("boss");
    damage(s, spawn("grunt"));
    damage(s, spawn("runner"));
    expect(s.kills).toBe(2);
    expect(cleared(s)).toBe(false);
  });
  test("17 boss hits do not clear, 18 do", () => {
    const s = makeState(BOSS);
    const boss = spawn("boss");
    for (let i = 0; i < 17; i++) damage(s, boss);
    expect(cleared(s)).toBe(false);
    damage(s, boss);
    expect(cleared(s)).toBe(true);
  });
  test("boss reaching player marks hit but does not clear and costs 3 lives", () => {
    const s = makeState(BOSS);
    const boss = spawn("boss");
    reach(s, boss);
    expect(boss.hit).toBe(true);
    expect(s.lives).toBe(0);
    expect(cleared(s)).toBe(false);
  });
  test("multiple enemies killed + reached, boss alive, no clear", () => {
    const s = makeState(BOSS);
    const boss = spawn("boss");
    for (let i = 0; i < 5; i++) damage(s, spawn("grunt"));
    reach(s, spawn("runner"));
    for (let i = 0; i < 10; i++) damage(s, boss);
    expect(cleared(s)).toBe(false);
  });
  test("restart resets boss defeat", () => {
    let s = makeState(BOSS);
    const boss = spawn("boss");
    for (let i = 0; i < 18; i++) damage(s, boss);
    expect(cleared(s)).toBe(true);
    s = makeState(BOSS); // mirrors startLevel reset
    damage(s, spawn("grunt"));
    expect(cleared(s)).toBe(false);
  });
});

describe("non-boss stages unchanged", () => {
  test("ordinary stage clears at kill target", () => {
    const l = LEVELS[0];
    expect(l.target).toBe(8);
    expect(isLevelCleared(l, 7, false)).toBe(false);
    expect(isLevelCleared(l, 8, false)).toBe(true);
  });
  test("endless never clears", () => {
    expect(isLevelCleared(ENDLESS_LEVEL, 100000, false)).toBe(false);
  });
});
