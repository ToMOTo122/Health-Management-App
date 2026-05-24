# 健康小助手 — 一站式健康管理平台

基于 Web 的全栈健康管理应用，帮助用户记录、分析和改善日常健康习惯，并提供 AI 智能问答支持。

---

## 1. 项目简介

**健康小助手**是一个面向普通用户的个人健康数据管理平台。用户可以：

- 记录每日睡眠、步数、饮水、运动、饮食、压力和生理周期数据
- 通过图表和统计报告直观了解自身健康趋势
- 获得 AI 驱动的个性化健康建议
- 设置健康目标并接收提醒通知

系统定位为**健康管理参考工具**，不提供医疗诊断功能。

---

## 2. 功能概览

| 模块 | 功能 |
|------|------|
| 用户账户 | 注册、登录、个人资料管理、健康目标设置 |
| 健康记录 | 7 种数据类型：睡眠、步数、饮水、运动、饮食、压力、生理周期 |
| 数据分析 | 日/周/月趋势图表、统计概览、健康总结报告 |
| AI 助手 | 基于 Ollama 本地大模型的自然语言问答、个性化健康建议 |
| 提醒通知 | 饮水/睡眠/运动/记录提醒，按设定时间触发 |
| 数据管理 | 记录修改删除、JSON/CSV 数据导出 |

---

## 3. 系统架构

```
┌──────────────────────────────────────────────────────────┐
│                      客户端 (浏览器)                      │
│                  http://localhost:5173                   │
│              Vue 3 SPA  (Vite dev server)               │
└─────────────────────┬────────────────────────────────────┘
                      │  /api/* 请求
                      │  (Vite proxy → localhost:3000)
                      ▼
┌──────────────────────────────────────────────────────────┐
│               Express API Server  (Port 3000)            │
│                                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 认证模块  │ │ 用户模块   │ │ 记录模块  │ │ 分析模块  │  │
│  │ /auth    │ │ /users    │ │ /health  │ │/analysis │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────────┐    │
│  │ 提醒模块  │ │ 问答模块   │ │ 导出模块              │    │
│  │/reminders│ │ /chat     │ │ /export              │    │
│  └──────────┘ └───────────┘ └──────────────────────┘    │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  中间件层         │  │  业务服务层       │             │
│  │ JWT/验证/限流    │  │ Service Classes  │             │
│  └──────────────────┘  └──────────────────┘             │
└──────┬──────────────────────────────┬───────────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐          ┌─────────────────────┐
│   MySQL 8.0  │          │     Redis 7.0       │
│   Port 3307  │          │     Port 6379       │
│              │          │                     │
│ • 用户表     │          │ • JWT 黑名单        │
│ • 7种记录表  │          │ • 今日统计缓存      │
│ • 目标表     │          │ • 分析汇总缓存      │
│ • 提醒表     │          │ • 聊天上下文        │
│ • 聊天历史   │          │ • 提醒调度队列      │
└──────────────┘          └─────────────────────┘
                                   
       ┌─────────────────────┐
       │  Ollama  (可选)     │
       │  Port 11434         │
       │  模型: qwen3:8b     │
       │                     │
       │ • AI 健康问答       │
       │ • 个性化健康建议     │
       │ • 离线时自动降级     │
       └─────────────────────┘
```

---

## 4. 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API)、Vite 5、Pinia 2、Vue Router 4、Chart.js 4、Axios |
| 后端 | Node.js、Express 4、JWT 认证、bcrypt 密码哈希 |
| 数据库 | MySQL 8.0 (InnoDB, utf8mb4) |
| 缓存/队列 | Redis 7.0 (ioredis) |
| AI 模型 | Ollama + Qwen3-8B (阿里通义千问) |
| 容器化 | Docker Compose (MySQL + Redis) |

---

## 5. 系统要求

### 硬件要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 双核 2.0 GHz | 四核 3.0 GHz+ |
| 内存 | 4 GB (无 AI) / **8 GB** (含 Ollama) | 16 GB+ |
| 磁盘 | 2 GB (不含模型) | 10 GB+ (含 Qwen3-8B 模型 ~5 GB) |

> Ollama 运行 8B 参数模型需要 **至少 8 GB 可用内存**，且首次推理前需要加载模型（占用约 5 GB 内存）。如果仅运行 MySQL + Redis + Node.js，4 GB 内存足够。

