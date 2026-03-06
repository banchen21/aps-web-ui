import { useState } from 'react'
import { Plus, Search, Filter, MoreVertical, CheckCircle, Clock, XCircle, Loader } from 'lucide-react'

interface Task {
  id: number
  name: string
  type: string
  status: 'completed' | 'running' | 'pending' | 'failed'
  agent: string
  createdAt: string
}

const tasks: Task[] = [
  { id: 2341, name: '数据分析任务', type: '数据处理', status: 'completed', agent: 'GPT-4 Assistant', createdAt: '2024-01-15 14:30' },
  { id: 2342, name: '文档生成', type: '文本生成', status: 'running', agent: 'Claude Assistant', createdAt: '2024-01-15 14:45' },
  { id: 2343, name: '代码审查', type: '代码分析', status: 'pending', agent: 'Auto Agent', createdAt: '2024-01-15 15:00' },
  { id: 2344, name: '图像识别', type: '多模态', status: 'completed', agent: 'Data Analyzer', createdAt: '2024-01-15 13:20' },
  { id: 2345, name: 'API 调用测试', type: '系统测试', status: 'failed', agent: 'GPT-4 Assistant', createdAt: '2024-01-15 12:15' },
  { id: 2346, name: '数据清洗', type: '数据处理', status: 'completed', agent: 'Auto Agent', createdAt: '2024-01-15 11:30' },
  { id: 2347, name: '翻译任务', type: '文本生成', status: 'running', agent: 'Claude Assistant', createdAt: '2024-01-15 10:45' },
  { id: 2348, name: '模型微调', type: '机器学习', status: 'pending', agent: 'Data Analyzer', createdAt: '2024-01-15 09:20' },
]

const statusConfig = {
  completed: { label: '已完成', class: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400', icon: CheckCircle },
  running: { label: '进行中', class: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400', icon: Loader },
  pending: { label: '等待中', class: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', icon: Clock },
  failed: { label: '失败', class: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400', icon: XCircle },
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'running', label: '进行中' },
    { id: 'completed', label: '已完成' },
    { id: 'failed', label: '失败' },
  ]

  const filteredTasks = tasks.filter(task => {
    if (activeTab !== 'all' && task.status !== activeTab) return false
    if (searchTerm && !task.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">任务管理</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">查看和管理所有任务</p>
        </div>
        <button className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建任务
        </button>
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
                const StatusIcon = statusConfig[task.status].icon
                return (
                  <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">#{task.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{task.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{task.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[task.status].class}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig[task.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{task.agent}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{task.createdAt}</td>
                    <td className="px-6 py-4">
                      <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
