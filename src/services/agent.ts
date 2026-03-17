const API_BASE_URL = 'http://localhost:8000/api/v1'

export interface Agent {
  id: string
  name: string
  kind: 'general' | 'code' | 'research' | 'custom'
  provider?: string
  model?: string
  workspace_name: string
  owner_username?: string
  mcp_list?: string[]
  description?: string
  status?: 'online' | 'working' | 'idle'
  status_label?: string
  capabilities?: Capability[]
  current_load?: number
  max_concurrent_tasks?: number
  success_rate?: number
  last_heartbeat?: string
  created_at?: string
  updated_at?: string
}

export interface AgentStatusInfo {
  agent_id: string
  name: string
  status: 'online' | 'working' | 'idle'
  status_label: string
}

export interface Capability {
  name: string
  description: string
  version: string
  parameters: Record<string, any>
}

export interface AgentEndpoints {
  task_execution: string
  health_check: string
  status_update?: string
}

export interface AgentLimits {
  max_concurrent_tasks: number
  max_execution_time: number
  max_memory_usage?: number
  rate_limit_per_minute?: number
}

export interface RegisterAgentRequest {
  user_name: string
  name: string
  kind: 'general' | 'code' | 'research' | 'custom'
  provider: string
  model: string
  workspace_name: string
  description?: string
  capabilities?: Capability[]
  endpoints?: AgentEndpoints
  limits?: AgentLimits
  metadata?: Record<string, any>
}

export interface ProviderModelOption {
  provider: string
  default_model: string
  base_url?: string
  has_token?: boolean
  recommended_models: string[]
}

export interface ProviderModelOptionsResponse {
  default_provider: string
  providers: ProviderModelOption[]
}

export interface SaveProviderConfigRequest {
  provider: string
  model: string
  token: string
  base_url?: string
}

export interface UpdateAgentStatusRequest {
  status: 'online' | 'working' | 'idle'
}

export interface AgentHeartbeatRequest {
  current_load: number
  resource_usage: ResourceUsage
  active_tasks: string[]
  metadata?: Record<string, any>
}

export interface ResourceUsage {
  cpu: number
  memory: number
  disk: number
  network?: number
}

export interface AssignTaskRequest {
  task_id: string
}

export interface CompleteTaskRequest {
  task_id: string
  result?: Record<string, any>
}

const getAuthHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
})

export const agentService = {
  // 获取智能体列表
  getAgents: async () => {
    const response = await fetch(`${API_BASE_URL}/agent`, {
      method: 'GET',
      headers: getAuthHeader(),
    })

    if (!response.ok) throw new Error('获取智能体列表失败')
    return await response.json()
  },

  // 获取单个智能体
  getAgent: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('获取智能体失败')
    return await response.json()
  },

  // 获取所有智能体状态
  getAgentStatuses: async (): Promise<AgentStatusInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/agents/statuses`, {
      method: 'GET',
      headers: getAuthHeader(),
    })

    if (!response.ok) throw new Error('获取智能体状态失败')
    return await response.json()
  },

  // 注册智能体
  registerAgent: async (request: RegisterAgentRequest) => {
    const response = await fetch(`${API_BASE_URL}/agent`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('注册智能体失败')
    return await response.json()
  },

  // 获取可选代理商与模型（来自后端配置）
  getProviderModelOptions: async (): Promise<ProviderModelOptionsResponse> => {
    const response = await fetch(`${API_BASE_URL}/agent/provider-options`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('获取代理商与模型选项失败')
    return await response.json()
  },

  saveProviderModelOptions: async (request: SaveProviderConfigRequest) => {
    const response = await fetch(`${API_BASE_URL}/agent/provider-options`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('保存代理商配置失败')
    return await response.json()
  },

  // 更新智能体状态
  updateAgentStatus: async (agentId: string, request: UpdateAgentStatusRequest) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/status`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('更新智能体状态失败')
    return await response.json()
  },

  // 心跳更新
  updateHeartbeat: async (agentId: string, request: AgentHeartbeatRequest) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/heartbeat`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('心跳更新失败')
    return await response.json()
  },

  // 分配任务给智能体
  assignTask: async (agentId: string, request: AssignTaskRequest) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/assign-task`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('分配任务失败')
    return await response.json()
  },

  // 完成任务并释放智能体
  completeTask: async (agentId: string, request: CompleteTaskRequest) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/complete-task`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('完成任务失败')
    return await response.json()
  },

  // 删除智能体
  deleteAgent: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('删除智能体失败')
    return await response.json()
  },

  // 启动智能体
  startAgent: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/start`, {
      method: 'POST',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('启动智能体失败')
    return await response.json()
  },

  // 停止智能体
  stopAgent: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/stop`, {
      method: 'POST',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('停止智能体失败')
    return await response.json()
  },

  // 获取智能体统计信息
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/agent`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('获取统计信息失败')
    return await response.json()
  },
}
