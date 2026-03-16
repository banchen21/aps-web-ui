const API_BASE_URL = 'http://localhost:8000/api/v1'

export interface Workspace {
  id: number
  name: string
  description?: string
  owner_username: string
  status: string
  created_at: string
}

export interface WorkspaceResponse extends Workspace {
  agent_count: number
  task_count: number
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
  owner_username: string
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
    fetch(`${API_BASE_URL}/workspace`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 创建工作空间
  createWorkspace: (request: CreateWorkspaceRequest) =>
    fetch(`${API_BASE_URL}/workspace`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    }),

  // 更新工作空间
  updateWorkspace: (workspaceName: string, request: UpdateWorkspaceRequest) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    }),

  // 删除工作空间
  deleteWorkspace: (workspaceName: string) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }),

  // 获取工作空间权限列表
  getPermissions: (workspaceName: string) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}/permissions`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 授予权限
  grantPermission: (workspaceName: string, request: GrantPermissionRequest) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}/permissions`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    }),

  // 撤销权限
  revokePermission: (workspaceName: string, permissionId: string) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }),

  // 获取工作空间文档列表
  getDocuments: (workspaceName: string) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}/documents`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 获取工作空间工具列表
  getTools: (workspaceName: string) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}/tools`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),

  // 获取工作空间统计信息
  getStats: (workspaceName: string) =>
    fetch(`${API_BASE_URL}/workspace/${workspaceName}/stats`, {
      method: 'GET',
      headers: getAuthHeader(),
    }),
}
