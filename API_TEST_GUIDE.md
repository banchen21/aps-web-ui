# APS Web UI API 测试指南

## 测试环境准备

### 1. 启动后端服务

```bash
cd ~/Desktop/agent-parallel-system
cargo run
```

确认服务运行在 `http://127.0.0.1:8000`

### 2. 启动前端服务

```bash
cd ~/Desktop/aps-web-ui
npm install
npm run dev
```

访问 `http://localhost:5173`

## 完整测试流程

### 阶段 1: 认证测试

#### 1.1 用户注册
```typescript
// 在登录页面点击"切换到注册"
用户名: test_user_001
邮箱: test@example.com
密码: Test1234
```

**预期结果**: 
- 注册成功
- 自动登录
- 获得 access_token

#### 1.2 用户登录
```typescript
用户名: test_user_001
密码: Test1234
```

**预期结果**:
- 登录成功
- Token 保存到 localStorage
- 跳转到控制台页面

#### 1.3 获取当前用户
```typescript
// 自动调用 /auth/me
```

**预期结果**:
- 显示用户名在顶部栏
- 用户信息正确

### 阶段 2: 工作空间测试

#### 2.1 创建工作空间
```typescript
名称: 测试工作空间
描述: 用于测试的工作空间
公开: false
```

**API 调用**: `POST /workspaces`

**预期结果**:
- 工作空间创建成功
- 列表中显示新工作空间
- 返回工作空间 ID

#### 2.2 查询工作空间列表
```typescript
// 自动加载
```

**API 调用**: `GET /workspaces?page=1&page_size=20`

**预期结果**:
- 显示所有工作空间
- 包含刚创建的工作空间

#### 2.3 查询工作空间详情
```typescript
// 点击工作空间卡片
```

**API 调用**: `GET /workspaces/{workspace_id}`

**预期结果**:
- 显示完整信息
- 显示编辑表单

#### 2.4 更新工作空间
```typescript
名称: 测试工作空间（已更新）
描述: 更新后的描述
```

**API 调用**: `PUT /workspaces/{workspace_id}`

**预期结果**:
- 更新成功
- 列表刷新显示新名称

#### 2.5 工作空间统计
```typescript
// 点击"查看统计"
```

**API 调用**: `GET /workspaces/{workspace_id}/stats`

**预期结果**:
- 显示任务数量
- 显示成员数量

#### 2.6 删除工作空间
```typescript
// 点击"删除工作空间"
// 确认删除
```

**API 调用**: `DELETE /workspaces/{workspace_id}`

**预期结果**:
- 删除成功
- 从列表中移除

### 阶段 3: 任务测试

#### 3.1 创建任务
```typescript
标题: 分析 Q1 数据
描述: 生成趋势报告
优先级: medium
工作空间: 选择已创建的工作空间
```

**API 调用**: `POST /tasks`

**预期结果**:
- 任务创建成功
- 自动尝试分配给智能体
- 返回任务 ID

#### 3.2 查询任务列表
```typescript
// 点击"重新加载"
```

**API 调用**: `GET /tasks?workspace_id={id}`

**预期结果**:
- 显示所有任务
- 包含刚创建的任务

#### 3.3 查询任务详情
```typescript
// 点击任务
```

**API 调用**: `GET /tasks/{task_id}`

**预期结果**:
- 显示完整任务信息
- 包含状态、进度等

#### 3.4 更新任务状态
```typescript
状态: in_progress
进度: 50
```

**API 调用**: `PUT /tasks/{task_id}/status`

**预期结果**:
- 状态更新成功
- 进度显示 50%

#### 3.5 任务分解
```typescript
策略: Hierarchical
最大深度: 3
```

**API 调用**: `POST /tasks/{task_id}/decompose`

**预期结果**:
- 分解成功
- 生成子任务

#### 3.6 查询子任务
```typescript
// 自动调用
```

**API 调用**: `GET /tasks/{task_id}/subtasks`

**预期结果**:
- 显示所有子任务
- 子任务关联正确

### 阶段 4: 智能体测试

#### 4.1 注册智能体
```typescript
名称: test-agent-001
能力: analysis
描述: 测试智能体
```

**API 调用**: `POST /agents`

**预期结果**:
- 智能体注册成功
- 状态为 online
- 返回智能体 ID

#### 4.2 查询智能体列表
```typescript
// 切换到智能体页面
```

