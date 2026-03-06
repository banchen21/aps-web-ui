# APS Web UI

一个基于 React + TypeScript + Vite 构建的智能体平台系统（Agent Platform System）前端应用。

## 项目概述

APS Web UI 是一个现代化的 Web 管理界面，用于管理和监控智能体系统。该系统提供了完整的智能体生命周期管理、任务调度、工作空间协作、记忆库管理和实时聊天等功能。

### 核心功能模块

- **🤖 智能体管理**：注册、监控和管理多个智能体，支持能力配置、状态监控和心跳检测
- **💬 聊天助手**：与 AI 进行实时对话，支持消息历史记录和会话管理
- **📊 控制台**：系统运行状态总览，包括实时性能监控和活动日志
- **📋 任务管理**：创建、分配和跟踪任务执行状态
- **📁 工作空间**：多用户协作空间，支持权限管理和资源共享
- **🧠 记忆库**：知识图谱式的记忆节点管理，支持节点关系和语义搜索
- **📈 系统监控**：实时监控系统资源使用情况（CPU、内存、磁盘、网络）
- **📝 日志控制台**：查看和分析系统运行日志
- **📖 API 文档**：完整的 API 接口文档

## 技术栈

### 核心框架
- **React 18.3** - UI 框架
- **TypeScript 5.6** - 类型安全
- **Vite 6.0** - 构建工具
- **React Router 6** - 路由管理

### UI 组件库
- **Radix UI** - 无障碍组件基础库
- **Tailwind CSS 3.4** - 样式框架
- **Lucide React** - 图标库
- **Recharts** - 数据可视化

### 开发工具
- **ESLint** - 代码检查
- **PostCSS** - CSS 处理
- **pnpm** - 包管理器

## 项目结构

```
aps-web-ui/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── ErrorBoundary.tsx
│   │   └── Toast.tsx
│   ├── contexts/            # React Context
│   │   └── ToastContext.tsx
│   ├── hooks/               # 自定义 Hooks
│   │   └── use-mobile.tsx
│   ├── lib/                 # 工具函数
│   │   └── utils.ts
│   ├── pages/               # 页面组件
│   │   ├── LoginPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AgentsPage.tsx
│   │   ├── TasksPage.tsx
│   │   ├── WorkspacesPage.tsx
│   │   ├── MemoryPage.tsx
│   │   ├── MonitorPage.tsx
│   │   ├── LogsPage.tsx
│   │   └── APIDocsPage.tsx
│   ├── services/            # API 服务层
│   │   ├── auth.ts          # 认证服务
│   │   ├── agent.ts         # 智能体服务
│   │   ├── chat.ts          # 聊天服务
│   │   ├── memory.ts        # 记忆库服务
│   │   └── workspace.ts     # 工作空间服务
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── public/                  # 静态资源
├── DEPLOYMENT.md            # 部署指南
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 快速开始

### 环境要求

- Node.js >= 18.0
- pnpm >= 8.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist/` 目录

### 预览生产构建

```bash
pnpm preview
```

## API 配置

所有服务层文件（`src/services/*.ts`）中的 API 基础 URL 默认配置为：

```typescript
const API_BASE_URL = 'http://localhost:8000'
```

### 环境变量配置

可以通过环境变量来配置 API 地址：

**开发环境** (`.env`)：
```env
VITE_API_URL=http://localhost:8000
```

**生产环境** (`.env.production`)：
```env
VITE_API_URL=/api
```

然后在服务层中使用：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

## 与后端集成方案

### 方案一：开发环境代理（推荐用于开发）

在 [`vite.config.ts`](vite.config.ts:1) 中配置代理：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### 方案二：生产环境集成（推荐用于部署）

将前端构建产物集成到 Rust 后端，由后端统一提供服务，彻底解决 CORS 问题。

详细步骤请参考 [`DEPLOYMENT.md`](DEPLOYMENT.md:1) 文档。

#### 核心步骤：

1. **构建前端**
   ```bash
   pnpm build
   ```

