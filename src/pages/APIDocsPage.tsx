import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

interface Endpoint {
  method: string
  path: string
  description: string
}

const apiEndpoints: Record<string, Endpoint[]> = {
  '认证接口': [
    { method: 'POST', path: '/api/v1/auth/register', description: '用户注册接口' },
    { method: 'POST', path: '/api/v1/auth/login', description: '用户登录接口' },
    { method: 'POST', path: '/api/v1/auth/refresh', description: '刷新访问令牌' },
    { method: 'POST', path: '/api/v1/auth/logout', description: '用户登出接口' },
  ],
  '任务接口': [
    { method: 'GET', path: '/api/v1/tasks', description: '获取任务列表' },
    { method: 'POST', path: '/api/v1/tasks', description: '创建新任务' },
    { method: 'GET', path: '/api/v1/tasks/{id}', description: '获取任务详情' },
    { method: 'PUT', path: '/api/v1/tasks/{id}', description: '更新任务信息' },
    { method: 'DELETE', path: '/api/v1/tasks/{id}', description: '删除任务' },
  ],
  '智能体接口': [
    { method: 'GET', path: '/api/v1/agents', description: '获取智能体列表' },
    { method: 'POST', path: '/api/v1/agents', description: '创建新智能体' },
    { method: 'GET', path: '/api/v1/agents/{id}', description: '获取智能体详情' },
    { method: 'PUT', path: '/api/v1/agents/{id}', description: '更新智能体配置' },
    { method: 'DELETE', path: '/api/v1/agents/{id}', description: '删除智能体' },
  ],
  '工作空间接口': [
    { method: 'GET', path: '/api/v1/workspaces', description: '获取工作空间列表' },
    { method: 'POST', path: '/api/v1/workspaces', description: '创建新工作空间' },
    { method: 'GET', path: '/api/v1/workspaces/{id}', description: '获取工作空间详情' },
    { method: 'PUT', path: '/api/v1/workspaces/{id}', description: '更新工作空间' },
    { method: 'DELETE', path: '/api/v1/workspaces/{id}', description: '删除工作空间' },
  ],
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
}

export default function APIDocsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['认证接口', '任务接口'])
  const [copied, setCopied] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API 文档</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">RESTful API 接口文档</p>
        </div>
      </div>

      {/* API Base URL */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">Base URL:</span>
          <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-violet-500">http://localhost:8000</code>
        </div>
      </div>

      {/* API Endpoints */}
      {Object.entries(apiEndpoints).map(([section, endpoints]) => (
        <div key={section} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection(section)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-500" />
              <span className="font-semibold text-slate-900 dark:text-white">{section}</span>
            </div>
            {expandedSections.includes(section) ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSections.includes(section) && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              {endpoints.map((endpoint, index) => (
                <div
                  key={endpoint.path}
                  className={`px-6 py-4 ${
                    index !== endpoints.length - 1
                      ? 'border-b border-slate-200 dark:border-slate-700'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${methodColors[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <code className="flex-1 font-mono text-sm text-slate-900 dark:text-white">
                      {endpoint.path}
                    </code>
                    <button
                      onClick={() => copyToClipboard(endpoint.path)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {copied === endpoint.path ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 ml-[84px]">
                    {endpoint.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
