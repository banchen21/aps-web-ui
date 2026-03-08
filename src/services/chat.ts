const API_BASE_URL = 'http://0.0.0.0:8000/api/v1'

export interface ChatMessage {
  id: string
  role: string
  content: string
  created_at: string
}

export interface SendChatMessageRequest {
  user: string
  content: string
  metadata?: Record<string, any>
}

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('refresh_token')}`,
  'Content-Type': 'application/json',
})

export const chatService = {
  // 获取消息历史
  getSessionMessages: async () => {
    const response = await fetch(`${API_BASE_URL}/message`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    const result = await response.json()
    // 注意：如果后端 get_message_history 还没实现，这里可能会报错
    if (!response.ok) throw new Error(result.message || '获取消息历史失败')
    
    // 如果后端直接返回数组，就返回 result；如果包裹在 data 里，才用 result.data
    return Array.isArray(result) ? result : (result.data || [])
  },

  // 发送聊天消息
  sendMessage: async (request: SendChatMessageRequest) => {
    const response = await fetch(`${API_BASE_URL}/message`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '发送消息失败')
    
    // 【修正点】：后端直接返回了对象（包含 content 字段），没有嵌套在 data 里
    // 所以这里直接返回 result
    return result 
  },
}