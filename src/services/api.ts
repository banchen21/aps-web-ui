import type { User, Workspace, Task, Agent, Workflow, WorkflowExecution, Message, Permission, ApiResult, AuthResponse } from '../types'

class ApiService {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string = 'http://127.0.0.1:8000', token: string = '') {
    this.baseUrl = baseUrl
    this.token = token
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    path: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<ApiResult<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const options: RequestInit = {
        method,
        headers,
      }

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${this.baseUrl}${path}`, options)
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || data.message || 'Request failed',
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // ===== Auth API =====
  async register(username: string, email: string, password: string, firstName?: string, lastName?: string) {
    return this.request<AuthResponse>('/auth/register', 'POST', {
      username,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    })
  }

  async login(username: string, password: string) {
    return this.request<AuthResponse>('/auth/login', 'POST', {
      username,
      password,
    })
  }

  async refreshToken(refreshToken: string) {
    return this.request<AuthResponse>('/auth/refresh', 'POST', {
      refresh_token: refreshToken,
    })
  }

  async logout() {
    return this.request('/auth/logout', 'POST')
  }

  async getMe() {
    return this.request<User>('/auth/me')
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', 'POST', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  }

  // ===== Workspace API =====
  async createWorkspace(name: string, description?: string, isPublic: boolean = false, context?: unknown, metadata?: unknown) {
    return this.request<Workspace>('/workspaces', 'POST', {
      name,
      description,
      is_public: isPublic,
      context,
      metadata,
    })
  }

  async getWorkspaces(page: number = 1, pageSize: number = 20) {
    return this.request<Workspace[]>(`/workspaces?page=${page}&page_size=${pageSize}`)
  }

  async getWorkspace(workspaceId: string) {
    return this.request<Workspace>(`/workspaces/${workspaceId}`)
  }

  async updateWorkspace(workspaceId: string, name?: string, description?: string, isPublic?: boolean) {
    return this.request<Workspace>(`/workspaces/${workspaceId}`, 'PUT', {
      name,
      description,
      is_public: isPublic,
    })
  }

  async deleteWorkspace(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}`, 'DELETE')
  }

  async getWorkspacePermissions(workspaceId: string) {
    return this.request<Permission[]>(`/workspaces/${workspaceId}/permissions`)
  }

  async grantPermission(workspaceId: string, userId: string, permissionLevel: string, expiresAt?: string) {
    return this.request<Permission>(`/workspaces/${workspaceId}/permissions`, 'POST', {
      user_id: userId,
      permission_level: permissionLevel,
      expires_at: expiresAt,
    })
  }

  async revokePermission(workspaceId: string, permissionId: string) {
    return this.request(`/workspaces/${workspaceId}/permissions/${permissionId}`, 'DELETE')
  }

  async getWorkspaceDocuments(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}/documents`)
  }

  async getWorkspaceTools(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}/tools`)
  }

  async getWorkspaceStats(workspaceId: string) {
    return this.request(`/workspaces/${workspaceId}/stats`)
  }

  // ===== Task API =====
  async createTask(
    title: string,
    description: string,
    priority: string,
    workspaceId: string,
    requirements?: unknown,
    context?: unknown,
    metadata?: unknown
  ) {
    return this.request<Task>('/tasks', 'POST', {
      title,
      description,
      priority,
      workspace_id: workspaceId,
      requirements: requirements || {},
      context: context || {},
      metadata: metadata || {},
    })
  }

  async getTasks(params?: {
    workspace_id?: string
    status?: string
    priority?: string
    page?: number
    page_size?: number
  }) {
    const query = new URLSearchParams()
    if (params?.workspace_id) query.append('workspace_id', params.workspace_id)
    if (params?.status) query.append('status', params.status)
    if (params?.priority) query.append('priority', params.priority)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.page_size) query.append('page_size', params.page_size.toString())

    const queryString = query.toString()
    return this.request<Task[]>(`/tasks${queryString ? '?' + queryString : ''}`)
  }

  async getTask(taskId: string) {
    return this.request<Task>(`/tasks/${taskId}`)
  }

  async updateTask(taskId: string, updates: {
    title?: string
    description?: string
    status?: string
    priority?: string
    progress?: number
  }) {
    return this.request<Task>(`/tasks/${taskId}`, 'PUT', updates)
  }

  async deleteTask(taskId: string) {
    return this.request(`/tasks/${taskId}`, 'DELETE')
  }

  async updateTaskStatus(taskId: string, status: string, progress?: number, currentStep?: string) {
    return this.request<Task>(`/tasks/${taskId}/status`, 'PUT', {
      status,
      progress,
      current_step: currentStep,
    })
  }

  async decomposeTask(taskId: string, strategy?: string, maxDepth?: number, constraints?: unknown) {
    return this.request(`/tasks/${taskId}/decompose`, 'POST', {
      strategy: strategy || 'Hierarchical',
      max_depth: maxDepth || 3,
      constraints,
    })
  }

  async getSubtasks(taskId: string) {
    return this.request<Task[]>(`/tasks/${taskId}/subtasks`)
  }

  // ===== Agent API =====
  async registerAgent(
    name: string,
    capabilities: string[],
    description?: string,
    endpoints?: {
      task_execution?: string
      health_check?: string
      status_update?: string
    },
    limits?: {
      max_concurrent_tasks?: number
      max_execution_time?: number
      max_memory_usage?: number
      rate_limit_per_minute?: number
    },
    metadata?: unknown
  ) {
    return this.request<Agent>('/agents', 'POST', {
      name,
      description,
      capabilities: capabilities.map(cap => ({
        name: cap,
        description: `${cap} capability`,
        version: '1.0',
        parameters: {},
      })),
      endpoints: endpoints || {
        task_execution: 'http://localhost:8080/execute',
        health_check: 'http://localhost:8080/health',
        status_update: null,
      },
      limits: limits || {
        max_concurrent_tasks: 4,
        max_execution_time: 600,
        max_memory_usage: null,
        rate_limit_per_minute: 60,
      },
      metadata: metadata || {},
    })
  }

  async getAgents(capabilities?: string[]) {
    const query = capabilities ? `?capabilities=${capabilities.join(',')}` : ''
    return this.request<Agent[]>(`/agents${query}`)
  }

  async getAgent(agentId: string) {
    return this.request<Agent>(`/agents/${agentId}`)
  }

  async updateAgentHeartbeat(agentId: string, currentLoad: number, currentTaskId?: string, metrics?: unknown) {
    return this.request(`/agents/${agentId}/heartbeat`, 'POST', {
      current_load: currentLoad,
      current_task_id: currentTaskId,
      metrics,
    })
  }

  async updateAgentStatus(agentId: string, status: string) {
    return this.request<Agent>(`/agents/${agentId}/status`, 'PUT', { status })
  }

  async assignTaskToAgent(agentId: string, taskId: string, priority?: string, timeout?: number) {
    return this.request(`/agents/${agentId}/assign-task`, 'POST', {
      task_id: taskId,
      priority: priority || 'medium',
      timeout,
    })
  }

  async completeTaskAndReleaseAgent(agentId: string, taskId: string, success: boolean = true, result?: unknown) {
    return this.request(`/agents/${agentId}/complete-task`, 'POST', {
      task_id: taskId,
      success,
      result,
    })
  }

  async getAgentStats() {
    return this.request('/agents/stats')
  }

  // ===== Workflow API =====
  async createWorkflow(name: string, workspaceId: string, definition: unknown, description?: string) {
    return this.request<Workflow>('/workflows', 'POST', {
      name,
      description,
      workspace_id: workspaceId,
      definition,
    })
  }

  async getWorkflows(workspaceId?: string) {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : ''
    return this.request<Workflow[]>(`/workflows${query}`)
  }

  async getWorkflow(workflowId: string) {
    return this.request<Workflow>(`/workflows/${workflowId}`)
  }

  async deleteWorkflow(workflowId: string) {
    return this.request(`/workflows/${workflowId}`, 'DELETE')
  }

  async executeWorkflow(workflowId: string, input?: unknown, options?: unknown) {
    return this.request<{
      execution: WorkflowExecution
      task_id: string
      assigned: boolean
    }>(`/workflows/${workflowId}/execute`, 'POST', {
      input,
      options,
    })
  }

  async getWorkflowExecutions(workflowId: string, limit?: number, offset?: number) {
    const query = new URLSearchParams()
    if (limit) query.append('limit', limit.toString())
    if (offset) query.append('offset', offset.toString())
    const queryString = query.toString()
    return this.request<WorkflowExecution[]>(`/workflows/${workflowId}/executions${queryString ? '?' + queryString : ''}`)
  }

  async getWorkflowExecution(workflowId: string, executionId: string) {
    return this.request<WorkflowExecution>(`/workflows/${workflowId}/executions/${executionId}`)
  }

  // ===== Message API =====
  async sendMessage(targetType: string, targetId: string, messageType: string, content: string, metadata?: unknown) {
    return this.request<Message>('/messages', 'POST', {
      target_type: targetType,
      target_id: targetId,
      message_type: messageType,
      content,
      metadata,
    })
  }

  async getMyMessages(limit?: number, offset?: number) {
    const query = new URLSearchParams()
    if (limit) query.append('limit', limit.toString())
    if (offset) query.append('offset', offset.toString())
    const queryString = query.toString()
    return this.request<Message[]>(`/messages/user${queryString ? '?' + queryString : ''}`)
  }

  async getMyUnreadCount() {
    return this.request<{ unread_count: number }>('/messages/user/unread-count')
  }

  async getAgentMessages(agentId: string, limit?: number, offset?: number) {
    const query = new URLSearchParams()
    if (limit) query.append('limit', limit.toString())
    if (offset) query.append('offset', offset.toString())
    const queryString = query.toString()
    return this.request<Message[]>(`/messages/agent/${agentId}${queryString ? '?' + queryString : ''}`)
  }

  async getTaskMessages(taskId: string, limit?: number, offset?: number) {
    const query = new URLSearchParams()
    if (limit) query.append('limit', limit.toString())
    if (offset) query.append('offset', offset.toString())
    const queryString = query.toString()
    return this.request<Message[]>(`/messages/task/${taskId}${queryString ? '?' + queryString : ''}`)
  }

  async markMessageRead(messageType: string, messageId: string) {
    return this.request(`/messages/${messageType}/${messageId}/read`, 'POST')
  }

  async deleteMessage(messageType: string, messageId: string) {
    return this.request(`/messages/${messageType}/${messageId}`, 'DELETE')
  }

  async markMessagesReadBatch(messageType: string, messageIds: string[]) {
    return this.request<{ affected_count: number }>(`/messages/${messageType}/read-batch`, 'POST', {
      message_ids: messageIds,
    })
  }

  async deleteMessagesBatch(messageType: string, messageIds: string[]) {
    return this.request<{ affected_count: number }>(`/messages/${messageType}/delete-batch`, 'POST', {
      message_ids: messageIds,
    })
  }

  async sendSystemBroadcast(messageType: string, content: string, metadata?: unknown) {
    return this.request('/messages/broadcast', 'POST', {
      message_type: messageType,
      content,
      metadata,
    })
  }

  // ===== Health Check =====
  async healthCheck() {
    return this.request('/health')
  }

  async readyCheck() {
    return this.request('/ready')
  }

  // ===== UI Spec =====
  async getEndpoints() {
    return this.request('/ui/endpoints')
  }

  async getSpec() {
    return this.request('/ui/spec')
  }
}

export const apiService = new ApiService()
export default apiService
