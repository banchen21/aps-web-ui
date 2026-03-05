export const translations = {
  zh: {
    // Auth
    login: '登录',
    registerBtn: '注册',
    username: '用户名',
    email: '邮箱',
    password: '密码',
    switchToRegister: '没有账号？注册',
    switchToLogin: '已有账号？登录',
    logout: '退出登录',
    
    // Navigation
    console: '控制台',
    workspaces: '工作空间',
    tasks: '任务管理',
    agents: '智能体',
    debugger: '调试器',
    monitor: '系统监控',
    
    // Categories
    overview: '概览',
    management: '管理',
    tools: '工具',
    
    // System
    systemName: 'APS',
    systemNameShort: 'APS',
    
    // Console
    systemOverview: '系统运行状态总览',
    createdTasks: '创建任务',
    onlineAgents: '在线智能体',
    activeTasks: '活跃任务',
    systemAvailability: '系统可用性',
    cpuUsageRate: 'CPU 使用率',
    taskTrend: '任务趋势',
    hour: '小时',
    day: '天',
    week: '周',
    completedTasks: '完成任务',
    newTasks: '新任务',
    recentActivity: '最近活动',
    viewAll: '查看全部',
    
    // Workspaces
    createWorkspace: '创建工作空间',
    workspaceName: '工作空间名称',
    description: '描述',
    isPublic: '公开',
    create: '创建',
    update: '更新',
    delete: '删除',
    reload: '重新加载',
    filter: '筛选',
    workspaceList: '工作空间列表',
    workspaceDetail: '工作空间详情',
    edit: '编辑',
    
    // Tasks
    createTask: '创建任务',
    taskTitle: '任务标题',
    taskDescription: '任务描述',
    priority: '优先级',
    low: '低',
    medium: '中',
    high: '高',
    selectWorkspace: '选择工作空间',
    taskList: '任务列表',
    
    // Agents
    registerAgent: '注册智能体',
    agentName: '智能体名称',
    capability: '能力',
    reloadList: '重新加载列表',
    reloadStats: '重新加载统计',
    agentsList: '智能体列表',
    noAgents: '暂无智能体',
    
    // Debugger
    requestDebugger: '请求调试器',
    method: '方法',
    path: '路径',
    body: '请求体',
    send: '发送',
    
    // Monitor
    systemMonitor: '系统监控',
    realtimeSystemResources: '实时系统资源使用情况',
    cpuUsage: 'CPU 使用率',
    memoryUsage: '内存使用',
    diskUsage: '磁盘使用',
    networkTraffic: '网络流量',
    realtimePerformanceChart: '实时性能图表',
    cpu: 'CPU',
    memory: '内存',
    disk: '磁盘',
    network: '网络',
    
    // Common
    ready: '就绪',
    loading: '加载中...',
    error: '错误',
    success: '成功',
  },
  en: {
    // Auth
    login: 'Login',
    registerBtn: 'Register',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    switchToRegister: 'No account? Register',
    switchToLogin: 'Have an account? Login',
    logout: 'Logout',
    
    // Navigation
    console: 'Console',
    workspaces: 'Workspaces',
    tasks: 'Tasks',
    agents: 'Agents',
    debugger: 'Debugger',
    monitor: 'System Monitor',
    
    // Categories
    overview: 'Overview',
    management: 'Management',
    tools: 'Tools',
    
    // System
    systemName: 'Agent Parallel System',
    systemNameShort: 'APS',
    
    // Console
    systemOverview: 'System Status Overview',
    createdTasks: 'Created Tasks',
    onlineAgents: 'Online Agents',
    activeTasks: 'Active Tasks',
    systemAvailability: 'System Availability',
    cpuUsageRate: 'CPU Usage',
    taskTrend: 'Task Trend',
    hour: 'Hour',
    day: 'Day',
    week: 'Week',
    completedTasks: 'Completed Tasks',
    newTasks: 'New Tasks',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    
    // Workspaces
    createWorkspace: 'Create Workspace',
    workspaceName: 'Workspace Name',
    description: 'Description',
    isPublic: 'Public',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    reload: 'Reload',
    filter: 'Filter',
    workspaceList: 'Workspace List',
    workspaceDetail: 'Workspace Detail',
    edit: 'Edit',
    
    // Tasks
    createTask: 'Create Task',
    taskTitle: 'Task Title',
    taskDescription: 'Task Description',
    priority: 'Priority',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    selectWorkspace: 'Select Workspace',
    taskList: 'Task List',
    
    // Agents
    registerAgent: 'Register Agent',
    agentName: 'Agent Name',
    capability: 'Capability',
    reloadList: 'Reload List',
    reloadStats: 'Reload Stats',
    agentsList: 'Agents List',
    noAgents: 'No agents available',
    
    // Debugger
    requestDebugger: 'Request Debugger',
    method: 'Method',
    path: 'Path',
    body: 'Body',
    send: 'Send',
    
    // Monitor
    systemMonitor: 'System Monitor',
    realtimeSystemResources: 'Real-time System Resource Usage',
    cpuUsage: 'CPU Usage',
    memoryUsage: 'Memory Usage',
    diskUsage: 'Disk Usage',
    networkTraffic: 'Network Traffic',
    realtimePerformanceChart: 'Real-time Performance Chart',
    cpu: 'CPU',
    memory: 'Memory',
    disk: 'Disk',
    network: 'Network',
    
    // Common
    ready: 'Ready',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
}

export type Language = 'zh' | 'en'
export type TranslationKey = keyof typeof translations.zh
