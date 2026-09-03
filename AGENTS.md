# 文章工作台 - AGENTS.md

## 项目概览
文章推送管理工作台，用于管理文章的录入、分类、推群和客户端状态跟踪。支持AI优化标题和新车上市日历。

## 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- 文章数据：localStorage（个人不共享）
- 用户名映射：服务端 JSON 文件（多人共享）
- 新车日历：服务端 JSON 文件（多人共享）
- AI功能：coze-coding-dev-sdk（LLM + FetchClient）

## 目录结构
```
src/
├── app/
│   ├── page.tsx                    # 主页面 - 每日工作台
│   ├── layout.tsx                  # 根布局
│   ├── globals.css                 # 全局样式
│   ├── car-calendar/page.tsx       # 新车上市日历页面
│   └── api/
│       ├── usermap/route.ts        # 共享用户名映射 API
│       ├── car-calendar/route.ts   # 新车上市日历 API
│       └── optimize-title/route.ts # AI优化标题 API
├── components/ui/                  # shadcn/ui 组件
├── lib/
│   ├── article-utils.ts            # URL解析、文本格式化、ID生成
│   ├── store.ts                    # localStorage 数据管理
│   ├── usermap-file.ts             # 服务端用户名映射文件读写
│   ├── car-calendar-file.ts        # 服务端新车日历文件读写
│   └── utils.ts                    # cn() 工具函数
data/
├── usermap.json                    # 共享用户名映射数据
└── car-calendar.json               # 新车上市日历数据
```

## 核心功能
1. **每日工作台**：打开时显示空白表单，只展示今日添加的文章
2. **历史记录**：侧边抽屉面板查看所有历史文章，按日期分组
3. **AI优化标题**：点击按钮通过链接获取文章内容，AI优化标题至17-20字
4. **多选复制**：勾选多条后批量复制
5. **双击复制文章ID**：双击文章ID单元格即可复制
6. **拖拽排序**：通过左侧拖拽手柄调整文章顺序
7. **新车上市日历**：日历视图展示新车上市信息

## API 接口
- `GET/POST/DELETE /api/usermap` - 共享用户名映射
- `GET/POST/DELETE /api/car-calendar` - 新车上市日历
- `POST /api/optimize-title` - AI优化标题

## 开发命令
- `pnpm install` / `pnpm dev` / `pnpm build` / `pnpm ts-check` / `pnpm lint`
