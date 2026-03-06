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
  Shield
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

// Import auth service
import { authService } from './services/auth'

// Import Toast components
import { ToastProvider } from './contexts/ToastContext'
import { Toast } from './components/Toast'

// Sidebar navigation items
const navItems = [
  { path: '/dashboard', label: '控制台', icon: LayoutDashboard },
  { path: '/monitor', label: '系统监控', icon: Activity },
  { path: '/agents', label: '智能体', icon: Bot },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/workspaces', label: '工作空间', icon: FolderKanban },
  { path: '/logs', label: '日志控制台', icon: Terminal },
  { path: '/api-docs', label: 'API 文档', icon: BookOpen },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const { messages, removeMessage } = useToast()

  // Check auth and setup token refresh
  const token = localStorage.getItem('aps_token')
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

  const currentNav = navItems.find(item => location.pathname.startsWith(item.path))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Toast messages={messages} onRemove={removeMessage} />
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen transition-transform duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && <span className="font-bold text-slate-900 dark:text-white">APS</span>}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </a>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {sidebarOpen && <span className="text-sm font-medium">{darkMode ? '浅色' : '深色'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm font-medium">登出</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                {currentNav && <currentNav.icon className="w-5 h-5 text-violet-600" />}
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{currentNav?.label}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">管理员</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Admin</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/api-docs" element={<APIDocsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
