import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { chatService, ChatMessage } from '../services/chat'
import { useToast } from '../contexts/ToastContext'

export default function ChatPage() {
  const { showError } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 获取用户信息
  const getApsUser = () => {
    const userStr = localStorage.getItem('aps_user')
    return userStr ? JSON.parse(userStr) : null
  }

  const aps_user = getApsUser()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    if (!aps_user?.id) return
    try {
      setLoading(true)
      const data = await chatService.getSessionMessages()
      // 这里如果后端获取历史记录的接口返回的也是嵌套结构，也需要像下面一样 map 一下
      setMessages(data)
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取消息历史失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. 基础校验
    if (!aps_user || !messageInput.trim() || messageLoading) return

    const currentInput = messageInput.trim()

    try {
      // 2. 开启加载状态
      setMessageLoading(true)

      // 3. 【新增】构造用户自己的消息对象，并立即添加到界面上
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: currentInput,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      // 4. 【新增】立即清空输入框，提升用户体验
      setMessageInput('')

      // 5. 调用后端接口
      const response = await chatService.sendMessage({
        user: aps_user.username || 'unknown',
        content: currentInput,
        metadata: {}
      })

      console.log('后端原始响应:', response)

      // 6. 适配逻辑：处理 AI 的响应
      if (response && response.content) {
        const aiRaw = response.content;

        let displayContent = "";
        if (typeof aiRaw.content === 'string') {
          displayContent = aiRaw.content;
        } else if (aiRaw.content && typeof aiRaw.content === 'object') {
          // 提取 Rust Enum 的 Text 值 (如 {"Text": "..."})
          displayContent = aiRaw.content.Text || JSON.stringify(aiRaw.content);
        }

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: displayContent,
          created_at: aiRaw.created_at || new Date().toISOString(),
        }

        // 7. 将 AI 消息添加到数组末尾
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (err) {
      console.error("发送失败:", err)
      showError(err instanceof Error ? err.message : '发送消息失败')
      // 可选：如果发送失败，可以把刚才添加的用户消息标记为失败，或者在这里逻辑处理
    } finally {
      // 8. 关闭加载状态
      setMessageLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* 聊天头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center gap-3 flex-shrink-0">
        <MessageCircle size={28} />
        <div>
          <h1 className="text-2xl font-bold">聊天助手</h1>
          <p className="text-blue-100 text-sm">与 AI 进行对话</p>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>加载消息中...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>开始聊天吧</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] lg:max-w-md px-4 py-3 rounded-lg ${message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-[10px] mt-1 opacity-70 ${message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                >
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 消息输入框 */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            placeholder={messageLoading ? "对方正在输入..." : "输入消息..."}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={messageLoading}
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={messageLoading || !messageInput.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
          >
            {messageLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send size={20} />
                <span className="hidden sm:inline">发送</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}