# APS Web UI

Agent Parallel System 的现代化 Web 管理界面。

## 功能特性

### ✅ 已完成的功能

#### 1. 认证系统
- ✅ 用户注册
- ✅ 用户登录
- ✅ Token 刷新
- ✅ 用户登出
- ✅ 获取当前用户信息
- ✅ 修改密码

#### 2. 工作空间管理
- ✅ 创建工作空间
- ✅ 查询工作空间列表
- ✅ 查询工作空间详情
- ✅ 更新工作空间
- ✅ 删除工作空间
- ✅ 权限管理（授予/撤销）
- ✅ 查询文档列表
- ✅ 查询工具列表
- ✅ 工作空间统计

#### 3. 任务管理
- ✅ 创建任务（自动分配）
- ✅ 查询任务列表（支持过滤）
- ✅ 查询任务详情
- ✅ 更新任务
- ✅ 删除任务
- ✅ 更新任务状态
- ✅ 任务分解
- ✅ 查询子任务

#### 4. 智能体管理
- ✅ 注册智能体
- ✅ 查询智能体列表（支持能力过滤）
- ✅ 查询智能体详情
- ✅ 心跳更新
- ✅ 更新智能体状态
- ✅ 分配任务给智能体
- ✅ 完成任务并释放智能体
- ✅ 智能体统计

#### 5. 工作流管理
- ✅ 创建工作流
- ✅ 查询工作流列表
- ✅ 查询工作流详情
- ✅ 删除工作流
- ✅ 执行工作流
- ✅ 查询执行记录列表
- ✅ 查询执行记录详情

#### 6. 消息系统
- ✅ 发送消息（agent/task/user/system）
- ✅ 查询用户消息
- ✅ 查询未读消息数
- ✅ 查询智能体消息
- ✅ 查询任务消息
- ✅ 标记消息已读
- ✅ 删除消息
- ✅ 批量标记已读
- ✅ 批量删除消息
- ✅ 系统广播

#### 7. 系统监控
- ✅ 健康检查
- ✅ 就绪检查
- ✅ 获取 API 规范
- ✅ 获取接口列表

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: CSS + Tailwind CSS
- **状态管理**: React Hooks
- **HTTP 客户端**: Fetch API
- **图标**: Lucide React

## 项目结构

```
aps-web-ui/
├── src/
│   ├── assets/          # 静态资源
│   ├── context/         # React Context
│   ├── hooks/           # 自定义 Hooks
│   ├── i18n/            # 国际化
│   ├── pages/           # 页面组件
│   │   ├── Console.tsx  # 控制台
│   │   ├── Monitor.tsx  # 系统监控
│   │   ├── Workspaces.tsx # 工作空间
│   │   ├── Tasks.tsx    # 任务管理
│   │   ├── Agents.tsx   # 智能体管理
│   │   └── Debugger.tsx # API 调试器
│   ├── services/        # API 服务
│   │   └── api.ts       # ✅ 完整的 API 集成
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts     # ✅ 完整的类型定义
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 应用入口
├── public/              # 公共资源
├── package.json         # 依赖配置
└── vite.config.ts       # Vite 配置
```

## 快速开始

### 前置要求

- Node.js >= 18
- npm 或 yarn
- Agent Parallel System 后端服务运行在 `http://127.0.0.1:8000`

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:5173`

### 生产构建

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 配置

### API 基础地址

默认连接到 `http://127.0.0.1:8000`，可在登录页面修改。

### 本地存储

应用使用 localStorage 存储以下信息：
- `aps_base_url`: API 基础地址
- `aps_token`: 访问令牌
- `aps_language`: 界面语言（zh/en）
- `aps_theme`: 主题（dark/light）

## API 集成说明

### 完整的 API 覆盖

所有 API 接口已完整集成，包括：

1. **认证 API** (6个接口)
2. **工作空间 API** (10个接口)
3. **任务 API** (8个接口)
4. **智能体 API** (9个接口)
5. **工作流 API** (7个接口)
6. **消息 API** (10个接口)
7. **系统 API** (4个接口)

### 使用示例

```typescript
import { apiService } from './services/api'

// 设置基础地址和令牌
apiService.setBaseUrl('http://127.0.0.1:8000')
apiService.setToken('your-access-token')

// 登录
const loginResult = await apiService.login('username', 'password')
if (loginResult.success) {
  apiService.setToken(loginResult.data.access_token)
}

// 创建工作空间
const workspace = await apiService.createWorkspace('My Workspace', 'Description')

// 创建任务
const task = await apiService.createTask(
  'Task Title',
  'Task Description',
  'medium',
  workspaceId
)

// 注册智能体
const agent = await apiService.registerAgent(
  'agent-name',
  ['analysis', 'processing']
)

// 创建工作流
const workflow = await apiService.createWorkflow(
  'Workflow Name',
  workspaceId,
  { nodes: [], edges: [] }
)

// 发送消息
await apiService.sendMessage('user', userId, 'notice', 'Hello')
```

## 类型定义

完整的 TypeScript 类型定义在 `src/types/index.ts`：

- `User` - 用户
- `AuthResponse` - 认证响应
- `Workspace` - 工作空间
- `Task` - 任务
- `Agent` - 智能体
- `Workflow` - 工作流
- `WorkflowExecution` - 工作流执行
- `Message` - 消息
- `Permission` - 权限
- `ApiResult<T>` - API 响应

## 国际化

支持中文和英文双语切换，翻译文件在 `src/i18n/translations.ts`。

## 主题

支持深色和浅色主题切换。

## 开发指南

### 添加新的 API 接口

1. 在 `src/types/index.ts` 添加类型定义
2. 在 `src/services/api.ts` 添加 API 方法
3. 在页面组件中调用

### 添加新页面

1. 在 `src/pages/` 创建新组件
2. 在 `App.tsx` 中导入并添加路由
3. 在侧边栏添加导航按钮

## 测试

### 手动测试流程

1. **认证测试**
   - 注册新用户
   - 登录
   - 查看用户信息
   - 修改密码
   - 登出

2. **工作空间测试**
   - 创建工作空间
   - 查看工作空间列表
   - 编辑工作空间
   - 删除工作空间

3. **任务测试**
   - 创建任务
   - 查看任务列表
   - 更新任务状态
   - 删除任务

4. **智能体测试**
   - 注册智能体
   - 查看智能体列表
   - 查看智能体统计

5. **调试器测试**
   - 使用 API 调试器测试各个接口

### API 测试工具

使用内置的 Debugger 页面测试所有 API 接口：

1. 选择 HTTP 方法
2. 输入 API 路径
3. 输入请求体（JSON）
4. 点击发送
5. 查看响应

## 故障排除

### 连接失败

- 确认后端服务运行在 `http://127.0.0.1:8000`
- 检查 CORS 配置
- 查看浏览器控制台错误

### 认证失败

- 确认用户名和密码正确
- 检查 token 是否过期
- 尝试重新登录

### API 错误

- 查看浏览器 Network 标签
- 检查请求和响应内容
- 使用 Debugger 页面测试

## 更新日志

### v1.0.0 (2026-03-05)

- ✅ 完整实现所有 API 接口集成
- ✅ 完善类型定义系统
- ✅ 支持所有后端功能
- ✅ 添加工作流管理
- ✅ 添加消息系统
- ✅ 完善错误处理
- ✅ 优化用户体验

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT
