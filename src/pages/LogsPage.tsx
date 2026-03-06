import { useState, useEffect, useRef } from 'react'
import { Trash2, Download, Pause, Play, Search, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'

interface LogEntry {
  id: number
  time: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}

const initialLogs: LogEntry[] = [
  { id: 1, time: '14:30:01', level: 'info', message: '系统启动完成，正在初始化服务...' },
  { id: 2, time: '14:30:02', level: 'success', message: '数据库连接成功 (PostgreSQL:5432)' },
  { id: 3, time: '14:30:02', level: 'success', message: 'Redis 连接成功 (localhost:6379)' },
  { id: 4, time: '14:30:03', level: 'info', message: '加载智能体配置: 24 个智能体已注册' },
  { id: 5, time: '14:30:05', level: 'info', message: 'API 服务启动成功 (0.0.0.0:8000)' },
  { id: 6, time: '14:31:12', level: 'info', message: '收到新任务请求: Task #2341' },
  { id: 7, time: '14:31:13', level: 'info', message: '任务分配给 Agent: GPT-4 Assistant' },
  { id: 8, time: '14:31:45', level: 'success', message: '任务 #2341 执行完成，耗时: 32s' },
  { id: 9, time: '14:32:20', level: 'warn', message: '检测到系统负载较高 (CPU: 85%)' },
  { id: 10, time: '14:32:45', level: 'info', message: '自动扩展 worker 节点: 2 -> 3' },
]

const levelConfig = {
  info: { icon: Info, class: 'text-blue-500', bgClass: 'bg-blue-500/10' },
  warn: { icon: AlertTriangle, class: 'text-yellow-500', bgClass: 'bg-yellow-500/10' },
  error: { icon: XCircle, class: 'text-red-500', bgClass: 'bg-red-500/10' },
  success: { icon: CheckCircle, class: 'text-green-500', bgClass: 'bg-green-500/10' },
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Simulate real-time log updates
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const messages = [
        { level: 'info' as const, message: '检查任务状态...' },
        { level: 'success' as const, message: '健康检查通过' },
        { level: 'info' as const, message: '同步智能体状态' },
        { level: 'warn' as const, message: `内存使用率: ${Math.floor(Math.random() * 20) + 60}%` },
        { level: 'info' as const, message: '处理任务队列中的任务' },
      ]
      const randomMsg = messages[Math.floor(Math.random() * messages.length)]
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      const newLog: LogEntry = {
        id: Date.now(),
        time,
        ...randomMsg,
      }

      setLogs(prev => [...prev.slice(-99), newLog])
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  // Auto-scroll
  useEffect(() => {
    if (!isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isPaused])

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">日志控制台</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">实时系统日志</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isPaused
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? '继续' : '暂停'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
          <button className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索日志..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">全部级别</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="success">Success</option>
        </select>
      </div>

      {/* Logs Console */}
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">实时日志流</span>
          </div>
          <span className="text-sm text-slate-400">{filteredLogs.length} 条日志</span>
        </div>
        <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm">
          {filteredLogs.map((log) => {
            const config = levelConfig[log.level]
            const Icon = config.icon
            return (
              <div key={log.id} className="flex gap-4 py-1 hover:bg-slate-800/50 rounded">
                <span className="text-slate-500 flex-shrink-0 w-20">{log.time}</span>
                <span className={`${config.class} flex-shrink-0 w-16 uppercase text-xs font-semibold`}>
                  {log.level}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            )
          })}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  )
}