2. **配置 Rust 后端**（在后端项目中）
   
   添加依赖到 `Cargo.toml`：
   ```toml
   [dependencies]
   tower-http = { version = "0.5", features = ["fs", "cors"] }
   ```

   配置静态文件服务：
   ```rust
   use tower_http::services::{ServeDir, ServeFile};
   
   let app = Router::new()
       .nest("/api", api_routes())
       .fallback_service(
           ServeDir::new("dist")
               .fallback(ServeFile::new("dist/index.html"))
       );
   ```

3. **复制构建产物到后端**
   ```bash
   cp -r dist /path/to/backend/dist
   ```

4. **启动后端服务**
   ```bash
   cargo run --release
   ```

访问 `http://localhost:8000` 即可使用完整应用。

## 核心功能说明

### 认证系统

- JWT Token 认证
- 自动 Token 刷新机制（在过期前 5 分钟自动刷新）
- 登录/注册功能
- 安全的登出处理

实现位置：[`src/services/auth.ts`](src/services/auth.ts:1)

### 智能体管理

支持的操作：
- 注册新智能体
- 查看智能体列表和详情
- 更新智能体状态（online/offline/busy/idle/error）
- 心跳监控
- 任务分配和完成
- 智能体删除
- 统计信息查看

实现位置：[`src/services/agent.ts`](src/services/agent.ts:1)、[`src/pages/AgentsPage.tsx`](src/pages/AgentsPage.tsx:1)

### 聊天系统

- 实时消息发送和接收
- 会话历史记录
- 消息自动滚动
- Token 使用统计

实现位置：[`src/services/chat.ts`](src/services/chat.ts:1)、[`src/pages/ChatPage.tsx`](src/pages/ChatPage.tsx:1)

### 记忆库（知识图谱）

- 创建和管理记忆节点
- 建立节点间的关系
- 语义搜索
- 节点类型分类
- 元数据管理

实现位置：[`src/services/memory.ts`](src/services/memory.ts:1)、[`src/pages/MemoryPage.tsx`](src/pages/MemoryPage.tsx:1)

### 工作空间

- 创建和管理工作空间
- 权限管理（授予/撤销）
- 公开/私有空间设置
- 文档和工具管理
- 统计信息

实现位置：[`src/services/workspace.ts`](src/services/workspace.ts:1)、[`src/pages/WorkspacesPage.tsx`](src/pages/WorkspacesPage.tsx:1)

## 主题支持

应用支持亮色/暗色主题切换，主题状态保存在 localStorage 中。

切换逻辑位于：[`src/App.tsx`](src/App.tsx:72)

## 错误处理

- 全局错误边界：[`src/components/ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx:1)
- Toast 通知系统：[`src/components/Toast.tsx`](src/components/Toast.tsx:1)
- API 错误统一处理

## 尚未完成的功能

### 1. 任务管理模块（TasksPage）

**状态**：页面组件存在但功能未实现

**缺失内容**：
- 任务服务层（`src/services/task.ts`）未创建
- 任务 CRUD 操作
- 任务状态管理（pending/running/completed/failed）
- 任务分配给智能体
- 任务优先级和调度
- 任务执行结果查看

**需要实现**：
```typescript
// src/services/task.ts
export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: number
  assigned_agent_id?: string
  created_at: string
  updated_at: string
}

