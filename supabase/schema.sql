-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Conversations table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'Nouvelle conversation',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.conversations enable row level security;

-- Conversations policies
create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Messages policies
create policy "Users can view messages of their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- Projects, Members, Tasks
-- ============================================================

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed')),
  deadline timestamptz,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.projects enable row level security;

-- Project members table (pivot)
create table public.project_members (
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now() not null,
  primary key (project_id, user_id)
);

alter table public.project_members enable row level security;

-- Tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('backlog', 'todo', 'in_progress', 'review', 'done')),
  assignee_id uuid references auth.users on delete set null,
  deadline timestamptz,
  position integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

-- Security definer helpers (bypass RLS to avoid infinite recursion)
create or replace function public.is_project_member(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
    and user_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.is_project_owner(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id
    and owner_id = auth.uid()
  );
$$ language sql security definer stable;

-- Projects RLS
create policy "Members can view projects"
  on public.projects for select
  using (auth.uid() = owner_id or public.is_project_member(id));

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Owner can update project"
  on public.projects for update
  using (auth.uid() = owner_id);

create policy "Owner can delete project"
  on public.projects for delete
  using (auth.uid() = owner_id);

-- Project members RLS
create policy "Members can view project members"
  on public.project_members for select
  using (public.is_project_member(project_id));

create policy "Owner can add members"
  on public.project_members for insert
  with check (
    public.is_project_owner(project_id)
    or (auth.uid() = user_id and role = 'owner')
  );

create policy "Owner can remove members"
  on public.project_members for delete
  using (public.is_project_owner(project_id));

-- Tasks RLS
create policy "Members can view tasks"
  on public.tasks for select
  using (public.is_project_member(project_id));

create policy "Members can create tasks"
  on public.tasks for insert
  with check (public.is_project_member(project_id));

create policy "Members can update tasks"
  on public.tasks for update
  using (public.is_project_member(project_id));

create policy "Members can delete tasks"
  on public.tasks for delete
  using (public.is_project_member(project_id));

-- Triggers
create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.update_updated_at();

-- Indexes
create index idx_project_members_user on public.project_members(user_id);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_assignee on public.tasks(assignee_id);
create index idx_tasks_status on public.tasks(status);
