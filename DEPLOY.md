# 部署指南

## 重要说明：数据存储

当前项目使用 **文件存储**（`data/*.json`），这在 Vercel 等 Serverless 平台上 **无法持久化数据**。

### 方案对比

| 方案 | 数据存储 | 适合场景 | 成本 |
|-----|---------|---------|------|
| **Vercel + Supabase** | 云端数据库 | 生产环境，多人使用 | 免费额度够用 |
| **VPS 自建** | 服务器文件 | 需要完全控制 | 几十元/月 |
| **Vercel 仅演示** | 不持久化 | 仅展示功能 | 免费 |

---

## 方案一：Vercel + Supabase（推荐）

### 1. 创建 Supabase 项目
1. 访问 [supabase.com](https://supabase.com)
2. 注册并创建新项目
3. 记录以下信息：
   - Project URL
   - Anon Key（公开密钥）

### 2. 创建数据表

在 Supabase SQL Editor 中执行：

```sql
-- 文章表
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  article_id TEXT,
  user_id TEXT,
  user_name TEXT,
  category TEXT DEFAULT 'industry',
  pushed_to_group BOOLEAN DEFAULT false,
  added_to_client BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL
);

-- 用户名映射表
CREATE TABLE usermap (
  uid TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 新车日历表
CREATE TABLE car_calendar (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  launch_date TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  notes TEXT,
  created_at BIGINT NOT NULL
);

-- 创建索引
CREATE INDEX idx_articles_username ON articles(username);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
```

### 3. 配置环境变量

在 Vercel 项目设置中添加：
```
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的AnonKey
```

### 4. 修改代码使用 Supabase

需要将以下文件中的文件读写逻辑改为 Supabase 查询：
- `src/lib/articles-file.ts`
- `src/lib/usermap-file.ts`
- `src/lib/car-calendar-file.ts`

### 5. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产环境部署
vercel --prod
```

---

## 方案二：VPS 自建部署

### 1. 准备服务器
- 购买云服务器（阿里云/腾讯云/华为云）
- 安装 Node.js 18+
- 安装 PM2

### 2. 部署步骤

```bash
# 克隆代码
git clone 你的仓库
cd 你的项目

# 安装依赖
pnpm install

# 构建
pnpm build

# 使用 PM2 启动
pm2 start "pnpm start" --name workbench

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 配置 HTTPS（可选）

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com
```

---

## 方案三：Vercel 仅演示（数据不持久）

如果只是想展示功能，不关心数据持久化：

```bash
# 1. 推送代码到 GitHub
git push origin main

# 2. 在 Vercel 导入项目
# 3. 自动部署完成

# 注意：数据会在每次部署后重置
```

---

## 快速检查清单

- [ ] 选择部署方案
- [ ] 准备域名（可选）
- [ ] 配置环境变量
- [ ] 测试数据持久化
- [ ] 配置 HTTPS
