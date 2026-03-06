const API_BASE_URL = 'http://localhost:8000'

let refreshTokenTimeout: NodeJS.Timeout | null = null

export const authService = {
  // 登录
  login: (username: string, password: string) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  // 注册
  register: (username: string, email: string, password: string, first_name: string, last_name: string) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, first_name, last_name }),
    }),

  // 刷新 Token
  refreshToken: (refreshToken: string) =>
    fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('aps_token')}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  // 自动刷新 Token - 在后台工作
  setupAutoRefresh: () => {
    const token = localStorage.getItem('aps_token')
    const refreshToken = localStorage.getItem('aps_refresh_token')

    if (!token || !refreshToken) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresIn = payload.exp * 1000 - Date.now()
      
      // 在 token 过期前 5 分钟刷新
      const refreshTime = expiresIn - 5 * 60 * 1000

      if (refreshTokenTimeout) clearTimeout(refreshTokenTimeout)

      if (refreshTime > 0) {
        refreshTokenTimeout = setTimeout(async () => {
          try {
            const response = await authService.refreshToken(refreshToken)
            const data = await response.json()

            if (response.ok) {
              localStorage.setItem('aps_token', data.data.access_token)
              if (data.data.refresh_token) {
                localStorage.setItem('aps_refresh_token', data.data.refresh_token)
              }
              // 递归设置下一次刷新
              authService.setupAutoRefresh()
            } else {
              // Token 刷新失败，清除存储并重定向到登录
              authService.logout()
              window.location.href = '/login'
            }
          } catch (err) {
            console.error('Token refresh failed:', err)
          }
        }, refreshTime)
      }
    } catch (err) {
      console.error('Failed to parse token:', err)
    }
  },

  // 清除刷新定时器
  clearAutoRefresh: () => {
    if (refreshTokenTimeout) {
      clearTimeout(refreshTokenTimeout)
      refreshTokenTimeout = null
    }
  },

  // 登出
  logout: () => {
    authService.clearAutoRefresh()
    localStorage.removeItem('aps_token')
    localStorage.removeItem('aps_refresh_token')
    localStorage.removeItem('aps_user')
  },
}
