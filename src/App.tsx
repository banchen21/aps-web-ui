import { FormEvent, useEffect, useMemo, useState } from 'react'
import './App.css'

type ApiResult<T = unknown> = {
  success: boolean
  message?: string
  data?: T
  error?: { code: string; message: string }
}

type User = { id: string; username: string; email: string }

type Workspace = {
  id: string
  name: string
  description?: string
  owner_id?: string
  is_public?: boolean
  created_at?: string
  updated_at?: string
}

type Task = {
  id: string
  title: string
  status: string
  priority: string
  workspace_id: string
  created_at: string
}

type Agent = {
  id: string
  name: string
  status: string
  current_load: number
  max_concurrent_tasks: number
}

type Section = 'overview' | 'workspaces' | 'tasks' | 'agents' | 'debugger'

function App() {
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem('aps_base_url') || 'http://127.0.0.1:8000')
  const [token, setToken] = useState(localStorage.getItem('aps_token') || '')
  const [notice, setNotice] = useState('Ready')
  const [booting, setBooting] = useState(true)

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('alice_01')
  const [email, setEmail] = useState('alice@example.com')
  const [password, setPassword] = useState('Abcd1234')

  const [user, setUser] = useState<User | null>(null)
  const [section, setSection] = useState<Section>('overview')

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceFilter, setWorkspaceFilter] = useState('')
  const [workspaceDetail, setWorkspaceDetail] = useState<Workspace | null>(null)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [workspaceName, setWorkspaceName] = useState('Growth Workspace')
  const [workspaceDesc, setWorkspaceDesc] = useState('Work from APS Web UI')
  const [workspaceIsPublic, setWorkspaceIsPublic] = useState(false)
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('')
  const [editingWorkspaceDesc, setEditingWorkspaceDesc] = useState('')
  const [editingWorkspaceIsPublic, setEditingWorkspaceIsPublic] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])
  const [taskTitle, setTaskTitle] = useState('Analyze Q1 metrics')
  const [taskDesc, setTaskDesc] = useState('Need trend summary and risk list')
  const [taskPriority, setTaskPriority] = useState('medium')

  const [agents, setAgents] = useState<Agent[]>([])
  const [agentStats, setAgentStats] = useState<Record<string, unknown> | null>(null)
  const [agentName, setAgentName] = useState(`agent-${Date.now().toString().slice(-6)}`)
  const [agentCapability, setAgentCapability] = useState('analysis')

  const [reqMethod, setReqMethod] = useState('GET')
  const [reqPath, setReqPath] = useState('/health')
  const [reqBody, setReqBody] = useState('{}')
  const [reqResult, setReqResult] = useState('No request yet')

  const filteredWorkspaces = useMemo(() => {
    const keyword = workspaceFilter.trim().toLowerCase()
    if (!keyword) return workspaces
    return workspaces.filter((w) =>
      `${w.name} ${w.description ?? ''}`.toLowerCase().includes(keyword),
    )
  }, [workspaceFilter, workspaces])

  useEffect(() => {
    localStorage.setItem('aps_base_url', baseUrl)
  }, [baseUrl])

  useEffect(() => {
    localStorage.setItem('aps_token', token)
  }, [token])

  const callApi = async <T,>(path: string, method: string, body?: unknown): Promise<ApiResult<T>> => {
    const headers: HeadersInit = {}
    if (token) headers.Authorization = `Bearer ${token}`
    if (method !== 'GET' && method !== 'DELETE') headers['Content-Type'] = 'application/json'

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = (await res.json().catch(() => ({
      success: false,
      error: { code: 'PARSE_ERROR', message: `Unable to parse response (HTTP ${res.status})` },
    }))) as ApiResult<T>

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || `HTTP ${res.status}`)
    }
    return data
  }

  const loadMe = async () => {
    const res = await callApi<User>('/auth/me', 'GET')
    setUser(res.data || null)
  }

  const loadWorkspaces = async () => {
    const res = await callApi<Workspace[]>('/workspaces?page=1&page_size=200', 'GET')
    const list = res.data || []
    setWorkspaces(list)
    if (!selectedWorkspaceId && list[0]?.id) {
      setSelectedWorkspaceId(list[0].id)
      void loadWorkspaceDetail(list[0].id)
    }
  }

  const loadWorkspaceDetail = async (workspaceId: string) => {
    if (!workspaceId) return
    const res = await callApi<Workspace>(`/workspaces/${workspaceId}`, 'GET')
    const detail = res.data || null
    setWorkspaceDetail(detail)
    if (detail) {
      setEditingWorkspaceName(detail.name || '')
      setEditingWorkspaceDesc(detail.description || '')
      setEditingWorkspaceIsPublic(Boolean(detail.is_public))
    }
  }

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setBooting(false)
        return
      }
      try {
        await loadMe()
        await Promise.all([loadWorkspaces(), loadAgents(), loadAgentStats()])
      } catch {
        setToken('')
        setUser(null)
      } finally {
        setBooting(false)
      }
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const register = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await callApi('/auth/register', 'POST', { username, email, password })
      setNotice('Register succeeded. Please login.')
      setAuthMode('login')
    } catch (err) {
      setNotice(`Register failed: ${(err as Error).message}`)
    }
  }

  const login = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await callApi<{ access_token: string; user: User }>('/auth/login', 'POST', { username, password })
      setToken(res.data?.access_token || '')
      setUser(res.data?.user || null)
      setNotice('Login successful')
      await Promise.all([loadWorkspaces(), loadAgents(), loadAgentStats()])
    } catch (err) {
      setNotice(`Login failed: ${(err as Error).message}`)
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    setWorkspaces([])
    setWorkspaceDetail(null)
    setTasks([])
    setAgents([])
    setAgentStats(null)
    setNotice('Logged out')
  }

  const createWorkspace = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await callApi<Workspace>('/workspaces', 'POST', {
        name: workspaceName,
        description: workspaceDesc,
        is_public: workspaceIsPublic,
        context: {},
        metadata: {},
      })
      const id = res.data?.id || ''
      if (id) {
        setSelectedWorkspaceId(id)
        await loadWorkspaceDetail(id)
      }
      setNotice('Workspace created')
      await loadWorkspaces()
    } catch (err) {
      setNotice(`Create workspace failed: ${(err as Error).message}`)
    }
  }

  const updateWorkspace = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedWorkspaceId) {
      setNotice('Select workspace first')
      return
    }
    try {
      await callApi(`/workspaces/${selectedWorkspaceId}`, 'PUT', {
        name: editingWorkspaceName,
        description: editingWorkspaceDesc,
        is_public: editingWorkspaceIsPublic,
      })
      setNotice('Workspace updated')
      await Promise.all([loadWorkspaces(), loadWorkspaceDetail(selectedWorkspaceId)])
    } catch (err) {
      setNotice(`Update workspace failed: ${(err as Error).message}`)
    }
  }

  const deleteWorkspace = async () => {
    if (!selectedWorkspaceId) {
      setNotice('Select workspace first')
      return
    }
    const ok = window.confirm('Delete this workspace? This action cannot be undone.')
    if (!ok) return
    try {
      await callApi(`/workspaces/${selectedWorkspaceId}`, 'DELETE')
      setNotice('Workspace deleted')
      setWorkspaceDetail(null)
      setSelectedWorkspaceId('')
      await loadWorkspaces()
    } catch (err) {
      setNotice(`Delete workspace failed: ${(err as Error).message}`)
    }
  }

  const loadTasks = async () => {
    if (!selectedWorkspaceId) {
      setNotice('Select workspace first')
      return
    }
    const res = await callApi<Task[]>(
      `/tasks?workspace_id=${selectedWorkspaceId}&page=1&page_size=100`,
      'GET',
    )
    setTasks(res.data || [])
  }

  const createTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedWorkspaceId) {
      setNotice('Select workspace first')
      return
    }
    try {
      await callApi('/tasks', 'POST', {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        workspace_id: selectedWorkspaceId,
        requirements: {},
        context: {},
        metadata: {},
      })
      setNotice('Task created')
      await loadTasks()
    } catch (err) {
      setNotice(`Create task failed: ${(err as Error).message}`)
    }
  }

  const loadAgents = async () => {
    const res = await callApi<Agent[]>('/agents', 'GET')
    setAgents(res.data || [])
  }

  const loadAgentStats = async () => {
    const res = await callApi<Record<string, unknown>>('/agents/stats', 'GET')
    setAgentStats(res.data || null)
  }

  const registerAgent = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await callApi('/agents', 'POST', {
        name: agentName,
        description: 'Created from APS Web UI',
        capabilities: [{ name: agentCapability, description: 'capability', version: '1.0', parameters: {} }],
        endpoints: {
          task_execution: 'http://127.0.0.1:9001/run',
          health_check: 'http://127.0.0.1:9001/health',
          status_update: null,
        },
        limits: {
          max_concurrent_tasks: 2,
          max_execution_time: 600,
          max_memory_usage: null,
          rate_limit_per_minute: 60,
        },
        metadata: {},
      })
      setNotice('Agent registered')
      await Promise.all([loadAgents(), loadAgentStats()])
    } catch (err) {
      setNotice(`Register agent failed: ${(err as Error).message}`)
    }
  }

  const sendRawRequest = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const headers: HeadersInit = {}
      if (token) headers.Authorization = `Bearer ${token}`
      if (reqMethod !== 'GET' && reqMethod !== 'DELETE') headers['Content-Type'] = 'application/json'
      const response = await fetch(`${baseUrl}${reqPath}`, {
        method: reqMethod,
        headers,
        body: reqMethod === 'GET' || reqMethod === 'DELETE' ? undefined : reqBody,
      })
      const text = await response.text()
      setReqResult(`HTTP ${response.status} ${response.statusText}\n\n${text}`)
    } catch (err) {
      setReqResult(`Request failed: ${(err as Error).message}`)
    }
  }

  if (booting) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Agent Parallel System</h1>
          <p>Loading session...</p>
        </div>
      </div>
    )
  }

  if (!token || !user) {
    return (
      <div className="auth-wrap">
        <form className="auth-card" onSubmit={authMode === 'login' ? login : register}>
          <h1>Agent Parallel System</h1>
          <p className="sub">{authMode === 'login' ? 'Sign in to continue' : 'Create your account'}</p>
          <label>
            Base URL
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </label>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          {authMode === 'register' && (
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          )}
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
          <button
            type="button"
            className="ghost"
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          >
            {authMode === 'login' ? 'No account? Register' : 'Have account? Login'}
          </button>
          <div className="auth-note">{notice}</div>
        </form>
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <h2>APS</h2>
          <span>Control Center</span>
        </div>
        <nav>
          <button className={section === 'overview' ? 'active' : ''} onClick={() => setSection('overview')}>Overview</button>
          <button className={section === 'workspaces' ? 'active' : ''} onClick={() => setSection('workspaces')}>Workspaces</button>
          <button className={section === 'tasks' ? 'active' : ''} onClick={() => setSection('tasks')}>Tasks</button>
          <button className={section === 'agents' ? 'active' : ''} onClick={() => setSection('agents')}>Agents</button>
          <button className={section === 'debugger' ? 'active' : ''} onClick={() => setSection('debugger')}>API Debugger</button>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{section[0].toUpperCase() + section.slice(1)}</h1>
            <p>{notice}</p>
          </div>
          <div className="top-actions">
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            <span>{user.username}</span>
            <button className="ghost" onClick={logout}>Logout</button>
          </div>
        </header>

        <section className="content">
          {section === 'overview' && (
            <div className="grid cards3">
              <article className="panel">
                <h3>Workspaces</h3>
                <strong>{workspaces.length}</strong>
                <button onClick={() => void loadWorkspaces()}>Refresh</button>
              </article>
              <article className="panel">
                <h3>Tasks</h3>
                <strong>{tasks.length}</strong>
                <button onClick={() => void loadTasks()}>Refresh</button>
              </article>
              <article className="panel">
                <h3>Agents</h3>
                <strong>{agents.length}</strong>
                <button onClick={() => void loadAgents()}>Refresh</button>
              </article>
              <article className="panel span-3">
                <h3>Workspace Dashboard (All)</h3>
                <input
                  placeholder="Search workspace by name/description"
                  value={workspaceFilter}
                  onChange={(e) => setWorkspaceFilter(e.target.value)}
                />
                <pre>{JSON.stringify(filteredWorkspaces, null, 2)}</pre>
              </article>
            </div>
          )}

          {section === 'workspaces' && (
            <div className="grid two">
              <form className="panel" onSubmit={createWorkspace}>
                <h3>Create Workspace</h3>
                <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="workspace name" />
                <input value={workspaceDesc} onChange={(e) => setWorkspaceDesc(e.target.value)} placeholder="description" />
                <label className="row">
                  <input
                    type="checkbox"
                    checked={workspaceIsPublic}
                    onChange={(e) => setWorkspaceIsPublic(e.target.checked)}
                  />
                  is_public
                </label>
                <div className="row">
                  <button type="submit">Create</button>
                  <button type="button" className="ghost" onClick={() => void loadWorkspaces()}>Reload</button>
                </div>
              </form>

              <div className="panel">
                <h3>Query Workspace</h3>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => {
                    const id = e.target.value
                    setSelectedWorkspaceId(id)
                    void loadWorkspaceDetail(id)
                  }}
                >
                  <option value="">Select workspace</option>
                  {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input
                  placeholder="Filter list"
                  value={workspaceFilter}
                  onChange={(e) => setWorkspaceFilter(e.target.value)}
                />
                <pre>{JSON.stringify(filteredWorkspaces, null, 2)}</pre>
              </div>

              <form className="panel span-2" onSubmit={updateWorkspace}>
                <h3>Update / Delete Workspace</h3>
                <input
                  value={editingWorkspaceName}
                  onChange={(e) => setEditingWorkspaceName(e.target.value)}
                  placeholder="new name"
                />
                <input
                  value={editingWorkspaceDesc}
                  onChange={(e) => setEditingWorkspaceDesc(e.target.value)}
                  placeholder="new description"
                />
                <label className="row">
                  <input
                    type="checkbox"
                    checked={editingWorkspaceIsPublic}
                    onChange={(e) => setEditingWorkspaceIsPublic(e.target.checked)}
                  />
                  is_public
                </label>
                <div className="row">
                  <button type="submit">Update</button>
                  <button type="button" className="danger" onClick={deleteWorkspace}>Delete</button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => void loadWorkspaceDetail(selectedWorkspaceId)}
                  >
                    Query Detail
                  </button>
                </div>
                <pre>{JSON.stringify(workspaceDetail, null, 2)}</pre>
              </form>
            </div>
          )}

          {section === 'tasks' && (
            <div className="grid two">
              <form className="panel" onSubmit={createTask}>
                <h3>Create Task</h3>
                <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="task title" />
                <input value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="description" />
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
                <select value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)}>
                  <option value="">Select workspace</option>
                  {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <div className="row">
                  <button type="submit">Create</button>
                  <button type="button" className="ghost" onClick={() => void loadTasks()}>Reload</button>
                </div>
              </form>
              <div className="panel">
                <h3>Task List</h3>
                <pre>{JSON.stringify(tasks, null, 2)}</pre>
              </div>
            </div>
          )}

          {section === 'agents' && (
            <div className="grid two">
              <form className="panel" onSubmit={registerAgent}>
                <h3>Register Agent</h3>
                <input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="agent name" />
                <input value={agentCapability} onChange={(e) => setAgentCapability(e.target.value)} placeholder="capability" />
                <div className="row">
                  <button type="submit">Register</button>
                  <button type="button" className="ghost" onClick={() => void loadAgents()}>Reload List</button>
                  <button type="button" className="ghost" onClick={() => void loadAgentStats()}>Reload Stats</button>
                </div>
              </form>
              <div className="panel">
                <h3>Agents</h3>
                <pre>{JSON.stringify({ agents, stats: agentStats }, null, 2)}</pre>
              </div>
            </div>
          )}

          {section === 'debugger' && (
            <form className="panel" onSubmit={sendRawRequest}>
              <h3>Request Debugger</h3>
              <div className="row">
                <select value={reqMethod} onChange={(e) => setReqMethod(e.target.value)}>
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
                <input value={reqPath} onChange={(e) => setReqPath(e.target.value)} placeholder="/health" />
              </div>
              <textarea value={reqBody} onChange={(e) => setReqBody(e.target.value)} />
              <button type="submit">Send</button>
              <pre>{reqResult}</pre>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
