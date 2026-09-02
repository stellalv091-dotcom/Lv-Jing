# 文章工作台 - AGENTS.md

## 项目概览
文章推送管理工作台，用于管理文章的录入、分类、推群和客户端状态跟踪。

## 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- 数据持久化：localStorage

## 目录结构
```
src/
├── app/
│   ├── page.tsx          # 主页面 - 工作台（客户端组件）
│   ├── layout.tsx        # 根布局
│   └── globals.css       # 全局样式
├── components/ui/        # shadcn/ui 组件
├── lib/
│   ├── article-utils.ts  # URL解析、文本格式化、ID生成
│   ├── store.ts          # localStorage 数据管理（文章+用户名映射）
│   └── utils.ts          # cn() 工具函数
```

## 核心功能
1. **文章录入**：输入标题+链接，选择分类（产业稿/新车稿）
2. **自动提取**：从URL中提取文章ID和用户ID，映射用户名
3. **状态管理**：勾选推群/客户端状态
4. **复制功能**：单条复制（标题+换行+链接），批量复制全部
5. **用户名映射**：管理用户ID→用户名的映射字典

## 数据模型
```typescript
interface Article {
  id: string;
  title: string;
  url: string;
  articleId: string;    // 从URL提取
  userId: string;       // 从URL提取
  username: string;     // 映射得到
  category: 'industry' | 'newcar';
  pushedToGroup: boolean;
  addedToClient: boolean;
  createdAt: number;
}
```

## URL解析规则
- 搜狐文章链接格式：`https://www.sohu.com/a/{articleId}_{userId}`
- articleId：倒数第二组数字
- userId：最后一组数字

## 开发命令
- 安装依赖：`pnpm install`
- 开发：`pnpm dev`
- 构建：`pnpm build`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint`
