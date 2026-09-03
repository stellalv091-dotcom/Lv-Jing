# 文章工作台 - 详细部署指南

## 部署前准备

### 1. 注册 GitHub 账号（如已有可跳过）
- 访问 https://github.com
- 点击 "Sign up" 注册

### 2. 注册 Vercel 账号
- 访问 https://vercel.com
- 点击 "Sign Up"
- 选择 "Continue with GitHub"（使用 GitHub 账号登录）
- 授权 Vercel 访问你的 GitHub

---

## 第一步：将代码推送到 GitHub

### 方法一：在本地电脑上操作（推荐）

1. **安装 Git**（如未安装）
   - Windows: 下载 https://git-scm.com/download/win
   - Mac: 终端输入 `git --version`，按提示安装

2. **下载代码**
   - 在扣子工作台中，点击"下载代码"按钮
   - 解压到你想存放项目的文件夹

3. **打开终端**
   - Windows: 在项目文件夹中，按住 Shift + 右键，选择"在此处打开 PowerShell"
   - Mac: 在项目文件夹中右键，选择"新建终端"

4. **初始化 Git 仓库**
   ```bash
   git init
   ```

5. **添加所有文件**
   ```bash
   git add .
   ```

6. **提交代码**
   ```bash
   git commit -m "初始化文章工作台"
   ```

7. **在 GitHub 创建新仓库**
   - 访问 https://github.com/new
   - 仓库名填写：`article-workbench`（或其他名称）
   - **不要**勾选 "Add a README file"
   - 点击 "Create repository"

8. **关联远程仓库并推送**
   ```bash
   # 替换为你的 GitHub 用户名和仓库名
   git remote add origin https://github.com/你的用户名/article-workbench.git
   git branch -M main
   git push -u origin main
   ```

### 方法二：直接在 GitHub 网页上传

1. 访问 https://github.com/new 创建新仓库
2. 点击 "uploading an existing file"
3. 将下载的所有代码文件拖拽上传
4. 点击 "Commit changes"

---

## 第二步：在 Vercel 部署

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 点击 "Add New..." → "Project"

2. **导入项目**
   - 在 "Import Git Repository" 中找到你的仓库
   - 如果没有看到，点击 "Adjust GitHub App Permissions" 授权
   - 点击 "Import"

3. **配置部署**
   - Framework Preset: 选择 "Next.js"（通常自动识别）
   - Build Command: `pnpm build` 或 `npm run build`
   - Output Directory: `.next`（默认）
   - 其他保持默认

4. **点击 "Deploy"**
   - 等待 2-3 分钟
   - 部署完成后会显示 "Congratulations!" 页面

5. **获取访问地址**
   - 部署完成后，点击 "Continue to Dashboard"
   - 在 "Domains" 部分可以看到你的网址，格式为：
     `article-workbench-你的用户名.vercel.app`
   - 点击网址即可访问

---

## 第三步：验证部署

1. **打开网址**
   - 在浏览器中访问你的 Vercel 域名
   - 应该能看到登录界面

2. **测试功能**
   - 输入用户名登录
   - 添加几篇文章
   - 测试复制、导出等功能

3. **分享给同事**
   - 将网址发给同事
   - 他们输入自己的用户名即可使用
   - 每个人的数据独立

---

## 第四步：后续更新

当你在扣子工作台中修改代码后：

1. **下载最新代码**

2. **在本地更新**
   ```bash
   # 进入项目目录
   cd article-workbench
   
   # 添加修改
   git add .
   
   # 提交
   git commit -m "更新说明"
   
   # 推送
   git push
   ```

3. **Vercel 自动部署**
   - 推送后 Vercel 会自动检测到更新
   - 自动重新部署（约 1-2 分钟）
   - 无需手动操作

---

## 重要说明

### 数据存储

**当前方案（文件存储）**：
- 数据存储在 `data/` 目录的 JSON 文件中
- **Vercel 是无服务器平台，文件写入不会持久化**
- 每次部署后，数据会重置

**解决方案**：

#### 方案 A：使用 Supabase（推荐）
- 注册 https://supabase.com（免费）
- 创建项目，获取 URL 和 Key
- 在 Vercel 环境变量中配置：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- 修改代码使用 Supabase 替代文件存储

#### 方案 B：使用 VPS 自建
- 购买云服务器（阿里云/腾讯云）
- 使用 PM2 运行 Node.js 服务
- 文件存储可以正常工作

### 环境变量配置（如使用 Supabase）

1. 在 Vercel 项目页面，点击 "Settings" → "Environment Variables"
2. 添加以下变量：
   - Name: `SUPABASE_URL`，Value: 你的 Supabase URL
   - Name: `SUPABASE_ANON_KEY`，Value: 你的 Supabase Key
3. 点击 "Save"
4. 重新部署

---

## 常见问题

### Q: 部署后网址会变吗？
A: 不会。Vercel 分配的域名是固定的，除非你手动删除项目。

### Q: 可以绑定自己的域名吗？
A: 可以。在 Vercel 项目设置中，点击 "Domains" → "Add"，输入你的域名。

### Q: 部署后数据会丢失吗？
A: 如果使用文件存储，每次部署会重置。建议使用 Supabase。

### Q: 需要付费吗？
A: Vercel 免费额度足够个人使用。Supabase 也有免费额度。

### Q: 多人使用会冲突吗？
A: 不会。每个用户输入不同的用户名，数据独立存储。

---

## 快速命令参考

```bash
# 初始化 Git
git init
git add .
git commit -m "初始化"

# 关联远程仓库
git remote add origin https://github.com/用户名/仓库名.git

# 推送代码
git push -u origin main

# 日常更新
git add .
git commit -m "更新说明"
git push
```

---

## 联系支持

- Vercel 文档: https://vercel.com/docs
- Next.js 文档: https://nextjs.org/docs
- Supabase 文档: https://supabase.com/docs
