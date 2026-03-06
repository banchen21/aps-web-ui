# 项目部署指南

## 概述

本指南说明如何将 React 前端项目打包，并由 Rust 后端服务，以解决跨域（CORS）问题。

## 方案说明

### 为什么选择这个方案？

- **消除 CORS 问题**：前端和后端在同一源（同一域名和端口），浏览器不会触发跨域限制
- **简化部署**：单一部署单元，便于运维和管理
- **提升性能**：减少网络往返，提高加载速度
- **生产标准**：这是现代 Web 应用的标准部署方式

## 前端打包步骤

### 1. 构建 React 项目

在项目根目录执行：

```bash
# 使用 npm
npm run build

# 或使用 pnpm
pnpm build
```

构建完成后，会生成 `dist/` 文件夹，包含所有优化后的静态资源。

### 2. 验证构建产物

```bash
ls -la dist/
```

应该看到以下文件结构：
```
dist/
├── index.html          # 主入口 HTML
├── assets/             # 打包后的 JS、CSS、图片等
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
└── vite.svg           # 静态资源
```

## Rust 后端配置

### 1. 添加依赖

在 `Cargo.toml` 中添加：

```toml
[dependencies]
tower-http = { version = "0.5", features = ["fs", "cors"] }
```

### 2. 配置静态文件服务

在 Rust 后端的路由配置中（通常在 `src/api/routes.rs` 或 `src/main.rs`）：

```rust
use tower_http::services::ServeDir;
use tower_http::cors::CorsLayer;
use std::path::PathBuf;

// 构建应用路由
let app = Router::new()
    // API 路由
    .nest("/api", api_routes())
    
    // 静态文件服务（前端构建产物）
    .fallback_service(ServeDir::new("dist"))
    
    // CORS 中间件（如果需要）
    .layer(CorsLayer::permissive());
```

### 3. 路径配置

确保 `dist/` 文件夹相对于 Rust 后端的工作目录正确。有两种方式：

**方式 A：复制 dist 到后端项目**

```bash
# 在后端项目根目录
cp -r ../aps-web-ui/dist ./dist
```

**方式 B：使用绝对路径**

```rust
let dist_path = PathBuf::from("/home/banchen/Desktop/aps-web-ui/dist");
let app = Router::new()
    .nest("/api", api_routes())
    .fallback_service(ServeDir::new(dist_path));
```

### 4. 处理 SPA 路由

为了支持 React Router 的客户端路由，需要配置 fallback：

```rust
use tower_http::services::{ServeDir, ServeFile};

let app = Router::new()
    .nest("/api", api_routes())
    .fallback_service(
        ServeDir::new("dist")
            .fallback(ServeFile::new("dist/index.html"))
    );
```

## 部署流程

### 开发环境

1. **前端开发**：
   ```bash
   npm run dev
   ```
   前端在 `http://localhost:5173` 运行

2. **后端开发**：
   ```bash
   cargo run
   ```
   后端在 `http://localhost:8000` 运行

3. **配置代理**（可选）：
   在 `vite.config.ts` 中配置代理以避免 CORS：
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

### 生产环境

1. **构建前端**：
   ```bash
   pnpm build
   ```

2. **复制到后端**：
   ```bash
   cp -r dist /path/to/backend/dist
   ```

3. **启动后端**：
   ```bash
   cargo run --release
   ```

4. **访问应用**：
   打开浏览器访问 `http://localhost:8000`

## API 请求配置

前端 API 请求需要相应调整：

### 当前配置（开发环境）

```typescript
// src/services/auth.ts
const API_BASE = 'http://localhost:8000'
```

### 生产环境配置

```typescript
// 使用相对路径，自动使用当前域名
const API_BASE = ''

// 或根据环境变量
const API_BASE = import.meta.env.VITE_API_URL || ''
```

在 `.env.production` 中：
```
VITE_API_URL=/api
```

## 环境变量配置

### 创建 `.env` 文件

```bash
# 开发环境
VITE_API_URL=http://localhost:8000

# 生产环境（在 .env.production）
VITE_API_URL=/api
```

### 更新服务层

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

## 常见问题

### Q: 前端路由不工作？
**A**: 确保 Rust 后端配置了 SPA fallback，所有非 API 请求都返回 `index.html`。

### Q: 静态资源 404？
**A**: 检查 `dist/` 路径是否正确，确保相对于后端工作目录。

### Q: 仍然有 CORS 错误？
**A**: 确认前端和后端在同一源。如果分离部署，需要在后端配置 CORS 头。

### Q: 如何更新前端代码？
**A**: 修改前端代码后，重新执行 `pnpm build`，然后重启后端。

## 性能优化

### 1. 启用 Gzip 压缩

```rust
use tower_http::compression::CompressionLayer;

let app = Router::new()
    .nest("/api", api_routes())
    .fallback_service(ServeDir::new("dist"))
    .layer(CompressionLayer::new());
```

### 2. 缓存策略

```rust
use tower_http::set_header::SetResponseHeaderLayer;
use http::header;

let app = Router::new()
    .nest("/api", api_routes())
    .fallback_service(ServeDir::new("dist"))
    .layer(SetResponseHeaderLayer::if_not_present(
        header::CACHE_CONTROL,
        "public, max-age=3600".parse().unwrap()
    ));
```

## 检查清单

- [ ] 执行 `pnpm build` 生成 `dist/` 文件夹
- [ ] 验证 `dist/index.html` 存在
- [ ] 在 Rust 后端添加 `tower-http` 依赖
- [ ] 配置静态文件服务和 SPA fallback
- [ ] 更新前端 API 基础 URL
- [ ] 测试所有路由和 API 调用
- [ ] 验证跨域问题已解决
- [ ] 配置生产环境变量

## 参考资源

- [Vite 构建指南](https://vitejs.dev/guide/build.html)
- [Axum 静态文件服务](https://docs.rs/tower-http/latest/tower_http/services/struct.ServeDir.html)
- [SPA 路由配置](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server)