export const taskService = {
  getTasks: () => Promise<Task[]>
  createTask: (task: CreateTaskRequest) => Promise<Task>
  updateTask: (id: string, task: UpdateTaskRequest) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  assignTask: (id: string, agentId: string) => Promise<Task>
}
```

### 2. 系统监控模块（MonitorPage）

**状态**：页面组件存在但使用模拟数据

**缺失内容**：
- 实时系统指标 API 集成
- WebSocket 实时数据推送
- 历史数据查询
- 告警阈值配置
- 性能趋势分析

**需要实现**：
- 监控服务层（`src/services/monitor.ts`）
- WebSocket 连接管理
- 实时数据更新机制

### 3. 日志控制台（LogsPage）

**状态**：页面组件存在但功能未实现

**缺失内容**：
- 日志服务层（`src/services/logs.ts`）
- 日志查询和过滤
- 日志级别筛选（debug/info/warn/error）
- 日志搜索
- 日志导出
- 实时日志流

### 4. API 文档页面（APIDocsPage）

**状态**：页面组件存在但内容为空

**缺失内容**：
- API 文档内容
- 交互式 API 测试
- 请求/响应示例
- 认证说明

**建议**：集成 Swagger UI 或 Redoc

### 5. 环境变量管理

**缺失内容**：
- `.env` 文件未创建
- 环境变量配置说明不完整
- API_BASE_URL 硬编码在各个服务文件中

**需要改进**：
- 创建 `.env.example` 模板
- 统一 API 配置管理
- 支持多环境配置

### 6. 测试

**缺失内容**：
- 单元测试
- 集成测试
- E2E 测试

**建议**：
- 添加 Vitest 进行单元测试
- 使用 Playwright（已在依赖中）进行 E2E 测试
- 添加测试覆盖率报告

### 7. 国际化（i18n）

**状态**：所有文本硬编码为中文

**需要实现**：
- 集成 react-i18next
- 提取所有文本到语言文件
- 支持中英文切换

### 8. 数据持久化

**缺失内容**：
- 离线数据缓存
- 本地状态持久化（除了认证 token）
- IndexedDB 集成

### 9. 性能优化

**待优化项**：
- 路由懒加载
- 组件代码分割
- 图片懒加载
- 虚拟滚动（长列表）
- React.memo 优化

### 10. 安全性增强

**待实现**：
- XSS 防护
- CSRF Token
- 内容安全策略（CSP）
- 敏感数据加密
- API 请求签名

### 11. 文档完善

**缺失内容**：
- 组件使用文档
- API 集成指南
- 贡献指南
- 变更日志

## 后端 API 要求

前端期望后端提供以下 API 端点：

### 认证相关
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `POST /auth/refresh` - 刷新 Token

### 智能体相关
- `GET /agents` - 获取智能体列表
- `POST /agents` - 注册智能体
- `GET /agents/:id` - 获取智能体详情
- `PUT /agents/:id/status` - 更新状态
- `POST /agents/:id/heartbeat` - 心跳更新
- `POST /agents/:id/assign-task` - 分配任务
- `POST /agents/:id/complete-task` - 完成任务
- `DELETE /agents/:id` - 删除智能体
- `GET /agents/stats` - 统计信息

### 聊天相关
- `GET /chat/sessions/:id/messages` - 获取消息历史
- `POST /chat/messages` - 发送消息

### 记忆库相关
- `GET /memory/nodes` - 获取节点列表
- `POST /memory/nodes` - 创建节点
- `GET /memory/nodes/:id` - 获取节点详情
- `PUT /memory/nodes/:id` - 更新节点
- `DELETE /memory/nodes/:id` - 删除节点
- `GET /memory/nodes/:id/relationships` - 获取关系
- `POST /memory/relationships` - 创建关系
- `DELETE /memory/relationships/:id` - 删除关系
- `GET /memory/search?q=` - 搜索节点

### 工作空间相关
- `GET /workspaces` - 获取工作空间列表
- `POST /workspaces` - 创建工作空间
- `GET /workspaces/:id` - 获取详情
- `PUT /workspaces/:id` - 更新工作空间
- `DELETE /workspaces/:id` - 删除工作空间
- `GET /workspaces/:id/permissions` - 获取权限
- `POST /workspaces/:id/permissions` - 授予权限
- `DELETE /workspaces/:id/permissions/:pid` - 撤销权限

### 响应格式

所有 API 应返回统一格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误信息",
  "message": "用户友好的错误描述"
}
```

## 开发建议

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式组件 + Hooks
- 使用 Tailwind CSS 进行样式开发
- API 调用统一在 services 层处理

### 组件开发

- 保持组件单一职责
- 提取可复用逻辑到自定义 Hooks
- 使用 Context 管理全局状态
- 合理使用 React.memo 优化性能

### 状态管理

当前使用：
- React Context（Toast、认证状态）
- 组件本地状态（useState）
- localStorage（Token 持久化）

如果应用复杂度增加，建议引入：
- Zustand 或 Redux Toolkit

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

[待定]

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

[待补充]

---

**最后更新**：2026-03-06
