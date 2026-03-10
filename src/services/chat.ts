const API_BASE_URL = 'http://0.0.0.0:8000/api/v1'

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'error'; // 新增：消息状态
}
interface BackendMessage {
  content: string | Array<{ content: string, created_at: string }>;
  created_at: string;
  sender: string;
  source_ip?: string;
  message_type?: 'Chat' | 'Task';
  metadata?: Record<string, any>;
}

// 辅助函数：提取 content 的文本内容
const extractContent = (content: any): string => {
  if (content == null) return ''

  // 如果 content 是数组，合并所有元素的 content 字段
  if (Array.isArray(content)) {
    const parts = content
      .map(item => {
        if (item == null) return ''
        if (typeof item === 'object') {
          // 尝试多个可能的字段名
          if (item.content != null) return String(item.content)
          if (item.text != null) return String(item.text)
          if (item.message != null) return String(item.message)
          // 如果没有已知字段，返回空
          return ''
        }
        // 如果 item 是字符串或其他类型，直接转换
        return String(item)
      })
      .filter(part => part.trim().length > 0) // 过滤空字符串

    return parts.join('\n').trim()
  }

  // 如果 content 是对象，提取 content 或 text 字段
  if (typeof content === 'object') {
    if (content.content != null) return String(content.content)
    if (content.text != null) return String(content.text)
    if (content.message != null) return String(content.message)
    return ''
  }

  // content 是字符串或其他类型
  return String(content)
}


export interface SendChatMessageRequest {
  user: string
  content: string
  device_type: string,
  created_at: string
}

// 获取 Auth Header (建议将 token 存储逻辑统一)
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
})

export const chatService = {
  /**
   * 获取消息历史
   * @param before 游标：获取该时间点之前的消息 (ISO String)
   * @param limit 每页数量
   */
  // 修改 getSessionMessages 方法
  getSessionMessages: async (before?: string, limit: number = 25) => {
    console.log(new Date().toISOString());

    const params = new URLSearchParams()
    if (before) params.append('before', before)
    params.append('limit', limit.toString())

    const url = `${API_BASE_URL}/message?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeader(),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '获取消息历史失败')

    // 获取当前登录用户
    const currentUser = localStorage.getItem('aps_user')
    const currentUsername = currentUser ? JSON.parse(currentUser).username : ''

    // 转换后端数据为前端格式
    return (result as BackendMessage[]).map((msg, index) => {
      // 验证 created_at 是否为有效日期
      const createdDate = new Date(msg.created_at)
      const validCreatedAt = isNaN(createdDate.getTime()) ? new Date().toISOString() : msg.created_at

      // 历史消息的 content 是字符串，直接使用
      const content = typeof msg.content === 'string' ? msg.content : ''

      return {
        id: `${validCreatedAt}-${msg.sender}-${index}`,
        role: msg.sender === currentUsername ? 'user' : 'assistant',
        content,
        created_at: validCreatedAt,
      } as ChatMessage
    })
  },

  /**
   * 发送聊天消息
   */
  sendMessage: async (request: SendChatMessageRequest): Promise<ChatMessage[]> => {
    const response = await fetch(`${API_BASE_URL}/message`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.message || '发送消息失败')
    
    // 提取消息数组 - 支持多种返回格式
    let messagesArray: any[] = []
    if (Array.isArray(result)) {
      messagesArray = result
    } else if (result.content && Array.isArray(result.content)) {
      messagesArray = result.content
    } else if (result.data && Array.isArray(result.data)) {
      messagesArray = result.data
    } else if (result.content && typeof result.content === 'object') {
      // 单个消息对象
      messagesArray = [result.content]
    } else if (typeof result === 'object' && result.content != null) {
      messagesArray = [result]
    } else {
      messagesArray = [result]
    }
    
    // 转换为 ChatMessage 数组
    return messagesArray.map((msg, index) => {
      // 提取内容
      const content = typeof msg.content === 'string'
        ? msg.content
        : extractContent(msg.content)
      
      // 验证时间
      const rawCreatedAt = msg.created_at || new Date().toISOString()
      const createdDate = new Date(rawCreatedAt)
      const validCreatedAt = isNaN(createdDate.getTime())
        ? new Date().toISOString()
        : rawCreatedAt
      
      // 提取发送者
      const sender = msg.sender || 'assistant'
      
      return {
        id: `${validCreatedAt}-${sender}-${Date.now()}-${index}`,
        role: sender === request.user ? 'user' : 'assistant',
        content,
        created_at: validCreatedAt,
      } as ChatMessage
    })
  },
}