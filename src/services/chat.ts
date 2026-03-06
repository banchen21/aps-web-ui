const API_BASE_URL = 'http://localhost:8000'

export interface ChatMessage {
  id: string
  session_id: string
  role: string
  content: string
  tokens_used: number | null
  created_at: string
}

export interface SendChatMessageRequest {
  session_id: string
  content: string
}

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('aps_token')}`,
  'Content-Type': 'application/json',
})

export const chatService = {
  // 获取消息历史
  getSessionMessages: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
      headers: getAuthHeader(),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '获取消息历史失败')
    return result.data as ChatMessage[]
  },

  // 发送聊天消息
  sendMessage: async (request: SendChatMessageRequest) => {
    const response = await fetch(`${API_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '发送消息失败')
    return result.data as ChatMessage
  },
}
