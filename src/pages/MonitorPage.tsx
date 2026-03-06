import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Network, Activity, Server, Database, Zap, MemoryStick } from 'lucide-react'

interface MetricData {
  name: string
  value: number
  icon: typeof Cpu
  color: string
  gradient: string
}

export default function MonitorPage() {
  const [metrics, setMetrics] = useState({
    cpu: 42,
    memory: 68,
    disk: 35,
    network: 55,
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 30) + 30,
        memory: Math.floor(Math.random() * 20) + 60,
        disk: 35,
        network: Math.floor(Math.random() * 40) + 30,
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const metricCards: MetricData[] = [
    { name: 'CPU 使用率', value: metrics.cpu, icon: Cpu, color: 'text-blue-500', gradient: 'from-blue-500 to-violet-500' },
    { name: '内存使用', value: metrics.memory, icon: MemoryStick, color: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
    { name: '磁盘使用', value: metrics.disk, icon: HardDrive, color: 'text-yellow-500', gradient: 'from-yellow-500 to-orange-500' },
    { name: '网络流量', value: metrics.network, icon: Network, color: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
  ]

  const servers = [
    { name: 'API Server', status: 'online', uptime: '15天 8小时', cpu: 45, memory: 62 },
    { name: 'Worker Node 1', status: 'online', uptime: '22天 3小时', cpu: 38, memory: 55 },
    { name: 'Worker Node 2', status: 'online', uptime: '10天 12小时', cpu: 52, memory: 71 },
    { name: 'PostgreSQL', status: 'online', uptime: '30天 6小时', cpu: 28, memory: 45 },
    { name: 'Redis Cache', status: 'online', uptime: '30天 6小时', cpu: 15, memory: 32 },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">系统监控</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">实时系统资源使用情况</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-600 rounded-full text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            系统正常
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}%</span>
            </div>
            <div className="mb-2">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full transition-all duration-500`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{metric.name}</div>
          </div>
        ))}
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-violet-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">服务状态</h3>
          </div>
          <div className="space-y-4">
            {servers.map((server, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${server.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-slate-900 dark:text-white">{server.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{server.uptime}</span>
                  <span className="text-slate-500 dark:text-slate-400">CPU: {server.cpu}%</span>
                  <span className="text-slate-500 dark:text-slate-400">内存: {server.memory}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-violet-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">数据库状态</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900 dark:text-white">PostgreSQL</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">健康</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">连接数</div>
                  <div className="font-semibold text-slate-900 dark:text-white">24/100</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">查询耗时</div>
                  <div className="font-semibold text-slate-900 dark:text-white">12ms</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">缓存命中率</div>
                  <div className="font-semibold text-slate-900 dark:text-white">94%</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900 dark:text-white">Redis</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">健康</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">内存使用</div>
                  <div className="font-semibold text-slate-900 dark:text-white">256MB</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">键数量</div>
                  <div className="font-semibold text-slate-900 dark:text-white">1,234</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">命中率</div>
                  <div className="font-semibold text-slate-900 dark:text-white">98%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
