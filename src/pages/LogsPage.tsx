import { useState, useEffect, useRef } from 'react'
import { Trash2, Download, Pause, Play, Search, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'

const SSE_URL = 'http://0.0.0.0:8000/logs/stream'

interface LogEntry {
  id: number
  time: string
  level: 'info' | 'warn' | 'error' | 'success' | 'debug'
  message: string
}

const levelConfig = {
  info: { icon: Info, class: 'text-blue-500', bgClass: 'bg-blue-500/10' },
  warn: { icon: AlertTriangle, class: 'text-yellow-500', bgClass: 'bg-yellow-500/10' },
  error: { icon: XCircle, class: 'text-red-500', bgClass: 'bg-red-500/10' },
  success: { icon: CheckCircle, class: 'text-green-500', bgClass: 'bg-green-500/10' },
  debug: { icon: Info, class: 'text-slate-400', bgClass: 'bg-slate-500/10' },
}

type BackendLevel = 'info' | 'warn' | 'error' | 'debug' | 'trace'

function mapLevel(level: BackendLevel): LogEntry['level'] {
  if (level === 'warn') return 'warn'
  if (level === 'error') return 'error'
  if (level === 'debug' || level === 'trace') return 'debug'
  return 'info'
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [connected, setConnected] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const isPausedRef = useRef(isPaused)
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // SSE 长连接
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const es = new EventSource(`${SSE_URL}?token=${encodeURIComponent(token)}`)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      if (isPausedRef.current) return
      try {
        const raw = JSON.parse(e.data) as {
          time: string
          level: BackendLevel
          message: string
          target: string
        }
        const entry: LogEntry = {
          id: Date.now() + Math.random(),
          time: raw.time,
          level: mapLevel(raw.level),
          message: raw.target ? `[${raw.target}] ${raw.message}` : raw.message,
        }
        setLogs(prev => [...prev.slice(-499), entry])
      } catch {
        // ignore malformed frames
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [])

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
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-400">{connected ? '实时日志流' : '未连接'}</span>
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
