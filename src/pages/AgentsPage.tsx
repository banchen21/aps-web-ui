import { useState, useEffect } from 'react'
import { Bot, Plus, Eye, Trash2 } from 'lucide-react'
import { Agent, agentService, RegisterAgentRequest } from '../services/agent'
import { workspaceService, WorkspaceResponse } from '../services/workspace'
import { useToast } from '../contexts/ToastContext'

type AgentWithStatus = Agent & {
  owner_username: string
  mcp_list: string[]
  // 前端使用三态展示，这里保持旧有三态类型但会把后端生命周期映射为这三态
  status: 'online' | 'working' | 'idle'
  status_label: string
}

const kindConfig: Record<string, { label: string; class: string }> = {
  general: { label: '通用', class: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' },
  code: { label: '代码', class: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' },
  research: { label: '研究', class: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' },
  custom: { label: '自定义', class: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' },
}

export default function AgentsPage() {
  const { showSuccess, showError } = useToast()
  const [agents, setAgents] = useState<AgentWithStatus[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStatus | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [registerForm, setRegisterForm] = useState({
    name: '',
    kind: 'general' as 'general' | 'code' | 'research' | 'custom',
    workspace_name: '',
    // 移除 description，因为后端表结构中没有这个字段
  })

  useEffect(() => {
    fetchAgents()
    fetchWorkspaces()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const agentList = await agentService.getAgents()
      const mapStatus = (backendStatus?: string) => {
        // backend: starting/running/stopping/stopped/unknown
        switch (backendStatus) {
          case 'starting':
            return { status: 'online' as const, label: '启动中' }
          case 'running':
            // running 表示正在运行或可用，映射为 working
            return { status: 'working' as const, label: '运行中' }
          case 'stopping':
            return { status: 'online' as const, label: '停止中' }
          case 'stopped':
            return { status: 'idle' as const, label: '已停止' }
          default:
            return { status: 'idle' as const, label: '未知' }
        }
      }

      const mergedAgents: AgentWithStatus[] = agentList.map((agent) => {
        const ms = mapStatus((agent as any).status)
        return {
          ...agent,
          owner_username: agent.owner_username || '',
          mcp_list: agent.mcp_list || [],
          status: ms.status,
          status_label: ms.label,
        }
      })

      setAgents(mergedAgents)
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取智能体列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkspaces = async () => {
    try {
      const response = await workspaceService.getWorkspaces()
      const data = await response.json()
      if (response.ok) {
        setWorkspaces(data || [])
      }
    } catch (err) {
      console.error('获取工作空间列表失败:', err)
    }
  }

  const getApsUser = () => {
    const userStr = localStorage.getItem('aps_user')
    return userStr ? JSON.parse(userStr) : null
  }

  const aps_user = getApsUser()

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerForm.name || !registerForm.workspace_name) {
      showError('请填写智能体名称和工作空间')
      return
    }

    try {
      const request: RegisterAgentRequest = {
        user_name: aps_user.username,
        name: registerForm.name,
        kind: registerForm.kind,
        workspace_name: registerForm.workspace_name,
        // description 移除
      }

      await agentService.registerAgent(request)
      showSuccess('智能体创建成功')
      setRegisterForm({
        name: '',
        kind: 'general',
        workspace_name: '',
      })
      setShowRegisterModal(false)
      fetchAgents()
    } catch (err) {
      showError(err instanceof Error ? err.message : '注册智能体失败')
    }
  }

  // 移除 handleUpdateStatus，因为新数据结构中没有 status 字段

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

  const handleViewDetail = (agent: AgentWithStatus) => {
    setSelectedAgent(agent)
    setShowDetailModal(true)
  }

  const statusConfig: Record<AgentWithStatus['status'], string> = {
    online: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    working: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    idle: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${kindConfig[agent.kind]?.class || 'bg-slate-100 text-slate-600'}`}>
                        {kindConfig[agent.kind]?.label || agent.kind}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[agent.status]}`}>
                        {agent.status_label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Section 替代原来的 Stats */}
              <div className="py-4 border-y border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">工作空间</span>
                  <span className="text-slate-900 dark:text-white font-medium">{agent.workspace_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">MCP 数量</span>
                  <span className="text-slate-900 dark:text-white font-medium">{agent.mcp_list.length}</span>
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
                {/* 移除了状态切换按钮 */}
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
            <form onSubmit={handleRegisterAgent} className="space-y-4">
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
                  智能体类型 *
                </label>
                <select
                  value={registerForm.kind}
                  onChange={(e) => setRegisterForm({ ...registerForm, kind: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="general">通用</option>
                  <option value="code">代码</option>
                  <option value="research">研究</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  工作空间 *
                </label>
                <select
                  value={registerForm.workspace_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, workspace_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">选择工作空间</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.name}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 移除了描述输入框 */}

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
                <p className="text-sm text-slate-600 dark:text-slate-400">类型</p>
                <p className="text-slate-900 dark:text-white font-semibold">{kindConfig[selectedAgent.kind]?.label || selectedAgent.kind}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">工作空间</p>
                <p className="text-slate-900 dark:text-white font-semibold">{selectedAgent.workspace_name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">状态</p>
                <p className="text-slate-900 dark:text-white font-semibold">{selectedAgent.status_label}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">所有者</p>
                <p className="text-slate-900 dark:text-white font-semibold">{selectedAgent.owner_username}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">MCP 列表</p>
                {selectedAgent.mcp_list.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAgent.mcp_list.map((mcp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded text-xs">
                        {mcp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">无 MCP 配置</p>
                )}
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