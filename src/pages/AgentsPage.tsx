import { useState, useEffect } from 'react'
import { Bot, Plus, Eye, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { agentService, Agent, RegisterAgentRequest, UpdateAgentStatusRequest, Capability, AgentEndpoints, AgentLimits } from '../services/agent'
import { useToast } from '../contexts/ToastContext'

const statusConfig = {
  online: { label: '在线', class: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' },
  idle: { label: '空闲', class: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  busy: { label: '工作中', class: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' },
  offline: { label: '离线', class: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
  error: { label: '错误', class: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
}

export default function AgentsPage() {
  const { showSuccess, showError } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [registerForm, setRegisterForm] = useState({
    name: '',
    description: '',
    capabilities: '',
    taskExecution: '',
    healthCheck: '',
    statusUpdate: '',
    maxConcurrentTasks: 5,
    maxExecutionTime: 300,
    maxMemoryUsage: '',
    rateLimitPerMinute: '',
  })

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const data = await agentService.getAgents()
      setAgents(data)
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取智能体列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerForm.name || !registerForm.capabilities || !registerForm.taskExecution || !registerForm.healthCheck) {
      showError('请填写所有必填项')
      return
    }

    try {
      const capabilities: Capability[] = registerForm.capabilities.split(',').map(c => ({
        name: c.trim(),
        description: '',
        version: '1.0.0',
        parameters: {},
      }))

      const endpoints: AgentEndpoints = {
        task_execution: registerForm.taskExecution,
        health_check: registerForm.healthCheck,
        status_update: registerForm.statusUpdate || undefined,
      }

      const limits: AgentLimits = {
        max_concurrent_tasks: registerForm.maxConcurrentTasks,
        max_execution_time: registerForm.maxExecutionTime,
        max_memory_usage: registerForm.maxMemoryUsage ? parseInt(registerForm.maxMemoryUsage) : undefined,
        rate_limit_per_minute: registerForm.rateLimitPerMinute ? parseInt(registerForm.rateLimitPerMinute) : undefined,
      }

      const request: RegisterAgentRequest = {
        name: registerForm.name,
        description: registerForm.description,
        capabilities,
        endpoints,
        limits,
      }

      await agentService.registerAgent(request)
      showSuccess('智能体注册成功')
      setRegisterForm({
        name: '',
        description: '',
        capabilities: '',
        taskExecution: '',
        healthCheck: '',
        statusUpdate: '',
        maxConcurrentTasks: 5,
        maxExecutionTime: 300,
        maxMemoryUsage: '',
        rateLimitPerMinute: '',
      })
      setShowRegisterModal(false)
      fetchAgents()
    } catch (err) {
      showError(err instanceof Error ? err.message : '注册智能体失败')
    }
  }

  const handleUpdateStatus = async (agentId: string, newStatus: 'online' | 'offline' | 'busy' | 'idle' | 'error') => {
    try {
      const request: UpdateAgentStatusRequest = { status: newStatus }
      await agentService.updateAgentStatus(agentId, request)
      showSuccess('智能体状态已更新')
      fetchAgents()
    } catch (err) {
      showError(err instanceof Error ? err.message : '更新状态失败')
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await agentService.deleteAgent(agentId)
      showSuccess('智能体已删除')
      setDeleteConfirm(null)
      fetchAgents()
    } catch (err) {
      showError(err instanceof Error ? err.message : '删除智能体失败')
    }
  }

  const handleViewDetail = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowDetailModal(true)
  }

  const getAgentColor = (index: number) => {
    const colors = [
      'from-blue-500 to-violet-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-red-500',
      'from-purple-500 to-pink-500',
      'from-cyan-500 to-blue-500',
      'from-orange-500 to-amber-500',
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">智能体管理</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理您的 AI 智能体</p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          注册智能体
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-violet-500 animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">加载中...</p>
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Bot className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">暂无智能体</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">点击"注册智能体"按钮创建您的第一个智能体</p>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            注册智能体
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAgentColor(index)} flex items-center justify-center text-white font-bold text-lg`}>
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{agent.capabilities.map(c => c.name).join(', ')}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[agent.status as keyof typeof statusConfig]?.class || statusConfig.offline.class}`}>
                  {statusConfig[agent.status as keyof typeof statusConfig]?.label || agent.status}
                </span>
              </div>

              {/* Stats */}
              <div className="flex justify-between py-4 border-y border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{agent.current_load}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">当前任务</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{(agent.success_rate * 100).toFixed(0)}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">成功率</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{agent.max_concurrent_tasks}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">最大并发</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleViewDetail(agent)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  详情
                </button>
                <button
                  onClick={() => handleUpdateStatus(agent.id, agent.status === 'idle' ? 'busy' : 'idle')}
                  className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  {agent.status === 'idle' ? '激活' : '暂停'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(agent.id)}
                  className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">注册新智能体</h2>
            <form onSubmit={handleRegisterAgent} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    智能体名称 *
                  </label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="输入智能体名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    描述
                  </label>
                  <input
                    type="text"
                    value={registerForm.description}
                    onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="输入智能体描述"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  能力 (逗号分隔) *
                </label>
                <input
                  type="text"
                  value={registerForm.capabilities}
                  onChange={(e) => setRegisterForm({ ...registerForm, capabilities: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="例如: 代码审查, 文本分析, 数据处理"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    任务执行端点 *
                  </label>
                  <input
                    type="text"
                    value={registerForm.taskExecution}
                    onChange={(e) => setRegisterForm({ ...registerForm, taskExecution: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="http://localhost:3000/execute"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    健康检查端点 *
                  </label>
                  <input
                    type="text"
                    value={registerForm.healthCheck}
                    onChange={(e) => setRegisterForm({ ...registerForm, healthCheck: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="http://localhost:3000/health"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  状态更新端点
                </label>
                <input
                  type="text"
                  value={registerForm.statusUpdate}
                  onChange={(e) => setRegisterForm({ ...registerForm, statusUpdate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="http://localhost:3000/status"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    最大并发任务数
                  </label>
                  <input
                    type="number"
                    value={registerForm.maxConcurrentTasks}
                    onChange={(e) => setRegisterForm({ ...registerForm, maxConcurrentTasks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    最大执行时间 (秒)
                  </label>
                  <input
                    type="number"
                    value={registerForm.maxExecutionTime}
                    onChange={(e) => setRegisterForm({ ...registerForm, maxExecutionTime: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    最大内存使用 (MB)
                  </label>
                  <input
                    type="number"
                    value={registerForm.maxMemoryUsage}
                    onChange={(e) => setRegisterForm({ ...registerForm, maxMemoryUsage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    每分钟速率限制
                  </label>
                  <input
                    type="number"
                    value={registerForm.rateLimitPerMinute}
                    onChange={(e) => setRegisterForm({ ...registerForm, rateLimitPerMinute: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                >
                  注册
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">智能体详情</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">名称</p>
                <p className="text-slate-900 dark:text-white font-semibold">{selectedAgent.name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">描述</p>
                <p className="text-slate-900 dark:text-white font-semibold">{selectedAgent.description || '无'}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">状态</p>
                <p className="text-slate-900 dark:text-white font-semibold">{statusConfig[selectedAgent.status as keyof typeof statusConfig]?.label || selectedAgent.status}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">当前任务</p>
                <p className="text-slate-900 dark:text-white font-semibold">{selectedAgent.current_load}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">成功率</p>
                <p className="text-slate-900 dark:text-white font-semibold">{(selectedAgent.success_rate * 100).toFixed(2)}%</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">最大并发任务</p>
                <p className="text-slate-900 dark:text-white font-semibold">{selectedAgent.max_concurrent_tasks}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">能力</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAgent.capabilities.map((cap) => (
                    <span key={cap.name} className="px-2 py-1 bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded text-xs">
                      {cap.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">最后心跳</p>
                <p className="text-slate-900 dark:text-white font-semibold text-xs">{new Date(selectedAgent.last_heartbeat).toLocaleString()}</p>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors mt-6"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">确认删除</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">确定要删除这个智能体吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteAgent(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
