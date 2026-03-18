import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from './contexts/ToastContext'
import {
  LayoutDashboard,
  Bot,
  ListTodo,
  FolderKanban,
  Activity,
  Terminal,
  BookOpen,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronRight,
  MessageCircle,
  Brain
} from 'lucide-react'

// Import pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import TasksPage from './pages/TasksPage'
import WorkspacesPage from './pages/WorkspacesPage'
import MonitorPage from './pages/MonitorPage'
import LogsPage from './pages/LogsPage'
import APIDocsPage from './pages/APIDocsPage'
import ChatPage from './pages/ChatPage'
import MemoryPage from './pages/MemoryPage'

// Import auth service
import { authService } from './services/auth'

// Import Toast components
import { ToastProvider } from './contexts/ToastContext'
import { Toast } from './components/Toast'

// Sidebar navigation items
const navItems = [
  { path: '/chat', label: '聊天', icon: MessageCircle },
  { path: '/dashboard', label: '控制台', icon: LayoutDashboard },
  { path: '/monitor', label: '系统监控', icon: Activity },
  { path: '/agents', label: '智能体', icon: Bot },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/workspaces', label: '工作空间', icon: FolderKanban },
  { path: '/memory', label: '记忆库', icon: Brain },
  { path: '/logs', label: '日志控制台', icon: Terminal },
  { path: '/api-docs', label: 'API 文档', icon: BookOpen },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const currentUsername = (() => {
    try {
      const raw = localStorage.getItem('aps_user')
      if (!raw) return '用户'
      const parsed = JSON.parse(raw)
      return parsed?.username || '用户'
    } catch {
      return '用户'
    }
  })()

  // Check auth and setup token refresh
  const token = localStorage.getItem('access_token')
  useEffect(() => {
    if (!token) {
      navigate('/login')
    } else {
      // 在应用加载时设置自动 Token 刷新
      authService.setupAutoRefresh()
    }
  }, [token, navigate])

  // Handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleLogout = () => {
    // 使用 authService 的 logout 方法，自动清理定时器
    authService.logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <div className={`font-bold text-xl text-blue-600 ${!sidebarOpen && 'hidden'}`}>
                APS
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={20} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                )
              })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2 flex-shrink-0">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                {sidebarOpen && <span>{darkMode ? '浅色' : '深色'}</span>}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <LogOut size={20} />
                {sidebarOpen && <span>登出</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{currentUsername}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">当前用户</div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/monitor" element={<MonitorPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route path="/memory" element={<MemoryPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/api-docs" element={<APIDocsPage />} />
              <Route path="/" element={<Navigate to="/chat" replace />} />
            </Routes>
          </main>
        </div>
      </div>

    </div>
  )
}

function AppRouter() {
  const { messages, removeMessage } = useToast()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
      <Toast messages={messages} onRemove={removeMessage} />
    </BrowserRouter>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  )
}

export default App
