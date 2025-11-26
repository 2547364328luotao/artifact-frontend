# Artifact.exe Frontend

<div align="center">
<img width="800" alt="Artifact.exe" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 📖 简介

Artifact.exe 是一个创意 Meme 平台的前端项目，使用 Vite + React + TypeScript 构建。

## 🚀 功能特性

- 🎨 复古像素风格 UI 设计
- 📤 Meme 图片上传与管理
- 🤖 AI 驱动的 Meme 分析与增强
- 👤 用户认证与个人资料
- 🏆 用户等级与成就系统
- 📱 响应式设计

## 🛠️ 技术栈

- **框架**: React 18
- **构建工具**: Vite 5
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **AI**: Google Gemini API

## 📦 安装

```bash
# 克隆仓库
git clone https://github.com/2547364328luotao/artifact-frontend.git
cd artifact-frontend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env.local
```

## ⚙️ 配置

编辑 `.env.local` 文件：

```env
# 后端 API 地址
VITE_API_URL=http://localhost:3001/api

# Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## 🚀 运行

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📁 项目结构

```
artifact-frontend/
├── components/          # React 组件
│   ├── AuthModal.tsx       # 登录/注册弹窗
│   ├── MemeCard.tsx        # Meme 卡片组件
│   ├── MemeCardSkeleton.tsx
│   ├── RetroBackground.tsx # 复古背景
│   ├── UploadModal.tsx     # 上传弹窗
│   └── UserProfileModal.tsx
├── contexts/            # React Context
│   └── AuthContext.tsx     # 认证上下文
├── services/            # API 服务
│   ├── authService.ts      # 认证服务
│   ├── memeService.ts      # Meme 服务
│   ├── aiService.ts        # AI 服务
│   └── r2Service.ts        # R2 存储服务
├── App.tsx              # 主应用组件
├── index.tsx            # 入口文件
├── types.ts             # TypeScript 类型定义
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
└── tsconfig.json        # TypeScript 配置
```

## 🔗 相关项目

- [artifact-backend](https://github.com/2547364328luotao/artifact-backend) - Spring Boot 后端

## 📄 许可证

MIT License
