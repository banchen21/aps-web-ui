import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageCircle, Loader2, RefreshCw } from 'lucide-react'
import { chatService, ChatMessage } from '../services/chat'
import { useToast } from '../contexts/ToastContext'

// 安全格式化时间
const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--:--'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
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
  const [messageLoading, setMessageLoading] = useState(false)

  // 引用
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null) // 顶部哨兵，用于触发自动加载
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  // 获取当前用户信息
  const getApsUser = () => {
    const userStr = localStorage.getItem('aps_user')
    return userStr ? JSON.parse(userStr) : null
  }
  const aps_user = getApsUser()

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
      const olderMessages = await chatService.getSessionMessages(oldestTimestamp)

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
  const sendMessageContent = async (content: string, tempId?: string) => {
    const msgId = tempId || `temp-user-${Date.now()}`;

    // 如果没有传入 tempId，说明是新消息，需要添加到列表
    if (!tempId) {
      const userMsg: ChatMessage = {
        id: msgId,
        role: 'user',
        content: content,
        created_at: new Date().toISOString(),
        status: 'sending'
      };
      setMessages((prev) => [...prev, userMsg]);
      // 发送消息后立即滚动到底部
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } else {
      // 重新发送，更新状态为 sending
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'sending' } : m));
    }

    try {
      const response = await chatService.sendMessage({
        user: aps_user.username,
        content: content,
        device_type: "web",
        created_at: new Date().toISOString(),
      });

      // 更新用户消息为 sent
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'sent' } : m));

      // 处理 AI 响应 - response 是消息数组
      const newMessages = response as ChatMessage[];
      if (newMessages && Array.isArray(newMessages)) {
        newMessages.forEach((msg, index) => {
          setTimeout(() => {
            setMessages((prev) => [...prev, msg]);
            if (index === newMessages.length - 1) {
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
          }, index * 100);
        });
      }
    } catch (err) {
      showError('发送失败');
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error' } : m));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aps_user || !messageInput.trim()) return;

    const currentInput = messageInput.trim();
    setMessageInput(''); // 清空输入
    await sendMessageContent(currentInput);
  };

  // 重新发送失败的消息
  const handleRetryMessage = async (message: ChatMessage) => {
    if (message.status !== 'error') return;
    await sendMessageContent(message.content, message.id);
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
                  {message.content}
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
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={messageLoading ? "对方正在思考..." : "输入消息..."}
            disabled={messageLoading}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition-all"
          />
          <button
            type="submit"
            disabled={messageLoading || !messageInput.trim()}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center w-12"
          >
            {messageLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  )
}