export type User = {
  id: string
  username: string
  email: string
  first_name?: string
  last_name?: string
  created_at?: string
  updated_at?: string
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  user: User
}

export type Workspace = {
  id: string
  name: string
  description?: string
  is_public?: boolean
  owner_id?: string
  created_at?: string
  updated_at?: string
  permission_level?: string
  task_count?: number
  member_count?: number
}

export type Task = {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  workspace_id: string
  created_by?: string
  assigned_agent_id?: string
  parent_task_id?: string
  progress?: number
  requirements?: unknown
  context?: unknown
  metadata?: unknown
  result?: unknown
  created_at: string
  updated_at?: string
  subtasks?: Task[]
}

export type Agent = {
  id: string
  name: string
  description?: string
  status: string
  current_load: number
  max_concurrent_tasks: number
  last_heartbeat?: string
  created_at: string
  updated_at: string
  capabilities?: Array<{
    name: string
    description: string
    version: string
    parameters?: unknown
  }>
  endpoints?: {
    task_execution?: string
    health_check?: string
    status_update?: string
  }
  limits?: {
    max_concurrent_tasks?: number
    max_execution_time?: number
    max_memory_usage?: number
    rate_limit_per_minute?: number
  }
  metadata?: unknown
}

export type Workflow = {
  id: string
  name: string
  description?: string
  workspace_id: string
  created_by: string
  is_active: boolean
  definition: unknown
  created_at: string
  updated_at?: string
}

export type WorkflowExecution = {
  id: string
  workflow_id: string
  status: string
  input?: unknown
  output?: unknown
  error?: string
  started_at: string
  completed_at?: string
  task_id?: string
}

export type Message = {
  id: string
  message_type: string
  content: string
  is_read: boolean
  metadata?: unknown
  created_at: string
}

export type Permission = {
  id: string
  user_id: string
  workspace_id: string
  permission_level: string
  granted_by: string
  granted_at: string
  expires_at?: string
}

export type ApiResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}
