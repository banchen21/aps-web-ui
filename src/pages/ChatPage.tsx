import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageCircle, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { chatService, ChatMessage, WS_CHAT_URL, WsServerMessage } from '../services/chat'
import { useToast } from '../contexts/ToastContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// 安全格式化时间（本地时间）
const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--:--'
    // 使用中国时区显示本地时间
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai'
    })
  } catch {
    return '--:--'
  }
}

// 获取带时区的 ISO 字符串（+08:00）
const getLocalISOString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
  
  // 返回带 +08:00 时区的 ISO 格式
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+08:00`
}

export default function ChatPage() {
  const { showError } = useToast()

  // 数据状态
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true) // 初始加载
  const [isFetchingHistory, setIsFetchingHistory] = useState(false) // 加载更多中
  const [hasMore, setHasMore] = useState(true) // 是否还有更多

  // 输入状态
  const [messageInput, setMessageInput] = useState('')

  // 引用
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null) // 顶部哨兵，用于触发自动加载
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

    // WebSocket 状态
    const [isThinking, setIsThinking] = useState(false)
    const [wsConnected, setWsConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const lastUserMsgIdRef = useRef<string | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const doConnectRef = useRef<() => void>()

  // 自动调整 textarea 高度
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [messageInput])

  // 获取当前用户信息
  const getApsUser = () => {
    const userStr = localStorage.getItem('aps_user')
    return userStr ? JSON.parse(userStr) : null
  }
  const aps_user = getApsUser()

    // --- WebSocket 连接 ---
    doConnectRef.current = () => {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const ws = new WebSocket(`${WS_CHAT_URL}?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg: WsServerMessage = JSON.parse(event.data)
          if (msg.type === 'thinking') {
            setIsThinking(true)
          } else if (msg.type === 'message' || msg.type === 'task_progress') {
            setIsThinking(false)
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: msg.content ?? '',
              created_at: msg.created_at ?? new Date().toISOString(),
            }
            setMessages((prev) => [...prev, aiMsg])
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          } else if (msg.type === 'error') {
            setIsThinking(false)
            showError(msg.message ?? '消息发送失败')
            if (lastUserMsgIdRef.current) {
              const failedId = lastUserMsgIdRef.current
              setMessages((prev) =>
                prev.map((m) => (m.id === failedId ? { ...m, status: 'error' } : m))
              )
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      ws.onerror = () => {
        setWsConnected(false)
      }

      ws.onclose = () => {
        setWsConnected(false)
        setIsThinking(false)
        // 自动重连，最多 5 次，间隔 3s
        if (reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current += 1
          setTimeout(() => doConnectRef.current?.(), 3000)
        }
      }
    }

    useEffect(() => {
      doConnectRef.current?.()
      return () => {
        reconnectAttemptsRef.current = 99 // 阻止重连
        wsRef.current?.close()
      }
    }, [])

  // --- 核心逻辑：滚动锚定加载 ---
  const fetchHistory = useCallback(async () => {
    if (isFetchingHistory || !hasMore || messages.length === 0) return

    const container = scrollContainerRef.current
    if (!container) return

    // 记录加载前的高度和滚动位置
    const preScrollHeight = container.scrollHeight
    const preScrollTop = container.scrollTop

    setIsFetchingHistory(true)
    try {
      // 使用当前列表最旧的一条记录作为游标
      const oldestTimestamp = messages[0].created_at
      const olderMessages = await chatService.getSessionMessages()

      if (olderMessages.length === 0) {
        setHasMore(false)
      } else {
        if (olderMessages.length < 25) setHasMore(false)

        // 合并数据
        setMessages((prev) => [...olderMessages, ...prev])

        // 重点：在 DOM 更新后立即修正滚动条位置，实现无感加载
        requestAnimationFrame(() => {
          const postScrollHeight = container.scrollHeight
          const heightDiff = postScrollHeight - preScrollHeight
          container.scrollTop = preScrollTop + heightDiff
        })
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
    } finally {
      setIsFetchingHistory(false)
    }
  }, [isFetchingHistory, hasMore, messages])

  // --- 自动监听：Intersection Observer ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 当用户滚动到顶部哨兵位置，且不是第一次加载页面时，触发拉取历史
        if (entries[0].isIntersecting && !isInitialLoad.current && !loading) {
          fetchHistory()
        }
      },
      { threshold: 0.5, rootMargin: '100px 0px 0px 0px' } // 提前 100px 预加载，更流畅
    )

    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [fetchHistory, loading])

  // --- 初始加载：拉取最新消息 ---
  useEffect(() => {
    const initChat = async () => {
      try {
        const data = await chatService.getSessionMessages()
        setMessages(data)
        if (data.length < 25) setHasMore(false)

        // 初始加载滚到底部
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
          }
          isInitialLoad.current = false
        })
      } catch (err) {
        showError('初始化聊天失败')
      } finally {
        setLoading(false)
      }
    }
    initChat()
  }, [showError])

  // --- 发送消息逻辑 ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aps_user || !messageInput.trim() || !wsConnected || isThinking) return;

    const currentInput = messageInput.trim();
    setMessageInput('')

    const msgId = `temp-user-${Date.now()}`
    lastUserMsgIdRef.current = msgId
    const userMsg: ChatMessage = {
      id: msgId,
      role: 'user',
      content: currentInput,
      created_at: getLocalISOString(),
      status: 'sent',
    }
    setMessages((prev) => [...prev, userMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    wsRef.current?.send(JSON.stringify({ content: currentInput, device_type: 'web' }))
  };

  // 重新发送失败的消息
  const handleRetryMessage = (message: ChatMessage) => {
    if (message.status !== 'error') return;
    if (!wsConnected || isThinking) return
    lastUserMsgIdRef.current = message.id
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, status: 'sent' } : m))
    )
    wsRef.current?.send(JSON.stringify({ content: message.content, device_type: 'web' }))
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center gap-3 flex-shrink-0">
        <MessageCircle size={24} />
        <div>
          <h1 className="text-lg font-bold">智能助手</h1>
            <p className="text-blue-100 text-xs opacity-80">在线历史记录已同步</p>
        </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs">
            {wsConnected ? (
              <><Wifi size={14} className="text-green-300" /><span className="text-green-200">已连接</span></>
            ) : (
              <><WifiOff size={14} className="text-red-300 animate-pulse" /><span className="text-red-200">连接中...</span></>
            )}
          </div>
      </div>

      {/* 消息展示区 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ overflowAnchor: 'none' }} // 禁用浏览器不稳定的自动锚定，由我们手动控制
      >
        {/* 顶部加载状态/哨兵 */}
        <div ref={topSentinelRef} className="py-4 flex justify-center">
          {isFetchingHistory ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" />
              正在同步历史消息...
            </div>
          ) : !hasMore && messages.length > 0 ? (
            <span className="text-slate-300 text-xs">已加载全部历史记录</span>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <MessageCircle size={48} className="mb-2" />
            <p>还没有消息，打个招呼吧</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* 失败消息的重试按钮 */}
              {message.role === 'user' && message.status === 'error' && (
                <button
                  onClick={() => handleRetryMessage(message)}
                  className="mr-2 p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors self-start mt-2"
                  title="重新发送"
                >
                  <RefreshCw size={16} />
                </button>
              )}

              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm ${message.role === 'user'
                  ? message.status === 'error'
                    ? 'bg-red-500 text-white rounded-br-none'
                    : 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                  }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0">{children}</ol>,
                        li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                        code: ({ children }) => <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-xs">{children}</code>,
                        pre: ({ children }) => <pre className="p-2 rounded bg-slate-200 dark:bg-slate-600 overflow-x-auto text-xs">{children}</pre>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
                <div className={`text-[10px] mt-1 opacity-50 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.role === 'user' && message.status === 'sending' && (
                    <div className="text-[10px] text-blue-200">发送中...</div>
                  )}
                  {message.role === 'user' && message.status === 'error' && (
                    <div className="text-[10px] text-red-200">发送失败，点击重试</div>
                  )}
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder={isThinking ? "对方正在思考..." : !wsConnected ? "正在连接服务器..." : "输入消息... (Enter 发送, Shift+Enter 换行)"}
            disabled={isThinking || !wsConnected}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition-all resize-none min-h-[40px] max-h-[120px]"
          />
          <button
            type="submit"
              disabled={isThinking || !wsConnected || !messageInput.trim()}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center w-12"
          >
            {isThinking ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  )
}