import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Activity, Bot, CheckCircle, Cpu, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react'

const taskData = [
  { name: '10:00', completed: 45, new: 38 },
  { name: '11:00', completed: 62, new: 55 },
  { name: '12:00', completed: 34, new: 28 },
  { name: '13:00', completed: 71, new: 65 },
  { name: '14:00', completed: 55, new: 48 },
  { name: '15:00', completed: 68, new: 62 },
  { name: '16:00', completed: 42, new: 35 },
]

const performanceData = [
  { name: 'CPU', value: 42 },
  { name: '内存', value: 68 },
  { name: '磁盘', value: 35 },
  { name: '网络', value: 55 },
]

const activities = [
  { id: 1, type: 'success', title: '任务 #2341 已完成', time: '2 分钟前', icon: CheckCircle },
  { id: 2, type: 'info', title: '新智能体已上线', time: '15 分钟前', icon: Bot },
  { id: 3, type: 'warning', title: '系统负载较高', time: '32 分钟前', icon: Activity },
  { id: 4, type: 'success', title: '数据库备份完成', time: '1 小时前', icon: Zap },
]

const stats = [
  { label: '在线智能体', value: '24', trend: '+12%', trendUp: true, icon: Bot, color: 'bg-blue-500' },
  { label: '活跃任务', value: '156', trend: '+8%', trendUp: true, icon: Activity, color: 'bg-green-500' },
  { label: '系统可用性', value: '99.8%', trend: '稳定', trendUp: true, icon: CheckCircle, color: 'bg-purple-500' },
  { label: 'CPU 使用率', value: '42%', trend: '-3%', trendUp: false, icon: Cpu, color: 'bg-orange-500' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">控制台</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">系统运行状态总览</p>
        </div>
        <button className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2">
          <Zap className="w-4 h-4" />
          创建任务
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">任务趋势</h3>
            <div className="flex gap-2">
              {['小时', '天', '周'].map((period, i) => (
                <button
                  key={period}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    i === 0
                      ? 'bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="完成任务" />
                <Bar dataKey="new" fill="#3b82f6" radius={[4, 4, 0, 0]} name="新任务" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">最近活动</h3>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                  activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                }`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">性能概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {performanceData.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-gradient-to-r from-blue-500 to-violet-500' :
                    index === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    index === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
