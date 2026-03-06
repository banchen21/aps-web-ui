import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { chatService, ChatMessage } from '../services/chat'
import { useToast } from '../contexts/ToastContext'

export default function ChatPage() {
  const { showSuccess, showError } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sessionId = localStorage.getItem('aps_user')
    ? JSON.parse(localStorage.getItem('aps_user') || '{}').id
    : null

  useEffect(() => {
    if (sessionId) {
      fetchMessages()
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    if (!sessionId) return
    try {
      setLoading(true)
      const data = await chatService.getSessionMessages(sessionId)
      setMessages(data)
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取消息历史失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId || !messageInput.trim()) return

    try {
      setMessageLoading(true)
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        session_id: sessionId,
        role: 'user',
        content: messageInput,
        tokens_used: null,
        created_at: new Date().toISOString(),
      }
      setMessages([...messages, userMessage])
      const inputContent = messageInput
      setMessageInput('')

      const response = await chatService.sendMessage({
        session_id: sessionId,
        content: inputContent,
      })

      setMessages((prev) => [...prev, response])
    } catch (err) {
      showError(err instanceof Error ? err.message : '发送消息失败')
    } finally {
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
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user'
                      ? 'text-blue-100'
                      : 'text-slate-500 dark:text-slate-400'
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
            placeholder="输入消息..."
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
            <Send size={20} />
            <span className="hidden sm:inline">发送</span>
          </button>
        </form>
      </div>
    </div>
  )
}
