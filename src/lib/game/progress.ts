import { supabase } from "@/integrations/supabase/client";

const KEY = "kse_spidey_player";

export type GameProgress = {
  level: number;
  unlocked_level: number;
  best_score: number;
  total_score: number;
  endless_best: number;
  endless_unlocked: boolean;
  display_name?: string | null;
};

export const EMPTY_PROGRESS: GameProgress = {
  level: 1,
  unlocked_level: 1,
  best_score: 0,
  total_score: 0,
  endless_best: 0,
  endless_unlocked: false,
  display_name: null,
};

export type LeaderboardEntry = {
  player_key: string;
  display_name: string | null;
  best_score: number;
  endless_best: number;
  total_score: number;
};

const COLS =
  "level,unlocked_level,best_score,total_score,endless_best,endless_unlocked,display_name";

/** Server-side highscore list (top players). */
export async function loadLeaderboard(
  mode: "best" | "endless" = "best",
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const column = mode === "endless" ? "endless_best" : "best_score";
  const { data } = await supabase
    .from("game_progress")
    .select("player_key,display_name,best_score,endless_best,total_score")
    .gt(column, 0)
    .order(column, { ascending: false })
    .limit(limit);
  return (data ?? []) as LeaderboardEntry[];
}

export function getPlayerKey(): string {
  if (typeof window === "undefined") return "ssr";
  let k = localStorage.getItem(KEY);
  if (!k) {
    k = crypto.randomUUID();
    localStorage.setItem(KEY, k);
  }
  return k;
}

export async function loadProgress(): Promise<GameProgress> {
  const player_key = getPlayerKey();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  if (userId) {
    const { data: byUser } = await supabase
      .from("game_progress")
      .select(COLS)
      .eq("user_id", userId)
      .maybeSingle();
    if (byUser) return byUser as GameProgress;
  }

  const { data } = await supabase
    .from("game_progress")
    .select(COLS)
    .eq("player_key", player_key)
    .maybeSingle();

  if (data) return data as GameProgress;

  await supabase
    .from("game_progress")
    .upsert({ player_key, user_id: userId, ...EMPTY_PROGRESS }, {
      onConflict: "player_key",
      ignoreDuplicates: true,
    });
  return { ...EMPTY_PROGRESS };
}

export async function saveProgress(p: GameProgress): Promise<void> {
  const player_key = getPlayerKey();
  const { data: auth } = await supabase.auth.getUser();
  await supabase
    .from("game_progress")
    .upsert({ player_key, user_id: auth.user?.id ?? null, ...p }, { onConflict: "player_key" });
}