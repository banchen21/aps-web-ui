# APS Web UI 快速开始指南

## 5 分钟快速上手

### 步骤 1: 确认后端服务运行

```bash
# 检查后端服务
curl http://127.0.0.1:8000/health

# 应该返回: "OK"
```

如果后端未运行，启动它：

```bash
cd ~/Desktop/agent-parallel-system
cargo run
```

### 步骤 2: 安装前端依赖

```bash
cd ~/Desktop/aps-web-ui
npm install
```

### 步骤 3: 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

### 步骤 4: 注册账号

1. 在登录页面点击"切换到注册"
2. 填写信息：
   - 用户名: `alice_999`
   - 邮箱: `alice@example.com`
   - 密码: `Abcd1234`
3. 点击"注册"

### 步骤 5: 创建工作空间

1. 登录后进入"工作空间"页面
2. 填写表单：
   - 名称: `我的第一个工作空间`
   - 描述: `测试工作空间`
3. 点击"创建"

### 步骤 6: 创建任务

1. 进入"任务"页面
2. 填写表单：
   - 标题: `分析数据`
   - 描述: `生成报告`
   - 优先级: `medium`
   - 工作空间: 选择刚创建的工作空间
3. 点击"创建"

### 步骤 7: 注册智能体

1. 进入"智能体"页面
2. 填写表单：
   - 名称: `agent-001`
   - 能力: `analysis`
3. 点击"注册"

## 完成！

现在你已经：
- ✅ 注册并登录
- ✅ 创建了工作空间
- ✅ 创建了任务
- ✅ 注册了智能体

## 下一步

### 探索更多功能

1. **工作流管理**
   - 创建自动化工作流
   - 执行工作流
   - 查看执行记录

2. **消息系统**
   - 发送消息
   - 查看未读消息
   - 系统广播

3. **系统监控**
   - 查看系统状态
   - 监控资源使用
   - 查看活动日志

4. **API 调试**
   - 使用调试器测试 API
   - 查看请求响应
   - 调试问题

### 常用操作

#### 切换语言
点击左下角的语言切换按钮（中文/EN）

#### 切换主题
点击右上角的主题按钮（☀️/🌙）

#### 修改 API 地址
在登录页面修改 Base URL

#### 查看 API 文档
访问 `http://127.0.0.1:8000/docs`

## 故障排除

### 无法连接后端
```bash
# 检查后端是否运行
ps aux | grep agent-parallel-system

# 检查端口是否被占用
lsof -i :8000

# 重启后端
cd ~/Desktop/agent-parallel-system
cargo run
```

### 前端启动失败
```bash
# 清除缓存
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 启动
npm run dev
```

### 登录失败
- 检查用户名和密码
- 确认后端服务正常
- 查看浏览器控制台错误

## 开发技巧

### 使用调试器
1. 进入"调试器"页面
2. 选择 HTTP 方法
3. 输入路径（如 `/health`）
4. 点击"发送请求"
5. 查看响应

### 查看网络请求
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 执行操作
4. 查看请求和响应

### 本地存储
```javascript
// 查看存储的数据
localStorage.getItem('aps_token')
localStorage.getItem('aps_base_url')

// 清除所有数据
localStorage.clear()
```

## 生产部署

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

### 部署到服务器
```bash
# 构建
npm run build

# 上传 dist 目录到服务器
scp -r dist/* user@server:/var/www/aps-web-ui/

# 配置 Nginx
# 参考 DEPLOYMENT.md
```

## 获取帮助

- 查看 README.md 了解完整功能
- 查看 API_TEST_GUIDE.md 了解测试方法
- 查看 DEPLOYMENT.md 了解部署方法
- 访问后端 API 文档: http://127.0.0.1:8000/docs

## 反馈

如有问题或建议，请提交 Issue。
