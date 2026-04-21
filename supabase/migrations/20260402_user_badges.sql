-- Persistent badge tracking with unlock dates
CREATE TABLE public.user_badges (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  badge_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all badges" ON public.user_badges
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to sync badges: checks conditions and inserts any newly unlocked badges
CREATE OR REPLACE FUNCTION public.sync_user_badges(p_user_id uuid)
RETURNS SETOF public.user_badges AS $$
DECLARE
  v_tasks_done integer;
  v_projects_done integer;
  v_level integer;
BEGIN
  SELECT count(*) INTO v_tasks_done
  FROM public.tasks
  WHERE assignee_id = p_user_id AND status = 'done';

  SELECT count(*) INTO v_projects_done
  FROM public.projects p
  JOIN public.project_members pm ON pm.project_id = p.id
  WHERE pm.user_id = p_user_id AND p.status = 'completed';

  SELECT level INTO v_level
  FROM public.profiles
  WHERE id = p_user_id;

  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT p_user_id, badge_id FROM (VALUES
    ('first_task'),
    ('ten_tasks'),
    ('first_project'),
    ('level_5'),
    ('level_10')
  ) AS b(badge_id)
  WHERE
    (badge_id = 'first_task' AND v_tasks_done >= 1) OR
    (badge_id = 'ten_tasks' AND v_tasks_done >= 10) OR
    (badge_id = 'first_project' AND v_projects_done >= 1) OR
    (badge_id = 'level_5' AND v_level >= 5) OR
    (badge_id = 'level_10' AND v_level >= 10)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN QUERY SELECT * FROM public.user_badges WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
