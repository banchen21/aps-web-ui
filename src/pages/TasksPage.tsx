import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreVertical, CheckCircle, Clock, XCircle, Loader, Eye } from 'lucide-react'
import { taskService, TaskItem, TaskStatusGroup } from '../services/task'
import { useToast } from '../contexts/ToastContext'

const statusConfig = {
  completed: { label: '已完成', class: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400', icon: CheckCircle },
  running: { label: '进行中', class: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400', icon: Loader },
  pending: { label: '等待中', class: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', icon: Clock },
  failed: { label: '失败', class: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400', icon: XCircle },
}

const reviewStatusConfig = {
  label: '待审阅',
  class: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
  icon: Eye,
}

export default function TasksPage() {
  const AUTO_REFRESH_MS = 5000
  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState<'all' | TaskStatusGroup>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isDecisionSubmitting, setIsDecisionSubmitting] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  })

  const fetchTasks = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setIsAutoRefreshing(true)
      } else {
        setLoading(true)
      }
      const data = await taskService.getTasks()
      setTasks(data)
      setSelectedTask((prev) => {
        if (!prev) return null
        const next = data.find((item) => item.id === prev.id)
        if (!next) return null
        return {
          ...prev,
          ...next,
          review_result: next.review_result === undefined ? prev.review_result : next.review_result,
          review_approved: next.review_approved === undefined ? prev.review_approved : next.review_approved,
        }
      })
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取任务列表失败')
    } finally {
      if (silent) {
        setIsAutoRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [showError])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchTasks(true)
      }
    }

    const intervalId = window.setInterval(refreshIfVisible, AUTO_REFRESH_MS)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [fetchTasks])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      showError('请填写任务名称')
      return
    }

    try {
      await taskService.createTask({
        name: createForm.name,
        description: createForm.description,
        priority: createForm.priority,
      })
      showSuccess('任务创建成功')
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '', priority: 'medium' })
      await fetchTasks(true)
    } catch (err) {
      showError(err instanceof Error ? err.message : '创建任务失败')
    }
  }

  const tabs: Array<{ id: 'all' | TaskStatusGroup; label: string }> = [
    { id: 'all', label: '全部' },
    { id: 'running', label: '进行中' },
    { id: 'completed', label: '已完成' },
    { id: 'failed', label: '失败' },
  ]

  const filteredTasks = tasks.filter(task => {
    if (activeTab !== 'all' && task.status_group !== activeTab) return false
    if (searchTerm && !task.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN')

  const getTaskType = (task: TaskItem) => {
    if (task.priority === 'critical') return '紧急任务'
    if (task.priority === 'high') return '高优先级'
    if (task.priority === 'low') return '低优先级'
    return '常规任务'
  }

  const getStatusHint = (task: TaskItem) => {
    if (task.status === 'submitted') {
      return '已提交：Agent 已完成执行并提交结果，当前等待系统审阅并进入用户决策阶段。'
    }
    if (task.status === 'under_review') {
      return '待审阅：系统已生成执行结果，等待你接收或拒绝。'
    }
    return null
  }

  const openTaskDetail = useCallback(async (taskId: string) => {
    setIsDetailLoading(true)
    try {
      const detail = await taskService.getTask(taskId)
      setSelectedTask(detail)
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取任务详情失败')
    } finally {
      setIsDetailLoading(false)
    }
  }, [showError])

  const handleReviewDecision = useCallback(async (accept: boolean) => {
    if (!selectedTask) return

    setIsDecisionSubmitting(true)
    try {
      const updatedTask = await taskService.decideTaskReview(selectedTask.id, { accept })
      if (accept) {
        setSelectedTask(updatedTask)
      } else {
        setSelectedTask(null)
      }
      await fetchTasks(true)
      showSuccess(accept ? '已接收审阅结果' : '已拒绝审阅结果，任务重新发布')
    } catch (err) {
      showError(err instanceof Error ? err.message : '处理审阅决策失败')
    } finally {
      setIsDecisionSubmitting(false)
    }
  }, [fetchTasks, selectedTask, showError, showSuccess])

  const handleDeleteTask = useCallback(async () => {
    if (!selectedTask) return

    setIsDeletingTask(true)
    try {
      await taskService.deleteTask(selectedTask.id)
      showSuccess('任务已删除')
      setSelectedTask(null)
      await fetchTasks(true)
    } catch (err) {
      showError(err instanceof Error ? err.message : '删除任务失败')
    } finally {
      setIsDeletingTask(false)
    }
  }, [fetchTasks, selectedTask, showError, showSuccess])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">任务管理</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">查看和管理所有任务</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Loader className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-spin text-violet-500' : ''}`} />
            {isAutoRefreshing ? '自动同步中...' : '每 5 秒自动刷新'}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建任务
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          筛选
        </button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">加载中...</div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">任务 ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">任务名称</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">类型</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">执行智能体</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTasks.map((task) => {
                const statusCfg = task.status === 'under_review'
                  ? reviewStatusConfig
                  : (statusConfig[task.status_group] ?? statusConfig['pending'])
                const StatusIcon = statusCfg.icon
                const statusHint = getStatusHint(task)
                return (
                  <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">#{task.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{task.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{getTaskType(task)}</td>
                    <td className="px-6 py-4">
                      <div className="relative inline-flex group">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.class} ${statusHint ? 'cursor-help' : ''}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {task.status === 'under_review' ? '待审阅' : task.status_label}
                        </span>
                        {statusHint && (
                          <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 hidden group-hover:block whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                            {statusHint}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{task.assigned_agent_name || '未分配'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatTime(task.created_at)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => void openTaskDetail(task.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">创建任务</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">任务名称 *</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">优先级</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">任务描述</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">任务详情</h2>
            {isDetailLoading ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">详情加载中...</div>
            ) : (
              <>
                <div className="space-y-3 text-sm">
                  <div><span className="text-slate-500 dark:text-slate-400">任务 ID：</span><span className="text-slate-900 dark:text-white break-all">{selectedTask.id}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">名称：</span><span className="text-slate-900 dark:text-white">{selectedTask.name}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">状态：</span><span className="text-slate-900 dark:text-white">{selectedTask.status === 'under_review' ? '待审阅' : selectedTask.status_label}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">执行智能体：</span><span className="text-slate-900 dark:text-white">{selectedTask.assigned_agent_name || '未分配'}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">创建时间：</span><span className="text-slate-900 dark:text-white">{formatTime(selectedTask.created_at)}</span></div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1">描述</p>
                    <p className="text-slate-900 dark:text-white whitespace-pre-wrap">{selectedTask.description || '无描述'}</p>
                  </div>
                  {selectedTask.review_result && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-2">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">审阅建议：</span>
                        <span className={`font-medium ${selectedTask.review_approved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {selectedTask.review_approved ? '建议通过' : '建议不通过'}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1">审阅结果</p>
                        <p className="text-slate-900 dark:text-white whitespace-pre-wrap">{selectedTask.review_result}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  {selectedTask.status === 'under_review' && selectedTask.review_result && (
                    <>
                      <button
                        onClick={() => void handleReviewDecision(false)}
                        disabled={isDecisionSubmitting}
                        className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        {isDecisionSubmitting ? '处理中...' : '拒绝审阅'}
                      </button>
                      <button
                        onClick={() => void handleReviewDecision(true)}
                        disabled={isDecisionSubmitting}
                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60"
                      >
                        {isDecisionSubmitting ? '处理中...' : '接收审阅'}
                      </button>
                    </>
                  )}
                  {(selectedTask.status === 'completed_success' || selectedTask.status === 'completed_failure') && (
                    <button
                      onClick={() => void handleDeleteTask()}
                      disabled={isDeletingTask}
                      className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-60"
                    >
                      {isDeletingTask ? '删除中...' : '删除任务'}
                    </button>
                  )}
                  <button onClick={() => setSelectedTask(null)} className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600">关闭</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