**API 调用**: `GET /agents`

**预期结果**:
- 显示所有智能体
- 包含刚注册的智能体

#### 4.3 按能力过滤
```typescript
能力: analysis
```

**API 调用**: `GET /agents?capabilities=analysis`

**预期结果**:
- 只显示具有 analysis 能力的智能体

#### 4.4 查询智能体详情
```typescript
// 点击智能体
```

**API 调用**: `GET /agents/{agent_id}`

**预期结果**:
- 显示完整信息
- 包含能力、端点、限制

#### 4.5 更新智能体状态
```typescript
状态: busy
```

**API 调用**: `PUT /agents/{agent_id}/status`

**预期结果**:
- 状态更新成功
- 显示为 busy

#### 4.6 心跳更新
```typescript
当前负载: 2
指标: { latency_ms: 120 }
```

**API 调用**: `POST /agents/{agent_id}/heartbeat`

**预期结果**:
- 心跳更新成功
- 最后心跳时间更新

#### 4.7 分配任务
```typescript
任务 ID: {task_id}
优先级: high
```

**API 调用**: `POST /agents/{agent_id}/assign-task`

**预期结果**:
- 任务分配成功
- 智能体负载增加

#### 4.8 完成任务
```typescript
任务 ID: {task_id}
成功: true
结果: { summary: "完成" }
```

**API 调用**: `POST /agents/{agent_id}/complete-task`

**预期结果**:
- 任务完成
- 智能体负载减少

#### 4.9 智能体统计
```typescript
// 点击"查看统计"
```

**API 调用**: `GET /agents/stats`

**预期结果**:
- 显示在线数量
- 显示总负载
- 显示平均响应时间

### 阶段 5: 工作流测试

#### 5.1 创建工作流
```typescript
名称: 数据处理流程
工作空间: {workspace_id}
定义: {
  nodes: [
    { id: "collect", type: "data_collection" },
    { id: "process", type: "data_processing" },
    { id: "report", type: "report_generation" }
  ],
  edges: [
    ["collect", "process"],
    ["process", "report"]
  ]
}
```

**API 调用**: `POST /workflows`

**预期结果**:
- 工作流创建成功
- 返回工作流 ID

#### 5.2 查询工作流列表
```typescript
工作空间: {workspace_id}
```

**API 调用**: `GET /workflows?workspace_id={id}`

**预期结果**:
- 显示所有工作流
- 包含刚创建的工作流

#### 5.3 查询工作流详情
```typescript
// 点击工作流
```

**API 调用**: `GET /workflows/{workflow_id}`

**预期结果**:
- 显示完整定义
- 显示是否激活

#### 5.4 执行工作流
```typescript
输入: { source: "test_data" }
选项: { priority: "high" }
```

**API 调用**: `POST /workflows/{workflow_id}/execute`

**预期结果**:
- 执行开始
- 创建关联任务
- 返回执行 ID

#### 5.5 查询执行记录
```typescript
// 自动加载
```

**API 调用**: `GET /workflows/{workflow_id}/executions`

**预期结果**:
- 显示所有执行记录
- 包含状态和时间

#### 5.6 查询执行详情
```typescript
// 点击执行记录
```

**API 调用**: `GET /workflows/{workflow_id}/executions/{execution_id}`

**预期结果**:
- 显示执行详情
- 包含输入输出

### 阶段 6: 消息测试

#### 6.1 发送用户消息
```typescript
目标类型: user
目标 ID: {user_id}
消息类型: notice
内容: 测试消息
```

**API 调用**: `POST /messages`

**预期结果**:
- 消息发送成功
- 返回消息 ID

#### 6.2 查询我的消息
```typescript
// 自动加载
```

**API 调用**: `GET /messages/user`

**预期结果**:
- 显示所有消息
- 包含刚发送的消息

#### 6.3 查询未读数量
```typescript
// 自动加载
```

**API 调用**: `GET /messages/user/unread-count`

**预期结果**:
- 显示未读数量
- 数字正确

#### 6.4 标记消息已读
```typescript
消息类型: user
消息 ID: {message_id}
```

**API 调用**: `POST /messages/user/{message_id}/read`

**预期结果**:
- 标记成功
- 未读数量减少

#### 6.5 批量标记已读
```typescript
消息 IDs: [id1, id2, id3]
```

**API 调用**: `POST /messages/user/read-batch`

