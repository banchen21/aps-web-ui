import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Activity, Bot, CheckCircle, Cpu, TrendingUp, TrendingDown, Clock, HardDrive, Network, Boxes, Zap } from 'lucide-react'
import { systemService, SystemInfo } from '../services/system'
import { agentService, ProviderModelOption } from '../services/agent'
import { useToast } from '../contexts/ToastContext'

const taskData = [
  { name: '10:00', completed: 45, new: 38 },
  { name: '11:00', completed: 62, new: 55 },
  { name: '12:00', completed: 34, new: 28 },
  { name: '13:00', completed: 71, new: 65 },
  { name: '14:00', completed: 55, new: 48 },
  { name: '15:00', completed: 68, new: 62 },
  { name: '16:00', completed: 42, new: 35 },
]


const activities = [
  { id: 1, type: 'success', title: '任务 #2341 已完成', time: '2 分钟前', icon: CheckCircle },
  { id: 2, type: 'info', title: '新智能体已上线', time: '15 分钟前', icon: Bot },
  { id: 3, type: 'warning', title: '系统负载较高', time: '32 分钟前', icon: Activity },
  { id: 4, type: 'success', title: '数据库备份完成', time: '1 小时前', icon: Zap },
]

const stats = [
  { label: '在线智能体', value: '24', trend: '+12%', trendUp: true, icon: Bot, color: 'bg-blue-500' },
  { label: '活跃任务', value: '156', trend: '+8%', trendUp: true, icon: Activity, color: 'bg-green-500' },
  { label: '系统可用性', value: '99.8%', trend: '稳定', trendUp: true, icon: CheckCircle, color: 'bg-purple-500' },
  { label: 'CPU 使用率', value: '42%', trend: '-3%', trendUp: false, icon: Cpu, color: 'bg-orange-500' },
]

export default function DashboardPage() {
  const { showError, showSuccess } = useToast()
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
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

  // 计算百分比
  const cpuPercent = systemInfo ? Math.round(systemInfo.cpu_usage) : 0
  const memoryPercent = systemInfo ? Math.round((systemInfo.used_memory / systemInfo.total_memory) * 100) : 0
  const diskPercent = systemInfo ? Math.round((systemInfo.disk_usage / systemInfo.total_disk) * 100) : 0
  const networkPercent = systemInfo ? Math.min(Math.round((systemInfo.net_rx_speed + systemInfo.net_tx_speed) / 1024 / 1024), 100) : 0

  const performanceData = [
    { name: 'CPU', value: cpuPercent, icon: Cpu },
    { name: '内存', value: memoryPercent, icon: HardDrive },
    { name: '磁盘', value: diskPercent, icon: HardDrive },
    { name: '网络', value: networkPercent, icon: Network },
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
              {['小时', '天', '周'].map((period, i) => (
                <button
                  key={period}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    i === 0
                      ? 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {period}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    index === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-purple-500 to-pink-500'
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
