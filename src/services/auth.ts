const API_BASE_URL = 'http://0.0.0.0:8000'
const API_BASE_URL_V1 = 'http://0.0.0.0:8000/api/v1'
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
  register: (username: string, email: string, password: string) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password}),
    }),

  // 刷新 Token
  refreshToken: (refreshToken: string) =>
    fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  // 自动刷新 Token - 在后台工作
  setupAutoRefresh: () => {
    const token = localStorage.getItem('refresh_token')

    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresIn = payload.exp * 1000 - Date.now()
      
      // 在 token 过期前 5 分钟刷新
      const refreshTime = expiresIn - 5 * 60 * 1000

      if (refreshTokenTimeout) clearTimeout(refreshTokenTimeout)

      if (refreshTime > 0) {
        refreshTokenTimeout = setTimeout(async () => {
          try {
            const response = await authService.refreshToken(token)
            const data = await response.json()

            if (response.ok) {
              localStorage.setItem('access_token', data.data.access_token)
              if (data.data.refresh_token) {
                localStorage.setItem('refresh_token', data.data.refresh_token)
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
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('aps_user')
  },
}
