const API_BASE_URL = 'http://0.0.0.0:8000/auth'
const API_BASE_URL_V1 = 'http://0.0.0.0:8000/api/v1'
let refreshInterval: NodeJS.Timeout | null = null

export const authService = {
  // 登录
  login: (username: string, password: string) =>
    fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  // 注册
  register: (username: string, email: string, password: string) =>
    fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    }),

  // 刷新 Token
  refreshToken: () => {
    const refreshToken = localStorage.getItem('refresh_token')
    return fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
        'Accept': '*/*'
      }
    })
  },
  // 自动刷新 Token - 在后台工作
  // 4. 定时自动刷新 - 每 5 分钟执行一次
  setupAutoRefresh: () => {
    // 确保不重复启动定时器
    authService.clearAutoRefresh()

    const token = localStorage.getItem('refresh_token')
    if (!token) return

    // 定义刷新逻辑
    const performRefresh = async () => {
      try {
        const response = await authService.refreshToken()
        const result = await response.json()

        if (response.ok && result.access_token) {
          // 更新本地存储的 Access Token
          localStorage.setItem('access_token', result.access_token)
          // 如果后端返回了新的 Refresh Token，一并更新
          if (result.refresh_token) {
            localStorage.setItem('refresh_token', result.refresh_token)
          }
        } else {
          console.warn('Token 刷新失败，正在登出...')
          authService.logout()
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
      } catch (err) {
        console.error('自动刷新异常:', err)
      }
    }

    // 设置定时器：5分钟 = 5 * 60 * 1000 毫秒
    refreshInterval = setInterval(performRefresh, 1 * 60 * 1000)
  },

  // 清除定时器
  clearAutoRefresh: () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  },

  // 登出
  logout: () => {
    authService.clearAutoRefresh()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('aps_user')
  },
}
