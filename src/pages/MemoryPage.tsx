import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Edit2, Link2, Search } from 'lucide-react'
import { memoryService, MemoryNode, MemoryRelationship } from '../services/memory'
import { useToast } from '../contexts/ToastContext'

export default function MemoryPage() {
  const { showSuccess, showError } = useToast()
  const [nodes, setNodes] = useState<MemoryNode[]>([])
  const [relationships, setRelationships] = useState<MemoryRelationship[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null)
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [editingNode, setEditingNode] = useState<MemoryNode | null>(null)
  const [nodeForm, setNodeForm] = useState({
    name: '',
    description: '',
    type: 'concept',
  })
  const [relationshipForm, setRelationshipForm] = useState({
    target_id: '',
    relationship_type: 'related_to',
  })

  useEffect(() => {
    void fetchGraphData()
  }, [])

  const fetchGraphData = async (query?: string) => {
    try {
      setLoading(true)
      const data = query?.trim()
        ? await memoryService.searchNodes(query)
        : await memoryService.getNodes()
      setNodes(data)

      const relArrays = await Promise.all(
        data.map(async (node) => {
          try {
            return await memoryService.getRelationships(node.id)
          } catch {
            return [] as MemoryRelationship[]
          }
        }),
      )
      const dedup = new Map<string, MemoryRelationship>()
      relArrays.flat().forEach((r) => dedup.set(r.id, r))
      setRelationships(Array.from(dedup.values()))

      setSelectedNode((prev) => (prev ? data.find((n) => n.id === prev.id) || null : null))
    } catch (err) {
      showError(err instanceof Error ? err.message : '获取记忆节点失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    await fetchGraphData(searchQuery)
  }

  const handleSelectNode = (node: MemoryNode) => {
    setSelectedNode(node)
  }

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nodeForm.name.trim()) {
      showError('请输入节点名称')
      return
    }

    try {
      const node = await memoryService.createNode({
        name: nodeForm.name,
        description: nodeForm.description,
        type: nodeForm.type,
      })
      setNodes([...nodes, node])
      setSelectedNode(node)
      setNodeForm({ name: '', description: '', type: 'concept' })
      setShowNodeModal(false)
      showSuccess('记忆节点创建成功')
    } catch (err) {
      showError(err instanceof Error ? err.message : '创建失败')
    }
  }

  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNode || !nodeForm.name.trim()) {
      showError('请输入节点名称')
      return
    }

    try {
      const updated = await memoryService.updateNode(editingNode.id, {
        name: nodeForm.name,
        description: nodeForm.description,
        type: nodeForm.type,
      })
      setNodes(nodes.map((n) => (n.id === editingNode.id ? updated : n)))
      if (selectedNode?.id === editingNode.id) {
        setSelectedNode(updated)
      }
      setEditingNode(null)
      setNodeForm({ name: '', description: '', type: 'concept' })
      setShowNodeModal(false)
      showSuccess('记忆节点更新成功')
    } catch (err) {
      showError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('确定要删除此节点吗？')) return

    try {
      await memoryService.deleteNode(nodeId)
      setNodes(nodes.filter((n) => n.id !== nodeId))
      setRelationships(relationships.filter((r) => r.source_id !== nodeId && r.target_id !== nodeId))
      if (selectedNode?.id === nodeId) setSelectedNode(null)
      showSuccess('记忆节点删除成功')
    } catch (err) {
      showError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNode || !relationshipForm.target_id) {
      showError('请选择目标节点')
      return
    }

    try {
      const rel = await memoryService.createRelationship({
        source_id: selectedNode.id,
        target_id: relationshipForm.target_id,
        relationship_type: relationshipForm.relationship_type,
      })
      setRelationships([...relationships, rel])
      setRelationshipForm({ target_id: '', relationship_type: 'related_to' })
      setShowRelationshipModal(false)
      showSuccess('关系创建成功')
    } catch (err) {
      showError(err instanceof Error ? err.message : '创建关系失败')
    }
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('确定要删除此关系吗？')) return

    try {
      await memoryService.deleteRelationship(relationshipId)
      setRelationships(relationships.filter((r) => r.id !== relationshipId))
      showSuccess('关系删除成功')
    } catch (err) {
      showError(err instanceof Error ? err.message : '删除关系失败')
    }
  }

  const openEditModal = (node: MemoryNode) => {
    setEditingNode(node)
    setNodeForm({
      name: node.name,
      description: node.description,
      type: node.type,
    })
    setShowNodeModal(true)
  }

  const nodeMap = useMemo(() => {
    const m = new Map<string, MemoryNode>()
    nodes.forEach((n) => m.set(n.id, n))
    return m
  }, [nodes])

  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length || 1)))
    const gapX = 200
    const gapY = 150
    const startX = 120
    const startY = 100

    nodes.forEach((n, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      map.set(n.id, {
        x: startX + col * gapX,
        y: startY + row * gapY,
      })
    })
    return map
  }, [nodes])

  const canvasHeight = useMemo(() => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length || 1)))
    const rows = Math.max(1, Math.ceil((nodes.length || 1) / cols))
    return Math.max(420, rows * 150 + 140)
  }, [nodes])

  const selectedRelationships = useMemo(
    () =>
      selectedNode
        ? relationships.filter((r) => r.source_id === selectedNode.id)
        : [],
    [relationships, selectedNode],
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
      {/* 左侧：搜索与节点操作 */}
      <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">记忆图谱</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => void handleSearch()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Search size={18} />
          </button>
        </div>

        <button
          onClick={() => {
            setEditingNode(null)
            setNodeForm({ name: '', description: '', type: 'concept' })
            setShowNodeModal(true)
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-4"
        >
          <Plus size={18} />
          新建节点
        </button>

        <button
          onClick={() => void fetchGraphData()}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition mb-4"
        >
          刷新图谱
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center text-slate-500 py-8">加载中...</div>
          ) : nodes.length === 0 ? (
            <div className="text-center text-slate-500 py-8">暂无节点</div>
          ) : (
            nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => handleSelectNode(node)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selectedNode?.id === node.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="font-medium truncate">{node.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{node.type}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 中间：图谱画布 */}
      <div className="xl:col-span-6 bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          图像操作：点击节点选中，边表示关系，数据来自后端 Neo4j
        </div>
        <div className="relative overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
          {loading ? (
            <div className="h-[420px] flex items-center justify-center text-slate-500">加载图谱中...</div>
          ) : nodes.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-slate-500">暂无节点</div>
          ) : (
            <div className="relative min-w-[900px]" style={{ height: `${canvasHeight}px` }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {relationships.map((rel) => {
                  const from = nodePositions.get(rel.source_id)
                  const to = nodePositions.get(rel.target_id)
                  if (!from || !to) return null
                  return (
                    <g key={rel.id}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="#64748b"
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                      />
                      <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 6}
                        fontSize="11"
                        fill="#475569"
                        textAnchor="middle"
                      >
                        {rel.relationship_type}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {nodes.map((node) => {
                const pos = nodePositions.get(node.id)
                if (!pos) return null
                const selected = selectedNode?.id === node.id
                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className={`absolute w-36 px-3 py-2 rounded-xl text-left shadow border transition ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 hover:shadow-md'
                    }`}
                    style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                    title={node.description || node.name}
                  >
                    <div className="text-sm font-semibold truncate">{node.name}</div>
                    <div className={`text-xs truncate ${selected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {node.type}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：节点详情 */}
      <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col">
        {selectedNode ? (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedNode.name}</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">{selectedNode.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-xs rounded">
                    {selectedNode.type}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(selectedNode)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* 关系列表 */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">关系</h3>
                <button
                  onClick={() => setShowRelationshipModal(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Link2 size={16} />
                  添加关系
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {relationships.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">暂无关系</div>
                ) : (
                  selectedRelationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{rel.relationship_type}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          目标: {nodeMap.get(rel.target_id)?.name || rel.target_id}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRelationship(rel.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-600 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            在图谱中选择一个节点查看详情
          </div>
        )}
      </div>

      {/* 创建/编辑节点模态框 */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingNode ? '编辑节点' : '创建新节点'}
            </h3>

            <form onSubmit={editingNode ? handleUpdateNode : handleCreateNode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  节点名称
                </label>
                <input
                  type="text"
                  value={nodeForm.name}
                  onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入节点名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  描述
                </label>
                <textarea
                  value={nodeForm.description}
                  onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入节点描述"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  节点类型
                </label>
                <select
                  value={nodeForm.type}
                  onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="concept">概念</option>
                  <option value="entity">实体</option>
                  <option value="event">事件</option>
                  <option value="relationship">关系</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNodeModal(false)
                    setEditingNode(null)
                    setNodeForm({ name: '', description: '', type: 'concept' })
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingNode ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 创建关系模态框 */}
      {showRelationshipModal && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">创建关系</h3>

            <form onSubmit={handleCreateRelationship} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  目标节点
                </label>
                <select
                  value={relationshipForm.target_id}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, target_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择目标节点</option>
                  {nodes
                    .filter((n) => n.id !== selectedNode.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  关系类型
                </label>
                <select
                  value={relationshipForm.relationship_type}
                  onChange={(e) =>
                    setRelationshipForm({ ...relationshipForm, relationship_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="related_to">相关</option>
                  <option value="parent_of">父级</option>
                  <option value="child_of">子级</option>
                  <option value="similar_to">相似</option>
                  <option value="opposite_of">相反</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRelationshipModal(false)
                    setRelationshipForm({ target_id: '', relationship_type: 'related_to' })
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
