-- Add XP and level columns to profiles
alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;

-- Function to calculate level from XP (each level requires more XP)
-- Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, Level 4: 450 XP, ...
-- Formula: xp_for_level(n) = 50 * n * (n - 1) / 2  → cumulative
create or replace function public.calculate_level(p_xp integer)
returns integer as $$
declare
  lvl integer := 1;
  threshold integer := 0;
begin
  loop
    threshold := threshold + lvl * 50;
    if p_xp < threshold then
      return lvl;
    end if;
    lvl := lvl + 1;
    if lvl > 100 then
      return 100;
    end if;
  end loop;
end;
$$ language plpgsql immutable;

-- Function to get XP needed for next level
create or replace function public.xp_for_next_level(p_current_level integer)
returns integer as $$
declare
  total integer := 0;
  i integer;
begin
  for i in 1..p_current_level loop
    total := total + i * 50;
  end loop;
  return total;
end;
$$ language plpgsql immutable;

-- Function to add XP to a user and recalculate level
create or replace function public.add_xp(p_user_id uuid, p_amount integer)
returns void as $$
declare
  new_xp integer;
begin
  update public.profiles
  set xp = xp + p_amount,
      level = public.calculate_level(xp + p_amount)
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Trigger: award XP when task status changes to 'done'
create or replace function public.on_task_completed()
returns trigger as $$
begin
  -- Task moved to done and was not done before
  if new.status = 'done' and (old.status is null or old.status <> 'done') then
    -- Award XP to assignee if set, otherwise to whoever updated it
    if new.assignee_id is not null then
      perform public.add_xp(new.assignee_id, 10);
    end if;
  end if;
  -- Task moved away from done (undo)
  if old.status = 'done' and new.status <> 'done' then
    if new.assignee_id is not null then
      perform public.add_xp(new.assignee_id, -10);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger task_completed_xp
  after update on public.tasks
  for each row execute procedure public.on_task_completed();

-- Trigger: award XP when project status changes to 'completed'
create or replace function public.on_project_completed()
returns trigger as $$
begin
  if new.status = 'completed' and (old.status is null or old.status <> 'completed') then
    -- Award XP to all project members
    perform public.add_xp(pm.user_id, 50)
    from public.project_members pm
    where pm.project_id = new.id;
  end if;
  -- Undo if project moved away from completed
  if old.status = 'completed' and new.status <> 'completed' then
    perform public.add_xp(pm.user_id, -50)
    from public.project_members pm
    where pm.project_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger project_completed_xp
  after update on public.projects
  for each row execute procedure public.on_project_completed();
