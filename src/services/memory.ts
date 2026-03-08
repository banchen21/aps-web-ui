const API_BASE_URL = 'http://localhost:8000'

export interface MemoryNode {
  id: string
  name: string
  description: string
  type: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MemoryRelationship {
  id: string
  source_id: string
  target_id: string
  relationship_type: string
  metadata: Record<string, any>
  created_at: string
}

export interface CreateMemoryNodeRequest {
  name: string
  description: string
  type: string
  metadata?: Record<string, any>
}

export interface UpdateMemoryNodeRequest {
  name?: string
  description?: string
  type?: string
  metadata?: Record<string, any>
}

export interface CreateMemoryRelationshipRequest {
  source_id: string
  target_id: string
  relationship_type: string
  metadata?: Record<string, any>
}

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
})

export const memoryService = {
  // 获取所有记忆节点
  getNodes: async () => {
    const response = await fetch(`${API_BASE_URL}/memory/nodes`, {
      headers: getAuthHeader(),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '获取记忆节点失败')
    return result.data as MemoryNode[]
  },

  // 获取单个记忆节点
  getNode: async (nodeId: string) => {
    const response = await fetch(`${API_BASE_URL}/memory/nodes/${nodeId}`, {
      headers: getAuthHeader(),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '获取记忆节点失败')
    return result.data as MemoryNode
  },

  // 创建记忆节点
  createNode: async (request: CreateMemoryNodeRequest) => {
    const response = await fetch(`${API_BASE_URL}/memory/nodes`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '创建记忆节点失败')
    return result.data as MemoryNode
  },

  // 更新记忆节点
  updateNode: async (nodeId: string, request: UpdateMemoryNodeRequest) => {
    const response = await fetch(`${API_BASE_URL}/memory/nodes/${nodeId}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '更新记忆节点失败')
    return result.data as MemoryNode
  },

  // 删除记忆节点
  deleteNode: async (nodeId: string) => {
    const response = await fetch(`${API_BASE_URL}/memory/nodes/${nodeId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '删除记忆节点失败')
    return result.data
  },

  // 获取节点关系
  getRelationships: async (nodeId: string) => {
    const response = await fetch(`${API_BASE_URL}/memory/nodes/${nodeId}/relationships`, {
      headers: getAuthHeader(),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '获取关系失败')
    return result.data as MemoryRelationship[]
  },

  // 创建关系
  createRelationship: async (request: CreateMemoryRelationshipRequest) => {
    const response = await fetch(`${API_BASE_URL}/memory/relationships`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '创建关系失败')
    return result.data as MemoryRelationship
  },

  // 删除关系
  deleteRelationship: async (relationshipId: string) => {
    const response = await fetch(`${API_BASE_URL}/memory/relationships/${relationshipId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '删除关系失败')
    return result.data
  },

  // 搜索记忆节点
  searchNodes: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/memory/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeader(),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '搜索失败')
    return result.data as MemoryNode[]
  },
}
