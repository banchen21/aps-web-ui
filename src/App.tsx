import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Layers, LayoutDashboard, Activity, Settings, ClipboardCheck, Folder, Terminal, FileText } from 'lucide-react'
import { apiService } from './services/api'
import { translations, type Language } from './i18n/translations'
import type { User, Workspace, Task, Agent, ApiResult } from './types'
import Console from './pages/Console'
import Monitor from './pages/Monitor'
import Workspaces from './pages/Workspaces'
import Tasks from './pages/Tasks'
import Agents from './pages/Agents'
import Debugger from './pages/Debugger'
import './App.css'

type Section = 'console' | 'workspaces' | 'tasks' | 'agents' | 'debugger' | 'monitor'

function App() {
  const [language, setLanguage] = useState<Language>((localStorage.getItem('aps_language') as Language) || 'zh')
  const [theme, setTheme] = useState<'dark' | 'light'>((localStorage.getItem('aps_theme') as 'dark' | 'light') || 'dark')
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem('aps_base_url') || 'http://127.0.0.1:8000')
  const [token, setToken] = useState(localStorage.getItem('aps_token') || '')
  const [notice, setNotice] = useState('Ready')
  const [booting, setBooting] = useState(true)

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('alice_999')
  const [email, setEmail] = useState('alice@example.com')
  const [password, setPassword] = useState('Abcd1234')

  const [user, setUser] = useState<User | null>(null)
  const [section, setSection] = useState<Section>('console')
  const [overviewExpanded, setOverviewExpanded] = useState<'workspaces' | 'tasks' | 'agents' | null>(null)

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

  // System Monitor States
  const [cpuUsageValue, setCpuUsageValue] = useState(42)
  const [memoryUsageValue, setMemoryUsageValue] = useState(68)
  const [diskUsageValue, setDiskUsageValue] = useState(35)
  const [networkTrafficValue, setNetworkTrafficValue] = useState(127)

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

  useEffect(() => {
    localStorage.setItem('aps_language', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('aps_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const t = (key: string) => {
    const translationKey = key as keyof typeof translations.zh
    return translations[language][translationKey] || key
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    apiService.setBaseUrl(baseUrl)
    apiService.setToken(token)
  }, [baseUrl, token])

  const loadMe = async () => {
    const res = await apiService.getMe()
    if (res.success && res.data) setUser(res.data)
  }

  const loadWorkspaces = async () => {
    const res = await apiService.getWorkspaces()
    if (res.success && res.data) setWorkspaces(res.data)
  }

  const loadWorkspaceDetail = async (workspaceId: string) => {
    const res = await apiService.getWorkspace(workspaceId)
    if (res.success && res.data) {
      setWorkspaceDetail(res.data)
      setEditingWorkspaceName(res.data.name)
      setEditingWorkspaceDesc(res.data.description || '')
      setEditingWorkspaceIsPublic(res.data.is_public || false)
      setNotice(language === 'zh' ? `正在编辑: ${res.data.name}` : `Editing: ${res.data.name}`)
      // 滚动到编辑表单
      setTimeout(() => {
        const editForm = document.querySelector('form[class="panel"]:last-of-type')
        if (editForm) {
          editForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } else {
      setNotice(res.error || (language === 'zh' ? '加载工作空间详情失败' : 'Failed to load workspace details'))
    }
  }

  useEffect(() => {
    const init = async () => {
      setBooting(true)
      if (token) {
        await loadMe()
        await loadWorkspaces()
      }
      setBooting(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (token && section === 'agents') {
      loadAgents()
      loadAgentStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, token])

  const register = async (e: FormEvent) => {
    e.preventDefault()
    const res = await apiService.register(username, email, password)
    if (res.success && res.data) {
      setToken(res.data.access_token || '')
      setUser(res.data.user || null)
      setNotice('Registered successfully')
    } else {
      setNotice(res.error || 'Registration failed')
    }
  }

  const login = async (e: FormEvent) => {
    e.preventDefault()
    const res = await apiService.login(username, password)
    if (res.success && res.data) {
      setToken(res.data.access_token || '')
      setUser(res.data.user || null)
      setNotice('Logged in successfully')
    } else {
      setNotice(res.error || 'Login failed')
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    setWorkspaces([])
    setTasks([])
    setAgents([])
    setNotice('Logged out')
  }

  const createWorkspace = async (e: FormEvent) => {
    e.preventDefault()
    const res = await apiService.createWorkspace(workspaceName, workspaceDesc, workspaceIsPublic)
    if (res.success) {
      setNotice('Workspace created')
      await loadWorkspaces()
      setWorkspaceName('')
      setWorkspaceDesc('')
      setWorkspaceIsPublic(false)
    } else {
      setNotice(res.error || 'Failed to create workspace')
    }
  }

  const updateWorkspace = async (e: FormEvent) => {
    e.preventDefault()
    if (!workspaceDetail) return
    const res = await apiService.updateWorkspace(
      workspaceDetail.id,
      editingWorkspaceName,
      editingWorkspaceDesc,
      editingWorkspaceIsPublic
    )
    if (res.success) {
      setNotice('Workspace updated')
      await loadWorkspaces()
      await loadWorkspaceDetail(workspaceDetail.id)
    } else {
      setNotice(res.error || 'Failed to update workspace')
    }
  }

  const deleteWorkspace = async () => {
    if (!workspaceDetail) return
    const confirmMessage = language === 'zh'
      ? `确定要删除工作空间 "${workspaceDetail.name}" 吗？此操作无法撤销。`
      : `Are you sure you want to delete workspace "${workspaceDetail.name}"? This action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) return
    
    const res = await apiService.deleteWorkspace(workspaceDetail.id)
    if (res.success) {
      setNotice(language === 'zh' ? '工作空间已删除' : 'Workspace deleted')
      setWorkspaceDetail(null)
      setSelectedWorkspaceId('')
      await loadWorkspaces()
    } else {
      setNotice(res.error || (language === 'zh' ? '删除工作空间失败' : 'Failed to delete workspace'))
    }
  }

  const loadTasks = async () => {
    const res = await apiService.getTasks()
    if (res.success && res.data) setTasks(res.data)
  }

  const createTask = async (e: FormEvent) => {
    e.preventDefault()
    const res = await apiService.createTask(taskTitle, taskDesc, taskPriority, selectedWorkspaceId)
    if (res.success) {
      setNotice('Task created')
      await loadTasks()
      setTaskTitle('')
      setTaskDesc('')
    } else {
      setNotice(res.error || 'Failed to create task')
    }
  }

  const loadAgents = async () => {
    const res = await apiService.getAgents()
    console.log('loadAgents response:', res)
    if (res.success && res.data) {
      console.log('Setting agents:', res.data)
      setAgents(res.data)
    } else {
      console.log('Failed to load agents:', res.error)
      setNotice(res.error || 'Failed to load agents')
    }
  }

  const loadAgentStats = async () => {
    const res = await apiService.getAgentStats()
    if (res.success && res.data) setAgentStats(res.data as Record<string, unknown>)
  }

  const registerAgent = async (e: FormEvent) => {
    e.preventDefault()
    const res = await apiService.registerAgent(agentName, [agentCapability])
    if (res.success) {
      setNotice('Agent registered')
      await loadAgents()
      setAgentName(`agent-${Date.now().toString().slice(-6)}`)
    } else {
      setNotice(res.error || 'Failed to register agent')
    }
  }

  const sendRawRequest = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const url = `${baseUrl}${reqPath}`
      const options: RequestInit = {
        method: reqMethod,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
      if (reqMethod !== 'GET' && reqBody.trim()) {
        options.body = reqBody
      }
      const response = await fetch(url, options)
      const data = await response.json()
      setReqResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setReqResult(`Error: ${err}`)
    }
  }

  if (booting) {
    return <div className="loading">Loading...</div>
  }

  if (!token) {
    return (
      <div className="auth-container">
        <form className="auth-card" onSubmit={authMode === 'login' ? login : register}>
          <h2>{authMode === 'login' ? t('login') : t('registerBtn')}</h2>
          <label>
            {t('username')}
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            {t('password')}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {authMode === 'register' && (
            <label>
              {t('email')}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          )}
          <label>
            Base URL
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </label>
          <button type="submit">{authMode === 'login' ? t('login') : t('registerBtn')}</button>
          <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? t('switchToRegister') : t('switchToLogin')}
          </button>
          <div className="notice">{notice}</div>
        </form>
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Layers className="brand-icon" size={28} strokeWidth={2} />
          <span className="brand-text">{t('systemName')}</span>
        </div>
        <nav>
          <div className="nav-group">
            <div className="nav-category">{t('overview')}</div>
            <button
              className={section === 'console' ? 'active' : ''}
              onClick={() => setSection('console')}
            >
              <LayoutDashboard size={20} strokeWidth={2} />
              {t('console')}
            </button>
            <button
              className={section === 'monitor' ? 'active' : ''}
              onClick={() => setSection('monitor')}
            >
              <Activity size={20} strokeWidth={2} />
              {t('monitor')}
            </button>
          </div>

          <div className="nav-group">
            <div className="nav-category">{t('management')}</div>
            <button
              className={section === 'workspaces' ? 'active' : ''}
              onClick={() => setSection('workspaces')}
            >
              <Folder size={20} strokeWidth={2} />
              {t('workspaces')}
            </button>
            <button
              className={section === 'tasks' ? 'active' : ''}
              onClick={() => setSection('tasks')}
            >
              <ClipboardCheck size={20} strokeWidth={2} />
              {t('tasks')}
            </button>
            <button
              className={section === 'agents' ? 'active' : ''}
              onClick={() => setSection('agents')}
            >
              <FileText size={20} strokeWidth={2} />
              {t('agents')}
            </button>
          </div>

          <div className="nav-group">
            <div className="nav-category">{t('tools')}</div>
            <button
              className={section === 'debugger' ? 'active' : ''}
              onClick={() => setSection('debugger')}
            >
              <Terminal size={20} strokeWidth={2} />
              {t('debugger')}
            </button>
          </div>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-lang-toggle" onClick={toggleLanguage}>
            {language === 'zh' ? '中文' : 'EN'} / {language === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h2>{t(section)}</h2>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user && <span className="user-name">{user.username}</span>}
            <button className="logout-btn" onClick={logout}>
              {t('logout')}
            </button>
          </div>
        </header>

        <section className="content">
          {section === 'console' && <Console language={language} t={t} />}
          
          {section === 'monitor' && (
            <Monitor
              language={language}
              t={t}
              cpuUsage={cpuUsageValue}
              memoryUsage={memoryUsageValue}
              diskUsage={diskUsageValue}
              networkTraffic={networkTrafficValue}
            />
          )}
          
          {section === 'workspaces' && (
            <Workspaces
              language={language}
              t={t}
              workspaces={workspaces}
              filteredWorkspaces={filteredWorkspaces}
              workspaceFilter={workspaceFilter}
              setWorkspaceFilter={setWorkspaceFilter}
              workspaceName={workspaceName}
              setWorkspaceName={setWorkspaceName}
              workspaceDesc={workspaceDesc}
              setWorkspaceDesc={setWorkspaceDesc}
              workspaceIsPublic={workspaceIsPublic}
              setWorkspaceIsPublic={setWorkspaceIsPublic}
              selectedWorkspaceId={selectedWorkspaceId}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
              createWorkspace={createWorkspace}
              workspaceDetail={workspaceDetail}
              loadWorkspaceDetail={loadWorkspaceDetail}
              loadWorkspaces={loadWorkspaces}
              editingWorkspaceName={editingWorkspaceName}
              setEditingWorkspaceName={setEditingWorkspaceName}
              editingWorkspaceDesc={editingWorkspaceDesc}
              setEditingWorkspaceDesc={setEditingWorkspaceDesc}
              editingWorkspaceIsPublic={editingWorkspaceIsPublic}
              setEditingWorkspaceIsPublic={setEditingWorkspaceIsPublic}
              updateWorkspace={updateWorkspace}
              deleteWorkspace={deleteWorkspace}
              setSection={(s) => setSection(s as Section)}
            />
          )}
          
          {section === 'tasks' && (
            <Tasks
              language={language}
              t={t}
              tasks={tasks}
              loadTasks={loadTasks}
              taskTitle={taskTitle}
              setTaskTitle={setTaskTitle}
              taskDesc={taskDesc}
              setTaskDesc={setTaskDesc}
              taskPriority={taskPriority}
              setTaskPriority={setTaskPriority}
              selectedWorkspaceId={selectedWorkspaceId}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
              workspaces={workspaces}
              createTask={createTask}
            />
          )}
          
          {section === 'agents' && (
            <Agents
              t={t}
              agents={agents}
              loadAgents={loadAgents}
              agentStats={agentStats}
              loadAgentStats={loadAgentStats}
              agentName={agentName}
              setAgentName={setAgentName}
              agentCapability={agentCapability}
              setAgentCapability={setAgentCapability}
              registerAgent={registerAgent}
            />
          )}
          
          {section === 'debugger' && (
            <Debugger
              t={t}
              reqMethod={reqMethod}
              setReqMethod={setReqMethod}
              reqPath={reqPath}
              setReqPath={setReqPath}
              reqBody={reqBody}
              setReqBody={setReqBody}
              reqResult={reqResult}
              sendRawRequest={sendRawRequest}
            />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
