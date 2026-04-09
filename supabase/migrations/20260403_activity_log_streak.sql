-- ============================================================
-- Gamification V2: Streaks, XP Multiplier, Easter Egg Badges
-- ============================================================

-- 1. Activity log table (one row per user per day)
CREATE TABLE IF NOT EXISTS public.activity_log (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  actions_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, activity_date)
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view activity logs' AND tablename = 'activity_log') THEN
    CREATE POLICY "Authenticated users can view activity logs" ON public.activity_log FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own activity' AND tablename = 'activity_log') THEN
    CREATE POLICY "Users can insert own activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own activity' AND tablename = 'activity_log') THEN
    CREATE POLICY "Users can update own activity" ON public.activity_log FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Upsert activity for a user (called from triggers)
CREATE OR REPLACE FUNCTION public.log_activity(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, activity_date, actions_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET actions_count = public.activity_log.actions_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Calculate consecutive streak days
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_found BOOLEAN;
BEGIN
  -- Check if today has activity
  SELECT EXISTS(
    SELECT 1 FROM public.activity_log
    WHERE user_id = p_user_id AND activity_date = v_check_date
  ) INTO v_found;

  -- If no activity today, start from yesterday (timezone grace)
  IF NOT v_found THEN
    v_check_date := v_check_date - 1;
    SELECT EXISTS(
      SELECT 1 FROM public.activity_log
      WHERE user_id = p_user_id AND activity_date = v_check_date
    ) INTO v_found;
    IF NOT v_found THEN
      RETURN 0;
    END IF;
  END IF;

  -- Walk backward counting consecutive days
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.activity_log
      WHERE user_id = p_user_id AND activity_date = v_check_date
    ) INTO v_found;
    EXIT WHEN NOT v_found;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Auto-log activity on any task insert/update
CREATE OR REPLACE FUNCTION public.on_task_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.assignee_id, auth.uid());
  IF v_user_id IS NOT NULL THEN
    PERFORM public.log_activity(v_user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_activity_log ON public.tasks;
CREATE TRIGGER task_activity_log
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.on_task_activity();

-- 5. Streak multiplier (progressive doux)
CREATE OR REPLACE FUNCTION public.get_streak_multiplier(p_streak INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF p_streak >= 14 THEN RETURN 2.0;
  ELSIF p_streak >= 7 THEN RETURN 1.5;
  ELSIF p_streak >= 3 THEN RETURN 1.2;
  ELSE RETURN 1.0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Replace on_task_completed to use streak multiplier
CREATE OR REPLACE FUNCTION public.on_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_streak INTEGER;
  v_multiplier NUMERIC;
  v_xp INTEGER;
BEGIN
  -- Task moved to done
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status <> 'done') THEN
    IF NEW.assignee_id IS NOT NULL THEN
      v_streak := public.get_user_streak(NEW.assignee_id);
      v_multiplier := public.get_streak_multiplier(v_streak);
      v_xp := ROUND(10 * v_multiplier);
      PERFORM public.add_xp(NEW.assignee_id, v_xp);
    END IF;
  END IF;
  -- Undo: flat -10 XP (no retroactive multiplier tracking)
  IF OLD.status = 'done' AND NEW.status <> 'done' THEN
    IF NEW.assignee_id IS NOT NULL THEN
      PERFORM public.add_xp(NEW.assignee_id, -10);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Easter egg badge check functions
CREATE OR REPLACE FUNCTION public.check_night_owl(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.tasks
    WHERE assignee_id = p_user_id
      AND status = 'done'
      AND EXTRACT(HOUR FROM updated_at) >= 2
      AND EXTRACT(HOUR FROM updated_at) < 5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_ghost_buster(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.tasks
    WHERE assignee_id = p_user_id
      AND status = 'done'
      AND created_at < NOW() - INTERVAL '90 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Replace sync_user_badges to handle all 14 badges
CREATE OR REPLACE FUNCTION public.sync_user_badges(p_user_id UUID)
RETURNS SETOF public.user_badges AS $$
DECLARE
  v_tasks_done INTEGER;
  v_projects_done INTEGER;
  v_projects_created INTEGER;
  v_members_invited INTEGER;
  v_level INTEGER;
  v_xp INTEGER;
  v_streak INTEGER;
  v_night_owl BOOLEAN;
  v_ghost_buster BOOLEAN;
BEGIN
  SELECT count(*) INTO v_tasks_done
  FROM public.tasks
  WHERE assignee_id = p_user_id AND status = 'done';

  SELECT count(*) INTO v_projects_done
  FROM public.projects p
  JOIN public.project_members pm ON pm.project_id = p.id
  WHERE pm.user_id = p_user_id AND p.status = 'completed';

  SELECT count(*) INTO v_projects_created
  FROM public.projects
  WHERE owner_id = p_user_id;

  SELECT count(*) INTO v_members_invited
  FROM public.project_members pm
  JOIN public.projects p ON p.id = pm.project_id
  WHERE p.owner_id = p_user_id AND pm.role = 'member';

  SELECT level, xp INTO v_level, v_xp
  FROM public.profiles
  WHERE id = p_user_id;

  v_streak := public.get_user_streak(p_user_id);
  v_night_owl := public.check_night_owl(p_user_id);
  v_ghost_buster := public.check_ghost_buster(p_user_id);

  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT p_user_id, badge_id FROM (VALUES
    ('first_task'),
    ('ten_tasks'),
    ('fifty_tasks'),
    ('first_project'),
    ('three_projects_created'),
    ('first_invite'),
    ('five_invites'),
    ('level_5'),
    ('level_10'),
    ('xp_500'),
    ('streak_3'),
    ('streak_7'),
    ('night_owl'),
    ('ghost_buster')
  ) AS b(badge_id)
  WHERE
    (badge_id = 'first_task' AND v_tasks_done >= 1) OR
    (badge_id = 'ten_tasks' AND v_tasks_done >= 10) OR
    (badge_id = 'fifty_tasks' AND v_tasks_done >= 50) OR
    (badge_id = 'first_project' AND v_projects_done >= 1) OR
    (badge_id = 'three_projects_created' AND v_projects_created >= 3) OR
    (badge_id = 'first_invite' AND v_members_invited >= 1) OR
    (badge_id = 'five_invites' AND v_members_invited >= 5) OR
    (badge_id = 'level_5' AND v_level >= 5) OR
    (badge_id = 'level_10' AND v_level >= 10) OR
    (badge_id = 'xp_500' AND v_xp >= 500) OR
    (badge_id = 'streak_3' AND v_streak >= 3) OR
    (badge_id = 'streak_7' AND v_streak >= 7) OR
    (badge_id = 'night_owl' AND v_night_owl) OR
    (badge_id = 'ghost_buster' AND v_ghost_buster)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN QUERY SELECT * FROM public.user_badges WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
