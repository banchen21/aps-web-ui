const API_BASE_URL = 'http://localhost:8000'

export interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  is_public: boolean
  context?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WorkspaceResponse extends Workspace {
  permissions: WorkspacePermission[]
  document_count: number
  active_task_count: number
}

export interface WorkspacePermission {
  id: string
  workspace_id: string
  user_id: string
  permission_type: string
  granted_at: string
}

export interface CreateWorkspaceRequest {
  name: string
  description?: string
  is_public?: boolean
  context?: Record<string, any>
  metadata?: Record<string, any>
}

export interface UpdateWorkspaceRequest {
  name?: string
  description?: string
  is_public?: boolean
  context?: Record<string, any>
  metadata?: Record<string, any>
}

export interface GrantPermissionRequest {
  user_id: string
  permission_type: string
}

const getAuthHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
})

export const workspaceService = {
  // 获取工作空间列表
  getWorkspaces: () =>
    fetch(`${API_BASE_URL}/workspaces`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 获取单个工作空间
  getWorkspace: (workspaceId: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 创建工作空间
  createWorkspace: (request: CreateWorkspaceRequest) =>
    fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    }),

  // 更新工作空间
  updateWorkspace: (workspaceId: string, request: UpdateWorkspaceRequest) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    }),

  // 删除工作空间
  deleteWorkspace: (workspaceId: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }),

  // 获取工作空间权限列表
  getPermissions: (workspaceId: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/permissions`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 授予权限
  grantPermission: (workspaceId: string, request: GrantPermissionRequest) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/permissions`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    }),

  // 撤销权限
  revokePermission: (workspaceId: string, permissionId: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }),

  // 获取工作空间文档列表
  getDocuments: (workspaceId: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/documents`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 获取工作空间工具列表
  getTools: (workspaceId: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/tools`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 获取工作空间统计信息
  getStats: (workspaceId: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/stats`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),
}
