export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planned' | 'in_progress' | 'completed';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type ProjectRole = 'owner' | 'member';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectRole;
  joined_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee_id: string | null;
  deadline: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithStats extends Project {
  task_count: number;
  done_count: number;
  overdue_count: number;
  members: (ProjectMember & { profile: Profile })[];
}

export interface ProjectDetail extends Project {
  task_count: number;
  done_count: number;
  overdue_count: number;
  members: (ProjectMember & { profile: Profile })[];
  tasks: (Task & { assignee: Profile | null })[];
}
