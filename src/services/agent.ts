const API_BASE_URL = 'http://localhost:8000'

export interface Agent {
  id: string
  name: string
  description?: string
  status: 'online' | 'offline' | 'busy' | 'idle' | 'error'
  capabilities: Capability[]
  current_load: number
  max_concurrent_tasks: number
  success_rate: number
  last_heartbeat: string
  created_at: string
  updated_at: string
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
  name: string
  description?: string
  capabilities: Capability[]
  endpoints: AgentEndpoints
  limits: AgentLimits
  metadata?: Record<string, any>
}

export interface UpdateAgentStatusRequest {
  status: 'online' | 'offline' | 'busy' | 'idle' | 'error'
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
    const response = await fetch(`${API_BASE_URL}/agents`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    
    if (!response.ok) throw new Error('获取智能体列表失败')
    const result = await response.json()
    return result.data || []
  },

  // 获取单个智能体
  getAgent: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('获取智能体失败')
    const result = await response.json()
    return result.data
  },

  // 注册智能体
  registerAgent: async (request: RegisterAgentRequest) => {
    const response = await fetch(`${API_BASE_URL}/agents`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('注册智能体失败')
    const result = await response.json()
    return result.data
  },

  // 更新智能体状态
  updateAgentStatus: async (agentId: string, request: UpdateAgentStatusRequest) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/status`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('更新智能体状态失败')
    const result = await response.json()
    return result.data
  },

  // 心跳更新
  updateHeartbeat: async (agentId: string, request: AgentHeartbeatRequest) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/heartbeat`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('心跳更新失败')
    const result = await response.json()
    return result.data
  },

  // 分配任务给智能体
  assignTask: async (agentId: string, request: AssignTaskRequest) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/assign-task`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('分配任务失败')
    const result = await response.json()
    return result.data
  },

  // 完成任务并释放智能体
  completeTask: async (agentId: string, request: CompleteTaskRequest) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/complete-task`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('完成任务失败')
    const result = await response.json()
    return result.data
  },

  // 删除智能体
  deleteAgent: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('删除智能体失败')
    const result = await response.json()
    return result.data
  },

  // 获取智能体统计信息
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/agents/stats`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('获取统计信息失败')
    const result = await response.json()
    return result.data
  },
}
