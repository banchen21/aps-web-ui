import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Activity, Bot, CheckCircle, Cpu, TrendingUp, TrendingDown, Clock, HardDrive, Boxes, Zap } from 'lucide-react'
import { systemService, SystemInfo } from '../services/system'
import { agentService, ProviderModelOption } from '../services/agent'
import { taskService, TaskItem } from '../services/task'
import { useToast } from '../contexts/ToastContext'

type TrendPeriod = 'hour' | 'day' | 'week'

interface TaskTrendPoint {
  name: string
  completed: number
  new: number
}

interface DashboardActivity {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  time: string
  icon: typeof CheckCircle
}

const completedStatuses = new Set(['completed_success', 'completed_failure'])

const pad2 = (n: number) => String(n).padStart(2, '0')

const getStartOfDay = (date: Date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const getStartOfWeek = (date: Date) => {
  const d = getStartOfDay(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d
}

const formatRelativeTime = (isoTime?: string) => {
  if (!isoTime) return '刚刚'
  const time = new Date(isoTime)
  const diffMs = Date.now() - time.getTime()
  if (Number.isNaN(diffMs)) return '刚刚'

  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`

  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} 天前`
}

const buildTrendData = (tasks: TaskItem[], period: TrendPeriod): TaskTrendPoint[] => {
  const now = new Date()
  const buckets: Array<{ key: string; label: string; start: Date; end: Date }> = []

  if (period === 'hour') {
    for (let i = 6; i >= 0; i -= 1) {
      const start = new Date(now)
      start.setMinutes(0, 0, 0)
      start.setHours(start.getHours() - i)
      const end = new Date(start)
      end.setHours(end.getHours() + 1)
      const key = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}-${pad2(start.getHours())}`
      buckets.push({ key, label: `${pad2(start.getHours())}:00`, start, end })
    }
  } else if (period === 'day') {
    for (let i = 6; i >= 0; i -= 1) {
      const start = getStartOfDay(now)
      start.setDate(start.getDate() - i)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const key = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`
      buckets.push({ key, label: `${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`, start, end })
    }
  } else {
    for (let i = 6; i >= 0; i -= 1) {
      const start = getStartOfWeek(now)
      start.setDate(start.getDate() - i * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const key = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`
      buckets.push({ key, label: `${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`, start, end })
    }
  }

  const resultMap = new Map<string, TaskTrendPoint>()
  buckets.forEach((b) => resultMap.set(b.key, { name: b.label, completed: 0, new: 0 }))

  const hitBucket = (time?: string) => {
    if (!time) return undefined
    const t = new Date(time)
    if (Number.isNaN(t.getTime())) return undefined
    return buckets.find((b) => t >= b.start && t < b.end)
  }

  tasks.forEach((task) => {
    const createdBucket = hitBucket(task.created_at)
    if (createdBucket) {
      const target = resultMap.get(createdBucket.key)
      if (target) target.new += 1
    }

    if (completedStatuses.has(task.status)) {
      const completedBucket = hitBucket(task.updated_at)
      if (completedBucket) {
        const target = resultMap.get(completedBucket.key)
        if (target) target.completed += 1
      }
    }
  })

  return buckets.map((b) => resultMap.get(b.key) || { name: b.label, completed: 0, new: 0 })
}

const buildRecentActivities = (tasks: TaskItem[]): DashboardActivity[] => {
  const sorted = [...tasks].sort((a, b) => {
    const ta = new Date(a.updated_at).getTime()
    const tb = new Date(b.updated_at).getTime()
    return tb - ta
  })

  const recent = sorted.slice(0, 5)
  if (recent.length === 0) {
    return [
      {
        id: 'empty-0',
        type: 'info',
        title: '暂无任务活动记录',
        time: '刚刚',
        icon: Clock,
      },
    ]
  }

  return recent.map((task) => {
    if (task.status === 'completed_success') {
      return {
        id: task.id,
        type: 'success',
        title: `任务 ${task.name} 已完成`,
        time: formatRelativeTime(task.updated_at),
        icon: CheckCircle,
      }
    }

    if (task.status === 'completed_failure') {
      return {
        id: task.id,
        type: 'warning',
        title: `任务 ${task.name} 执行失败`,
        time: formatRelativeTime(task.updated_at),
        icon: Activity,
      }
    }

    if (task.status === 'under_review') {
      return {
        id: task.id,
        type: 'warning',
        title: `任务 ${task.name} 待审阅`,
        time: formatRelativeTime(task.updated_at),
        icon: Clock,
      }
    }

    return {
      id: task.id,
      type: 'info',
      title: `任务 ${task.name} 状态：${task.status_label}`,
      time: formatRelativeTime(task.updated_at),
      icon: Zap,
    }
  })
}

export default function DashboardPage() {
  const { showError, showSuccess } = useToast()
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [dashboardTasks, setDashboardTasks] = useState<TaskItem[]>([])
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('hour')
  const [agentCount, setAgentCount] = useState(0)
  const [activeTaskCount, setActiveTaskCount] = useState(0)
  const [taskSuccessRate, setTaskSuccessRate] = useState(100)
  const [loading, setLoading] = useState(true)
  const [defaultProvider, setDefaultProvider] = useState('default')
  const [defaultModel, setDefaultModel] = useState('')
  const [providerOptions, setProviderOptions] = useState<ProviderModelOption[]>([])
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configForm, setConfigForm] = useState({
    provider: '',
    model: '',
    token: '',
    base_url: '',
  })

  // 获取系统信息
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const data = await systemService.getSystemInfo()
        setSystemInfo(data)
      } catch (err) {
        showError('获取系统信息失败')
      } finally {
        setLoading(false)
      }
    }

    fetchSystemInfo()
    const fetchProviderInfo = async () => {
      try {
        const opts = await agentService.getProviderModelOptions()
        const provider = opts.default_provider || opts.providers?.[0]?.provider || 'default'
        const model = opts.providers?.find((p) => p.provider === provider)?.default_model || opts.providers?.[0]?.default_model || ''
        setProviderOptions(opts.providers || [])
        setDefaultProvider(provider)
        setDefaultModel(model)
        setConfigForm((prev) => ({
          ...prev,
          provider: prev.provider || provider,
          model: prev.model || model,
        }))
      } catch {
        // 控制台按钮展示辅助信息，失败时静默回退默认值
      }
    }
    void fetchProviderInfo()
    // 每 5 秒刷新一次
    const interval = setInterval(fetchSystemInfo, 5000)
    return () => clearInterval(interval)
  }, [showError])

  const handleCopyToken = async () => {
    try {
      const token = localStorage.getItem('access_token') || ''
      if (!token) {
        showError('未找到 Token，请先登录')
        return
      }
      await navigator.clipboard.writeText(token)
      showSuccess('Token 已复制到剪贴板')
    } catch {
      showError('复制 Token 失败')
    }
  }

  const handleSaveProviderConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configForm.provider.trim() || !configForm.model.trim() || !configForm.token.trim()) {
      showError('请填写代理商、模型和 Token')
      return
    }

    try {
      setSavingConfig(true)
      await agentService.saveProviderModelOptions({
        provider: configForm.provider.trim(),
        model: configForm.model.trim(),
        token: configForm.token.trim(),
        base_url: configForm.base_url.trim(),
      })
      const opts = await agentService.getProviderModelOptions()
      setProviderOptions(opts.providers || [])
      setDefaultProvider(configForm.provider.trim())
      setDefaultModel(configForm.model.trim())
      setShowConfigModal(false)
      showSuccess('代理商配置已写入后端配置文件，重启服务后生效')
    } catch (err) {
      showError(err instanceof Error ? err.message : '保存配置失败')
    } finally {
      setSavingConfig(false)
    }
  }

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [agents, tasks] = await Promise.all([
          agentService.getAgents(),
          taskService.getTasks(),
        ])

        setAgentCount(Array.isArray(agents) ? agents.length : 0)

        const taskList = (Array.isArray(tasks) ? tasks : []) as TaskItem[]
        setDashboardTasks(taskList)
        const activeTasks = taskList.filter((t) =>
          ['published', 'accepted', 'executing', 'submitted', 'under_review'].includes(t.status),
        )
        setActiveTaskCount(activeTasks.length)

        const done = taskList.filter((t) =>
          t.status === 'completed_success' || t.status === 'completed_failure',
        )
        if (done.length === 0) {
          setTaskSuccessRate(100)
        } else {
          const success = done.filter((t) => t.status === 'completed_success').length
          setTaskSuccessRate(Math.round((success / done.length) * 1000) / 10)
        }
      } catch {
        // 摘要信息失败不阻塞页面主流程
      }
    }

    void fetchSummary()
    const interval = setInterval(fetchSummary, 10000)
    return () => clearInterval(interval)
  }, [])

  const taskData = useMemo(
    () => buildTrendData(dashboardTasks, trendPeriod),
    [dashboardTasks, trendPeriod],
  )

  const activities = useMemo(
    () => buildRecentActivities(dashboardTasks),
    [dashboardTasks],
  )

  // 计算百分比
  const cpuPercent = systemInfo ? Math.round(systemInfo.cpu_usage) : 0
  const memoryPercent = systemInfo ? Math.round((systemInfo.used_memory / systemInfo.total_memory) * 100) : 0
  const diskPercent = systemInfo ? Math.round((systemInfo.disk_usage / systemInfo.total_disk) * 100) : 0

  const performanceData = [
    { name: 'CPU', value: cpuPercent, icon: Cpu },
    { name: '内存', value: memoryPercent, icon: HardDrive },
    { name: '磁盘', value: diskPercent, icon: HardDrive },
  ]

  const stats = [
    {
      label: '智能体总数',
      value: String(agentCount),
      trend: agentCount > 0 ? '在线' : '暂无',
      trendUp: agentCount > 0,
      icon: Bot,
      color: 'bg-blue-500',
    },
    {
      label: '活跃任务',
      value: String(activeTaskCount),
      trend: activeTaskCount > 0 ? '进行中' : '空闲',
      trendUp: activeTaskCount > 0,
      icon: Activity,
      color: 'bg-green-500',
    },
    {
      label: '任务成功率',
      value: `${taskSuccessRate}%`,
      trend: '近期开单统计',
      trendUp: taskSuccessRate >= 80,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
    {
      label: 'CPU 使用率',
      value: `${cpuPercent}%`,
      trend: cpuPercent <= 70 ? '健康' : '偏高',
      trendUp: cpuPercent <= 70,
      icon: Cpu,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">控制台</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">系统运行状态总览</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            title={`默认代理商: ${defaultProvider} / 默认模型: ${defaultModel || '未设置'}`}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Boxes className="w-4 h-4" />
            添加代理商/模型/Token
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">任务趋势</h3>
            <div className="flex gap-2">
              {([
                { id: 'hour', label: '小时' },
                { id: 'day', label: '天' },
                { id: 'week', label: '周' },
              ] as Array<{ id: TrendPeriod; label: string }>).map((period) => (
                <button
                  key={period.id}
                  onClick={() => setTrendPeriod(period.id)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    trendPeriod === period.id
                      ? 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="完成任务" />
                <Bar dataKey="new" fill="#3b82f6" radius={[4, 4, 0, 0]} name="新任务" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">最近活动</h3>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                  activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                }`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">性能概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceData.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-gradient-to-r from-blue-500 to-violet-500' :
                    index === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    'bg-gradient-to-r from-yellow-500 to-orange-500'
                  }`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">配置代理商与模型</h2>
            <form onSubmit={handleSaveProviderConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">代理商 *</label>
                <input
                  value={configForm.provider}
                  onChange={(e) => setConfigForm({ ...configForm, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="例如: deepseek / openai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">模型 *</label>
                <input
                  value={configForm.model}
                  onChange={(e) => setConfigForm({ ...configForm, model: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="例如: deepseek-chat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Token *</label>
                <input
                  type="password"
                  value={configForm.token}
                  onChange={(e) => setConfigForm({ ...configForm, token: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="输入 API Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base URL</label>
                <input
                  value={configForm.base_url}
                  onChange={(e) => setConfigForm({ ...configForm, base_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="默认: https://api.openai.com/v1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-60"
                >
                  {savingConfig ? '保存中...' : '保存配置'}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">当前配置</h3>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                默认代理商: {defaultProvider} | 默认模型: {defaultModel || '未设置'}
              </div>
              {providerOptions.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">暂无代理商配置</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {providerOptions.map((item) => (
                    <div
                      key={item.provider}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-900/20"
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{item.provider}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">模型: {item.default_model}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">地址: {item.base_url || '未配置'}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">Token: {item.has_token ? '已配置' : '未配置'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
