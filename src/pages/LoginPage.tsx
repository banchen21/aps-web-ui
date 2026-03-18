import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '../services/auth'
import { useToast } from '../contexts/ToastContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [isLogin, setIsLogin] = useState(true)

  const getFriendlyErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
      return '无法连接到服务器，请检查后端服务是否启动或网络是否可用'
    }
    if (err instanceof Error) {
      return err.message || fallback
    }
    return fallback
  }

  // Login state
  const [username, setUsername] = useState('banchen')
  const [password, setPassword] = useState('12345678')
  const [showPassword, setShowPassword] = useState(false)

  // Register state
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)

  // Common state
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 清理定时器
    return () => {
      authService.clearAutoRefresh()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authService.login(username, password)
      const raw = await response.text()
      let data: any = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = { message: raw }
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || '登录失败')
      }

      const authData = data
      localStorage.setItem('access_token', authData.access_token)
      if (authData.refresh_token) {
        localStorage.setItem('refresh_token', authData.refresh_token)
      }

      localStorage.setItem('aps_user', JSON.stringify({ username }))
      showSuccess('登录成功，正在跳转...')

      // 设置自动 Token 刷新
      authService.setupAutoRefresh()

      navigate('/dashboard')
    } catch (err) {
      showError(getFriendlyErrorMessage(err, '登录失败，请检查网络连接'))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!registerUsername || !registerEmail || !registerPassword || !registerConfirmPassword) {
      showError('请填写所有字段')
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      showError('两次输入的密码不一致')
      return
    }

    if (registerPassword.length < 6) {
      showError('密码长度至少为 6 位')
      return
    }

    setLoading(true)

    try {
      const response = await authService.register(registerUsername, registerEmail, registerPassword)
      const raw = await response.text()
      let data: any = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = { message: raw }
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || '注册失败')
      }

      showSuccess('注册成功，请登录')
      setTimeout(() => {
        setIsLogin(true)
        setRegisterUsername('')
        setRegisterEmail('')
        setRegisterPassword('')
        setRegisterConfirmPassword('')
        setUsername(registerUsername)
        setPassword(registerPassword)
      }, 1000)
    } catch (err) {
      showError(getFriendlyErrorMessage(err, '注册失败，请检查网络连接'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Parallel System</h1>
          <p className="text-slate-500 mt-2">多智能体并行协作系统</p>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="alice_01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pr-12"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium rounded-lg hover:from-violet-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录系统'
              )}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
              <input
                type="text"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pr-12"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
              <div className="relative">
                <input
                  type={showRegisterConfirmPassword ? 'text' : 'password'}
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pr-12"
                  placeholder="请再次输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showRegisterConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium rounded-lg hover:from-violet-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册账号'
              )}
            </button>
          </form>
        )}

        {/* Toggle between login and register */}
        <div className="mt-6 text-center">
          {isLogin ? (
            <>
              <span className="text-slate-500 text-sm">还没有账号？</span>
              <button
                onClick={() => {
                  setIsLogin(false)
                }}
                className="text-violet-500 hover:text-violet-600 text-sm font-medium ml-1"
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              <span className="text-slate-500 text-sm">已有账号？</span>
              <button
                onClick={() => {
                  setIsLogin(true)
                }}
                className="text-violet-500 hover:text-violet-600 text-sm font-medium ml-1"
              >
                返回登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