**预期结果**:
- 批量标记成功
- 返回影响数量

#### 6.6 删除消息
```typescript
消息类型: user
消息 ID: {message_id}
```

**API 调用**: `DELETE /messages/user/{message_id}`

**预期结果**:
- 删除成功
- 从列表移除

#### 6.7 系统广播
```typescript
消息类型: system_notice
内容: 系统维护通知
```

**API 调用**: `POST /messages/broadcast`

**预期结果**:
- 广播发送成功
- 所有用户收到

### 阶段 7: 调试器测试

#### 7.1 健康检查
```typescript
方法: GET
路径: /health
```

**预期结果**:
- 返回 "OK"

#### 7.2 就绪检查
```typescript
方法: GET
路径: /ready
```

**预期结果**:
- 返回 "READY"

#### 7.3 获取接口列表
```typescript
方法: GET
路径: /ui/endpoints
```

**预期结果**:
- 返回所有接口列表
- 包含方法、路径、描述

#### 7.4 获取 API 规范
```typescript
方法: GET
路径: /ui/spec
```

**预期结果**:
- 返回完整 API 规范
- 包含版本信息

## 自动化测试脚本

### 使用 Debugger 页面测试

1. 切换到 Debugger 页面
2. 选择 HTTP 方法
3. 输入 API 路径
4. 输入请求体（如需要）
5. 点击"发送请求"
6. 查看响应结果

### 测试用例示例

```json
// 创建工作空间
POST /workspaces
{
  "name": "Test Workspace",
  "description": "For testing",
  "is_public": false
}

// 创建任务
POST /tasks
{
  "title": "Test Task",
  "description": "Test description",
  "priority": "medium",
  "workspace_id": "workspace-uuid-here",
  "requirements": {},
  "context": {},
  "metadata": {}
}

// 注册智能体
POST /agents
{
  "name": "test-agent",
  "description": "Test agent",
  "capabilities": [
    {
      "name": "analysis",
      "description": "Data analysis",
      "version": "1.0",
      "parameters": {}
    }
  ],
  "endpoints": {
    "task_execution": "http://localhost:8080/execute",
    "health_check": "http://localhost:8080/health"
  },
  "limits": {
    "max_concurrent_tasks": 4,
    "max_execution_time": 600
  }
}
```

## 常见问题

### Q1: 登录后立即退出
**原因**: Token 验证失败
**解决**: 检查后端服务是否正常运行

### Q2: 创建任务失败
**原因**: 工作空间 ID 无效
**解决**: 先创建工作空间，使用正确的 workspace_id

### Q3: 智能体列表为空
**原因**: 没有注册智能体
**解决**: 先注册至少一个智能体

### Q4: API 请求超时
**原因**: 后端服务未响应
**解决**: 检查后端服务状态和网络连接

## 测试检查清单

- [ ] 用户注册和登录
- [ ] 创建和管理工作空间
- [ ] 创建和管理任务
- [ ] 注册和管理智能体
- [ ] 创建和执行工作流
- [ ] 发送和接收消息
- [ ] 使用调试器测试 API
- [ ] 切换语言和主题
- [ ] 查看系统监控
- [ ] 测试错误处理

## 性能测试

### 并发测试
- 同时创建 10 个工作空间
- 同时创建 50 个任务
- 同时注册 20 个智能体

### 负载测试
- 持续创建任务 5 分钟
- 监控响应时间
- 检查内存使用

## 测试报告模板

```markdown
# 测试报告

**测试日期**: 2026-03-05
**测试人员**: [姓名]
**测试环境**: 
- 后端: http://127.0.0.1:8000
- 前端: http://localhost:5173

## 测试结果

| 功能模块 | 测试用例 | 状态 | 备注 |
|---------|---------|------|------|
| 认证 | 用户注册 | ✅ | 正常 |
| 认证 | 用户登录 | ✅ | 正常 |
| 工作空间 | 创建工作空间 | ✅ | 正常 |
| 任务 | 创建任务 | ✅ | 正常 |
| 智能体 | 注册智能体 | ✅ | 正常 |
| 工作流 | 创建工作流 | ✅ | 正常 |
| 消息 | 发送消息 | ✅ | 正常 |

## 发现的问题

1. [问题描述]
2. [问题描述]

## 改进建议

1. [建议内容]
2. [建议内容]
```
