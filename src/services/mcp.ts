const API_BASE_URL = 'http://localhost:8000/api/v1'

// 与后端 McpToolDefinition (camelCase) 对应
export interface McpParameters {
  type: string
  properties: Record<string, any>
  required: string[]
}

export interface McpOptions {
  timeoutMs: number
  maxRetries: number
}

export interface McpExecutionConfig {
  transport: string
  endpoint: string
  method: string
  headers: Record<string, string>
}

export interface McpToolDefinition {
  toolId: string
  description: string
  parameters: McpParameters
  options: McpOptions
  execution?: McpExecutionConfig | null
}

export interface CreateMcpToolRequest {
  toolId: string
  description: string
  parameters?: McpParameters
  options?: McpOptions
  execution?: McpExecutionConfig | null
}

const getAuthHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
})

export const mcpService = {
  // 获取所有 MCP 工具
  listTools: async (): Promise<McpToolDefinition[]> => {
    const response = await fetch(`${API_BASE_URL}/mcp/tools`, {
      headers: getAuthHeader(),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || '获取 MCP 工具列表失败')
    }
    return await response.json()
  },

  // 创建 MCP 工具
  createTool: async (tool: McpToolDefinition): Promise<McpToolDefinition> => {
    const response = await fetch(`${API_BASE_URL}/mcp/tools`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(tool),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || '创建 MCP 工具失败')
    }
    return await response.json()
  },

  // 更新 MCP 工具
  updateTool: async (toolId: string, tool: McpToolDefinition): Promise<McpToolDefinition> => {
    const response = await fetch(`${API_BASE_URL}/mcp/tools/${encodeURIComponent(toolId)}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(tool),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || '更新 MCP 工具失败')
    }
    return await response.json()
  },

  // 删除 MCP 工具
  deleteTool: async (toolId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/mcp/tools/${encodeURIComponent(toolId)}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    if (!response.ok && response.status !== 204) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || '删除 MCP 工具失败')
    }
  },
}
