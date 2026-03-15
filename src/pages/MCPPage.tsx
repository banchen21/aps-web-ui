import { useState, useEffect } from 'react'
import { Plus, Server, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MCPServer {
  id: string
  name: string
  url: string
  status: 'connected' | 'disconnected' | 'error'
  description?: string
  created_at: string
}

export default function MCPPage() {
  const { showSuccess, showError } = useToast()
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
  })

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    try {
      setLoading(true)
      // TODO: 实现 MCP 服务器列表获取
      // const response = await mcpService.getServers()
      // setServers(response)
      setServers([])
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取 MCP 服务器列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.url) {
      showError('请填写服务器名称和 URL')
      return
    }

    try {
      // TODO: 实现 MCP 服务器添加
      // await mcpService.addServer(formData)
      showSuccess('MCP 服务器添加成功')
      setFormData({ name: '', url: '', description: '' })
      setShowAddModal(false)
      fetchServers()
    } catch (err) {
      showError(err instanceof Error ? err.message : '添加 MCP 服务器失败')
    }
  }

  const handleDeleteServer = async (serverId: string) => {
    try {
      // TODO: 实现 MCP 服务器删除
      // await mcpService.deleteServer(serverId)
      showSuccess('MCP 服务器删除成功')
      setDeleteConfirm(null)
      fetchServers()
    } catch (err) {
      showError(err instanceof Error ? err.message : '删除 MCP 服务器失败')
    }
  }

  const handleTestConnection = async (serverId: string) => {
    try {
      // TODO: 实现连接测试
      // await mcpService.testConnection(serverId)
      showSuccess('连接测试成功')
      fetchServers()
    } catch (err) {
      showError(err instanceof Error ? err.message : '连接测试失败')
    }
  }

  const getStatusConfig = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return { label: '已连接', class: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400', icon: CheckCircle }
      case 'disconnected':
        return { label: '未连接', class: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', icon: XCircle }
      case 'error':
        return { label: '错误', class: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400', icon: XCircle }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MCP 服务器</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理 Model Context Protocol 服务器连接</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加服务器
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-12">
          <Server className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">暂无 MCP 服务器，点击添加开始</p>
        </div>
      ) : (
        /* Servers List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => {
            const statusConfig = getStatusConfig(server.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <div
                key={server.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <Server className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{server.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{server.url}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {server.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {server.description}
                  </p>
                )}

                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.class}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestConnection(server.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    测试连接
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(server.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">添加 MCP 服务器</h2>
            <form onSubmit={handleAddServer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  服务器名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="输入服务器名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  服务器 URL *
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="http://localhost:3000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="输入服务器描述"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">确认删除</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">确定要删除这个 MCP 服务器吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteServer(deleteConfirm)}
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
