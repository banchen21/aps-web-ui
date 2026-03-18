import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Wrench } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { McpToolDefinition, mcpService } from '../services/mcp'

type FormState = {
  toolId: string
  description: string
  endpoint: string
  method: string
  timeoutMs: number
  maxRetries: number
}

const DEFAULT_FORM: FormState = {
  toolId: '',
  description: '',
  endpoint: '',
  method: 'POST',
  timeoutMs: 30000,
  maxRetries: 2,
}

function buildToolPayload(form: FormState): McpToolDefinition {
  return {
    toolId: form.toolId.trim(),
    description: form.description.trim(),
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    options: {
      timeoutMs: Number(form.timeoutMs) || 30000,
      maxRetries: Number(form.maxRetries) || 2,
    },
    execution: {
      transport: 'http',
      endpoint: form.endpoint.trim(),
      method: form.method.trim() || 'POST',
      headers: {},
    },
  }
}

function toFormState(tool: McpToolDefinition): FormState {
  return {
    toolId: tool.toolId,
    description: tool.description || '',
    endpoint: tool.execution?.endpoint || '',
    method: tool.execution?.method || 'POST',
    timeoutMs: tool.options?.timeoutMs ?? 30000,
    maxRetries: tool.options?.maxRetries ?? 2,
  }
}

export default function McpToolsPage() {
  const { showError, showSuccess } = useToast()
  const [tools, setTools] = useState<McpToolDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingToolId, setEditingToolId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [keyword, setKeyword] = useState('')

  const isEditing = editingToolId !== null

  const filteredTools = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return tools
    return tools.filter((tool) => {
      return (
        tool.toolId.toLowerCase().includes(q) ||
        (tool.description || '').toLowerCase().includes(q) ||
        (tool.execution?.endpoint || '').toLowerCase().includes(q)
      )
    })
  }, [keyword, tools])

  const fetchTools = async () => {
    try {
      setLoading(true)
      const data = await mcpService.listTools()
      setTools(data || [])
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取 MCP 工具失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchTools()
  }, [])

  const resetModal = () => {
    setForm(DEFAULT_FORM)
    setEditingToolId(null)
    setShowModal(false)
  }

  const openCreateModal = () => {
    setForm(DEFAULT_FORM)
    setEditingToolId(null)
    setShowModal(true)
  }

  const openEditModal = (tool: McpToolDefinition) => {
    setForm(toFormState(tool))
    setEditingToolId(tool.toolId)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.toolId.trim()) {
      showError('工具 ID 不能为空')
      return
    }
    if (!form.description.trim()) {
      showError('工具描述不能为空')
      return
    }
    if (!form.endpoint.trim()) {
      showError('Endpoint 不能为空')
      return
    }

    try {
      const payload = buildToolPayload(form)
      if (isEditing && editingToolId) {
        await mcpService.updateTool(editingToolId, payload)
        showSuccess('MCP 工具更新成功')
      } else {
        await mcpService.createTool(payload)
        showSuccess('MCP 工具创建成功')
      }
      resetModal()
      await fetchTools()
    } catch (err) {
      showError(err instanceof Error ? err.message : '保存 MCP 工具失败')
    }
  }

  const handleDelete = async (toolId: string) => {
    if (!confirm(`确定删除工具 ${toolId} 吗？`)) return
    try {
      await mcpService.deleteTool(toolId)
      showSuccess('MCP 工具已删除')
      await fetchTools()
    } catch (err) {
      showError(err instanceof Error ? err.message : '删除 MCP 工具失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MCP 工具管理</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">配置后端可调用的 MCP 工具定义</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建工具
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索 toolId / 描述 / endpoint"
          className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">加载中...</div>
        ) : filteredTools.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            <Wrench className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            暂无 MCP 工具
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tool ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">描述</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Endpoint</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">超时</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">重试</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTools.map((tool) => (
                  <tr key={tool.toolId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{tool.toolId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{tool.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 break-all">{tool.execution?.endpoint || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{tool.execution?.method || 'POST'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{tool.options?.timeoutMs ?? 0} ms</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{tool.options?.maxRetries ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(tool)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          编辑
                        </button>
                        <button
                          onClick={() => void handleDelete(tool.toolId)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-xl w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {isEditing ? '编辑 MCP 工具' : '新建 MCP 工具'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tool ID *</label>
                <input
                  value={form.toolId}
                  disabled={isEditing}
                  onChange={(e) => setForm({ ...form, toolId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-60"
                  placeholder="例如: web_search"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">描述 *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endpoint *</label>
                <input
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="例如: http://127.0.0.1:8787/tool/search"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Method</label>
                  <select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Timeout(ms)</label>
                  <input
                    type="number"
                    value={form.timeoutMs}
                    onChange={(e) => setForm({ ...form, timeoutMs: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Retries</label>
                  <input
                    type="number"
                    value={form.maxRetries}
                    onChange={(e) => setForm({ ...form, maxRetries: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600"
                >
                  {isEditing ? '保存修改' : '创建工具'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
