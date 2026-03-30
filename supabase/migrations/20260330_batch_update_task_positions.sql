-- Batch update task positions in a single call
-- Accepts a JSON array of {task_id, new_position} objects
create or replace function public.batch_update_task_positions(
  updates jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(updates)
  loop
    update public.tasks
    set position = (item ->> 'new_position')::int,
        updated_at = now()
    where id = (item ->> 'task_id')::uuid;
  end loop;
end;
$$;
