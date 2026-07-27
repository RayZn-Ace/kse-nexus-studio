CREATE TABLE public.game_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_key text NOT NULL UNIQUE,
  user_id uuid,
  display_name text,
  level integer NOT NULL DEFAULT 1,
  unlocked_level integer NOT NULL DEFAULT 1,
  best_score integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  endless_best integer NOT NULL DEFAULT 0,
  endless_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.game_progress TO anon;
GRANT SELECT, INSERT, UPDATE ON public.game_progress TO authenticated;
GRANT ALL ON public.game_progress TO service_role;

ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_progress_public_read" ON public.game_progress FOR SELECT USING (true);
CREATE POLICY "game_progress_public_insert" ON public.game_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "game_progress_public_update" ON public.game_progress FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER game_progress_touch BEFORE UPDATE ON public.game_progress
FOR EACH ROW EXECUTE FUNCTION public.touch_mission_config();