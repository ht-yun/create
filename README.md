# 折枝 · 互动叙事平台

互动叙事项目的 Web 与 NestJS 后端首个可运行版本。当前版本以“能体验、能创作、能登录、能验证核心数据边界”为目标，延续仓库上层产品方案中的完整功能方向。

## 已实现

### Web

- 首页、收藏“仓库”、创意工坊、排行榜与设置页
- 邮箱注册、验证码确认与登录界面
- 三层创作模式入口：引导、标准、专业
- React Flow 节点创作画布、章节树、属性与变量面板
- 创作端沉浸呈现面板：画面焦点、横竖屏裁切、媒体角色、音量、转场和文字节奏
- 图片、音频、视频上传入口及后端上传意图接口边界
- 可运行的互动剧情播放器
  - 全视口剧情画面、底部电影字幕层和原生全屏入口
  - 多图切换、主体优先裁切、完整画面及纯画面模式
  - 可跳过的分段文字淡入、含蓄选择反馈和关键选择标记
  - 隐藏式状态面板、历史抽屉和结局路线摘要
  - 本地进度恢复、媒体预加载、图片失败回退和分层音频基础能力
  - 字号、字幕背景、高对比度、降低动态效果和触觉反馈设置
  - 自定义数值变量
  - 选项增减数值
  - 多分支与多结局
  - 返回已走过节点时恢复当时的变量状态
- 桌面、平板、手机响应式布局

### API

- 邮箱注册、6 位验证码、邮箱验证、登录、退出与当前用户
- Argon2id 密码哈希
- 随机不透明会话令牌；数据库只保存令牌哈希
- `HttpOnly`、`SameSite=Lax` 会话 Cookie
- 作品创建、更新、发布、公开列表、详情和“我的作品”
- `private`、`unlisted`、`public` 可见性检查
- 收藏与收藏列表
- 剧情图结构、节点引用、变量与结局校验
- PostgreSQL 自动迁移与两部示例剧情种子
- Swagger API 文档
- 媒体上传和 AI 小说/漫画导入预留接口

## 技术结构

```text
interactive-story-platform/
├─ app/                   Vinext / Next.js App Router Web
├─ components/            页面组件、播放器与节点编辑器
├─ lib/                   API 读取与公开演示数据
├─ shared/                Web 与 API 共用的剧情契约
├─ backend/               NestJS + PostgreSQL API
│  ├─ src/auth/
│  ├─ src/database/
│  ├─ src/stories/
│  └─ scripts/smoke.ts    后端端到端冒烟测试
└─ docker-compose.yml     本地 PostgreSQL
```

Web 当前由 Vinext 生成 Cloudflare Worker 兼容产物，页面 API 与领域 API 仍严格分离。后续 App、小程序复用 `shared/story-contract.ts` 与同一 NestJS API。

## 本地启动

环境要求：Node.js 22+、npm、Docker Desktop。

### 1. 安装依赖

```powershell
cd D:\aaa\ing\create\interactive-story-platform
npm install
npm --prefix backend install
```

### 2. 启动 PostgreSQL

```powershell
docker compose up -d postgres
```

### 3. 启动 API

```powershell
cd backend
Copy-Item .env.example .env
npm run dev
```

API 默认地址：`http://localhost:4000/api`  
Swagger：`http://localhost:4000/api/docs`

开发环境会把邮箱验证码输出到 API 终端，并在注册响应中返回，便于尚未接邮件服务时测试。生产环境必须关闭 `DEV_EXPOSE_VERIFICATION_CODE` 并接入邮件供应商。

### 4. 启动 Web

另开终端：

```powershell
cd D:\aaa\ing\create\interactive-story-platform
npm run dev
```

Web 默认地址：`http://localhost:3000`

## 验证命令

```powershell
# Web：生产构建和服务端渲染测试
npm test

# Web：类型与代码规范
npx tsc --noEmit
npm run lint

# API：类型、构建与真实数据库端到端流程
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix backend run smoke
```

`backend smoke` 会启动临时 API，依次验证健康检查、示例数据、注册、邮箱验证、登录 Cookie、创建作品、发布、公开读取和“我的作品”，完成后自动关闭 API。

## 当前边界

- 媒体上传 UI 与受保护 API 已建立，但对象存储未配置，接口会明确返回“尚未启用”。下一阶段接 S3 兼容存储、预签名直传和 FFmpeg Worker。
- AI 小说/漫画导入保留 `POST /api/ai-imports` 和能力声明，当前保持关闭。
- Web 在 API 未运行时仅对公开示例剧情降级；账号、收藏与作品写入不会使用本地伪数据。
- 游玩进度已支持浏览器本地恢复；账号跨设备云同步仍需新增体验进度 API。真实邮件投递、忘记密码、内容审核、发布版本快照和素材转码属于下一开发阶段。
### 剧情文件导入/导出

当前已加入版本化剧情文件能力：

- .story.json：剧情结构和可访问媒体 URL。
- .storypack.zip：剧情结构和完整图片、音频、视频素材。
- POST /api/stories/import/validate
- POST /api/stories/import
- GET /api/stories/export/:id?format=json|storypack
- GET /api/stories/assets/:id

导入始终创建新的私有草稿，并自动重新生成节点、选项和素材 ID。当前后端使用本地 .data/story-assets 存储适配器；生产部署应替换为 S3 兼容对象存储，并接入大文件分片上传、异步任务和进度查询。
