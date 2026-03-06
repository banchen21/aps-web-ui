import { useState, useEffect } from 'react'
import { Plus, Settings, Users, Bot, Folder, MoreVertical, X, AlertCircle, CheckCircle, Loader2, Edit2 } from 'lucide-react'
import { workspaceService, WorkspaceResponse } from '../services/workspace'
import { useToast } from '../contexts/ToastContext'

export default function WorkspacesPage() {
  const { showSuccess, showError } = useToast()
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  })

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const response = await workspaceService.getWorkspaces()
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '获取工作空间列表失败')
      }

      setWorkspaces(data.data || [])
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取工作空间列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showError('工作空间名称不能为空')
      return
    }

    try {
      const response = await workspaceService.createWorkspace({
        name: formData.name,
        description: formData.description,
        is_public: formData.is_public,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '创建工作空间失败')
      }

      showSuccess('工作空间创建成功')
      setFormData({ name: '', description: '', is_public: false })
      setShowCreateModal(false)
      await fetchWorkspaces()
    } catch (err) {
      showError(err instanceof Error ? err.message : '创建工作空间失败')
    }
  }

  const handleEditWorkspace = (workspace: WorkspaceResponse) => {
    setFormData({
      name: workspace.name,
      description: workspace.description || '',
      is_public: workspace.is_public,
    })
    setShowEditModal(workspace.id)
  }

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showEditModal) return

    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('工作空间名称不能为空')
      return
    }

    try {
      const response = await workspaceService.updateWorkspace(showEditModal, {
        name: formData.name,
        description: formData.description,
        is_public: formData.is_public,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '更新工作空间失败')
      }

      setSuccess('工作空间更新成功')
      setFormData({ name: '', description: '', is_public: false })
      setShowEditModal(null)
      await fetchWorkspaces()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新工作空间失败')
    }
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    setError('')
    setSuccess('')

    try {
      const response = await workspaceService.deleteWorkspace(workspaceId)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '删除工作空间失败')
      }

      setSuccess('工作空间删除成功')
      setShowDeleteConfirm(null)
      await fetchWorkspaces()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除工作空间失败')
    }
  }

  const getWorkspaceColor = (index: number) => {
    const colors = [
      'from-blue-500 to-violet-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-purple-500 to-pink-500',
      'from-cyan-500 to-blue-500',
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">工作空间</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理工作空间和项目</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true)
            setFormData({ name: '', description: '', is_public: false })
          }}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建工作空间
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">暂无工作空间，点击创建开始</p>
        </div>
      ) : (
        /* Workspaces Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace, index) => (
            <div
              key={workspace.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getWorkspaceColor(index)} flex items-center justify-center`}>
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{workspace.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{workspace.description || '无描述'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  workspace.is_public
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {workspace.is_public ? '公开' : '私有'}
                </span>
              </div>

              {/* Stats */}
              <div className="flex justify-between py-4 border-y border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-slate-900 dark:text-white">
                    <Bot className="w-4 h-4 text-slate-400" />
                    {workspace.active_task_count}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">任务</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-slate-900 dark:text-white">
                    <Folder className="w-4 h-4 text-slate-400" />
                    {workspace.document_count}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">文档</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-slate-900 dark:text-white">
                    <Users className="w-4 h-4 text-slate-400" />
                    {workspace.permissions?.length || 0}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">成员</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditWorkspace(workspace)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(workspace.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">创建工作空间</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  工作空间名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:text-white"
                  placeholder="输入工作空间名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:text-white"
                  placeholder="输入工作空间描述"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  公开工作空间
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">编辑工作空间</h2>
              <button
                onClick={() => setShowEditModal(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  工作空间名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:text-white"
                  placeholder="输入工作空间名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:text-white"
                  placeholder="输入工作空间描述"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="edit_is_public" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  公开工作空间
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors"
                >
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">确认删除</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              确定要删除这个工作空间吗？此操作无法撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteWorkspace(showDeleteConfirm)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
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
