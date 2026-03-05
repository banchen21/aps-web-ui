# APS Web UI 部署指南

## 部署方式

### 方式 1: 静态文件部署（推荐）

#### 1.1 构建生产版本

```bash
cd ~/Desktop/aps-web-ui
npm run build
```

构建产物在 `dist/` 目录。

#### 1.2 使用 Nginx 部署

**安装 Nginx**:
```bash
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL
```

**配置 Nginx** (`/etc/nginx/sites-available/aps-web-ui`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/aps-web-ui;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**启用配置**:
```bash
sudo ln -s /etc/nginx/sites-available/aps-web-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 1.3 使用 Apache 部署

**配置 Apache** (`/etc/apache2/sites-available/aps-web-ui.conf`):
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/aps-web-ui

    <Directory /var/www/aps-web-ui>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA 路由支持
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # API 代理
    ProxyPass /api/ http://127.0.0.1:8000/
    ProxyPassReverse /api/ http://127.0.0.1:8000/
</VirtualHost>
```

### 方式 2: Docker 部署

#### 2.1 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2.2 创建 nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 2.3 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - aps-network

  backend:
    image: agent-parallel-system:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://postgres:password@db:5432/agent_system
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    networks:
      - aps-network

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=agent_system
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - aps-network

  redis:
    image: redis:7-alpine
    networks:
      - aps-network

networks:
  aps-network:
    driver: bridge

volumes:
  postgres_data:
```

#### 2.4 构建和运行

```bash
docker-compose up -d
```

### 方式 3: CDN 部署

#### 3.1 上传到 CDN

```bash
# 构建
npm run build

# 上传到 CDN（示例：阿里云 OSS）
ossutil cp -r dist/ oss://your-bucket/aps-web-ui/
```

#### 3.2 配置 CDN

- 设置默认首页为 `index.html`
- 配置 404 页面重定向到 `index.html`
- 启用 HTTPS
- 配置缓存规则

## 环境变量配置

### 开发环境

创建 `.env.development`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_TITLE=APS Web UI (Dev)
```

### 生产环境

创建 `.env.production`:
```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_TITLE=APS Web UI
```

## HTTPS 配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### Nginx HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /var/www/aps-web-ui;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 性能优化

### 1. 启用 Gzip 压缩

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置缓存

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(html)$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 3. 启用 HTTP/2

```nginx
listen 443 ssl http2;
```

### 4. 使用 CDN

- 将静态资源上传到 CDN
- 配置 CDN 加速
- 使用就近节点

## 监控和日志

### Nginx 访问日志

```nginx
access_log /var/log/nginx/aps-web-ui-access.log;
error_log /var/log/nginx/aps-web-ui-error.log;
```

### 查看日志

```bash
# 实时查看访问日志
tail -f /var/log/nginx/aps-web-ui-access.log

# 查看错误日志
tail -f /var/log/nginx/aps-web-ui-error.log
```

## 备份和恢复

### 备份

```bash
# 备份构建产物
tar -czf aps-web-ui-$(date +%Y%m%d).tar.gz dist/

# 备份配置
cp /etc/nginx/sites-available/aps-web-ui aps-web-ui-nginx-$(date +%Y%m%d).conf
```

### 恢复

```bash
# 恢复文件
tar -xzf aps-web-ui-20260305.tar.gz -C /var/www/

# 恢复配置
cp aps-web-ui-nginx-20260305.conf /etc/nginx/sites-available/aps-web-ui
sudo systemctl reload nginx
```

## 安全建议

1. **启用 HTTPS**
   - 使用 Let's Encrypt 免费证书
   - 强制 HTTPS 重定向

2. **配置 CORS**
   - 限制允许的域名
   - 配置正确的 CORS 头

3. **隐藏版本信息**
   ```nginx
   server_tokens off;
   ```

4. **限制请求大小**
   ```nginx
   client_max_body_size 10M;
   ```

5. **防止 DDoS**
   ```nginx
   limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
   limit_req zone=one burst=20;
   ```

## 故障排除

### 404 错误
- 检查 Nginx 配置中的 `try_files`
- 确认 SPA 路由配置正确

### API 请求失败
- 检查代理配置
- 确认后端服务运行正常
- 查看 CORS 配置

### 静态资源加载失败
- 检查文件路径
- 确认权限设置正确
- 查看 Nginx 错误日志

## 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 备份当前版本
sudo mv /var/www/aps-web-ui /var/www/aps-web-ui.bak

# 5. 部署新版本
sudo cp -r dist /var/www/aps-web-ui

# 6. 重启服务
sudo systemctl reload nginx

# 7. 验证
curl -I https://your-domain.com
```

## 回滚

```bash
# 恢复备份
sudo rm -rf /var/www/aps-web-ui
sudo mv /var/www/aps-web-ui.bak /var/www/aps-web-ui
sudo systemctl reload nginx
```