### 软件要求

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Windows | Windows 10 / 11 | 推荐 64 位 |
| Docker Desktop | 最新稳定版 | 需启用 WSL 2 后端 |
| Node.js | ≥ 18 LTS | [nodejs.org](https://nodejs.org) 下载 |
| npm | ≥ 9 | 随 Node.js 附带 |
| Ollama | 最新版 | AI 问答必需（可选） |

### 端口占用检查

启动前确保以下端口未被占用：

| 端口 | 服务 | 冲突时 |
|------|------|--------|
| 5173 | Vite 前端 | 修改 `vite.config.js` 中的 `server.port` |
| 3000 | Express 后端 | 修改 `backend/.env` 中的 `PORT` |
| 3307 | MySQL | 修改 `docker-compose.yml` 端口映射 |
| 6379 | Redis | 修改 `docker-compose.yml` 添加 Redis 端口映射 |
| 11434 | Ollama | Ollama 默认端口，通常不需修改 |

```bash
# 检查端口占用 (Windows PowerShell)
netstat -ano | findstr "3307 6379 3000 5173"
```

---

## 6. 项目结构

```
health-assistant/
├── backend/                    # 后端服务 (Node.js + Express)
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── server.js           # 服务入口
│       ├── app.js              # Express 应用
│       ├── config/             # 数据库、Redis、Ollama 配置
│       ├── middleware/         # 认证、验证、限流、错误处理
│       ├── routes/             # 路由定义 (7 个模块)
│       ├── controllers/       # 控制器层
│       ├── services/          # 业务逻辑层
│       ├── models/            # SQL DDL
│       └── utils/             # 工具函数
├── frontend/                   # 前端 (Vue 3 + Vite)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/            # 路由定义 + 导航守卫
│       ├── stores/            # Pinia 状态管理
│       ├── api/               # Axios API 封装
│       ├── views/             # 6 个页面视图
│       ├── components/        # 布局、表单、通用组件
│       ├── composables/       # 组合式函数
│       └── assets/styles/     # CSS 样式
├── docker-compose.yml          # MySQL + Redis 容器编排
└── README.md
```

---

## 7. 启动步骤

### 7.1 环境准备

**安装 Docker Desktop**

1. 访问 [Docker 官网](https://www.docker.com/products/docker-desktop/) 下载 Docker Desktop for Windows
2. 双击安装包，按向导完成安装（默认启用 WSL 2 后端）
3. 安装完成后重启电脑
4. 打开终端，验证安装：
   ```bash
   docker --version
   docker compose version
   ```

**配置 Docker 镜像加速器**

由于国内访问 Docker Hub 较慢，建议配置镜像加速：

1. 打开 Docker Desktop，点击右上角齿轮图标 → **Docker Engine**
2. 在 JSON 配置中添加 `registry-mirrors`（保留原有内容，仅添加镜像地址）：
   ```json
   {
   "registry-mirrors": [
      "https://docker.m.daocloud.io",
      "https://dockerproxy.com",
      "https://hub-mirror.c.163.com"
   ]
   }
   ```
3. 点击 **Apply & Restart** 等待 Docker 重启
4. 终端验证：
   ```bash
   docker info | grep -A 5 "Registry Mirrors"
   ```

**安装 Node.js**

- 要求版本 ≥ 18
- 下载地址：[https://nodejs.org](https://nodejs.org)（推荐 LTS 版本）
- 验证：
  ```bash
  node --version
  npm --version
  ```

**安装 Ollama (可选，AI 问答功能需要)**

1. 访问 [Ollama 官网](https://ollama.com/download) 下载 Windows 版
2. 安装后，拉取模型（首次约需 4-5 GB 存储空间）：
   ```bash
   ollama pull qwen3:8b
   ```
3. 验证模型可用：
   ```bash
   ollama list
   ```

> Ollama 默认运行在 `http://localhost:11434`。**如未安装，AI 问答功能会自动降级为本地规则引擎**，不影响其他功能使用。

---

### 7.2 启动 MySQL 与 Redis

在项目根目录下运行：

```bash
docker compose up -d
```

首次启动会自动：
- 拉取 `mysql:8.0` 和 `redis:7-alpine` 镜像
- 创建数据库 `health_assistant` 并执行 `schema.sql` 建表
- 约 30 秒后服务就绪

验证服务：

```bash
docker ps
# 应看到 health-mysql 和 health-redis 两个容器的 STATUS 为 Up (healthy)
```

---

### 7.3 配置环境变量

后端配置位于 `backend/.env`，已提供默认值。如需修改数据库密码或端口，编辑该文件后重启后端：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=SEU_CSE
DB_NAME=health_assistant
REDIS_HOST=localhost
REDIS_PORT=6379
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
JWT_SECRET=your-secret-change-in-production
```

> 注意：`DB_PORT` 和 `DB_PASSWORD` 需与 `docker-compose.yml` 中的端口映射和密码保持一致。

---

### 7.4 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

---

### 7.5 启动服务

分别打开两个终端窗口：

```bash
# 终端 1 —— 后端 (http://localhost:3000)
cd backend
npm run dev
```

```bash
# 终端 2 —— 前端 (http://localhost:5173)
cd frontend
npm run dev
```

浏览器访问 **http://localhost:5173** 即可使用。

> 开发模式下前端 Vite 服务自动将 `/api` 请求代理到后端 `localhost:3000`，无需手动配置跨域。

---

### 7.6 停止服务

```bash
# 停止后端和前端 (Ctrl+C)

# 停止 MySQL 和 Redis
docker compose down
```

如需同时清除数据库数据：
```bash
docker compose down -v
```

---

## 8. 开发命令

```bash
# 后端
cd backend
npm run dev          # nodemon 热重载启动
npm test             # 运行 Jest 测试
npm start            # 生产模式启动

# 前端
cd frontend
npm run dev          # Vite 开发服务器
npm run build        # 生产构建
npm run preview      # 预览生产构建
```