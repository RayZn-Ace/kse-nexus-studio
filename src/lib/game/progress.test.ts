import "./bun-test.d.ts";
import { expect, mock, test } from "bun:test";
import type { GameProgress } from "./progress";
const storage = new Map<string, string>();
Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  },
  configurable: true,
});
let row: GameProgress | null = null;
let payload: Record<string, unknown> | null = null;
let conflict: unknown = null;
const calls: string[] = [];
const client = {
  auth: { getUser: async () => ({ data: { user: null } }) },
  from: (table: string) => {
    calls.push(table);
    const chain = {
      select: (_cols: string) => chain,
      eq: (_col: string, _value: string) => chain,
      maybeSingle: async () => ({ data: row }),
      upsert: async (p: Record<string, unknown>, options: unknown) => {
        payload = p;
        conflict = options;
        row = { ...p } as GameProgress;
        return { error: null };
      },
    };
    return chain;
  },
};
mock.module("@/integrations/supabase/client", () => ({ supabase: client }));
const adapter = await import("./progress");
test("unchanged adapter loads and saves using original player key and columns without network", async () => {
  storage.set("kse_spidey_player", "stable-local-test-key");
  const loaded = await adapter.loadProgress();
  expect(loaded.level).toBe(1);
  const p = {
    ...loaded,
    level: 4,
    unlocked_level: 4,
    best_score: 120,
    total_score: 240,
    display_name: "Test only",
  };
  await adapter.saveProgress(p);
  const readback = await adapter.loadProgress();
  expect(readback.level).toBe(4);
  expect(readback.best_score).toBe(120);
  expect(readback.total_score).toBe(240);
  expect(adapter.getPlayerKey()).toBe("stable-local-test-key");
  expect((payload as Record<string, unknown> | null)?.player_key).toBe("stable-local-test-key");
  expect((payload as Record<string, unknown> | null)?.user_id).toBe(null);
  expect(JSON.stringify(conflict)).toBe('{"onConflict":"player_key"}');
  expect(calls.every((t) => t === "game_progress")).toBe(true);
});
