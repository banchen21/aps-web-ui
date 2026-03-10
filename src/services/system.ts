const API_BASE_URL = 'http://0.0.0.0:8000/api/v1'

export interface SystemInfo {
  cpu_usage: number
  used_memory: number
  total_memory: number
  disk_usage: number
  total_disk: number
  net_rx_speed: number
  net_tx_speed: number
}

// 获取 Auth Header
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
})

export const systemService = {
  /**
   * 获取系统信息
   */
  getSystemInfo: async (): Promise<SystemInfo> => {
    const response = await fetch(`${API_BASE_URL}/system_info`, {
      method: 'GET',
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || '获取系统信息失败')
    }

    return await response.json()
  },
}
