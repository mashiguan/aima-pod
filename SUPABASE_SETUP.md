# Supabase 接入指南

## 1. 创建项目（10 分钟）
1. 打开 https://supabase.com/dashboard
2. 登录 → New project
3. 选 region（推荐：Singapore 亚太友好）
4. 密码随便设（生产建议复杂）→ 等待 2 分钟项目创建完成
5. 左侧菜单 **Project Settings → API**：
   - 复制 **Project URL**（`https://xxx.supabase.co`）
   - 复制 **anon public** key

## 2. 跑 Schema
1. 左侧菜单 **SQL Editor** → New query
2. 复制 `supabase/migrations/0001_init.sql` 全部内容
3. Run → 应看到 Success + 8 行 episodes 预置数据

## 3. 创建 Storage bucket
1. 左侧菜单 **Storage** → New bucket
2. Name: `audio`、Public: **打开**（让详情页可直接播放）
3. File size limit: 100 MB（够播客用）

## 4. 配置 env
1. 复制 `aima-pod/.env.example` 为 `.env.local`
2. 填入：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```
3. **重启 dev**：`Ctrl-C` 然后 `npm run dev`

## 5. 验证
打开 http://127.0.0.1:3001/
- 首页应显示 8 张预置节目
- 打开详情页，点赞/收藏——Supabase 后台 `interactions` 表应能看到记录
- 后台新建节目：admin 表单 → 提交 → Supabase 后台 `episodes` 表应能看到新行

## 6. 音频上传（下一步）
当前 admin 表单的 MP3 只生成 `URL.createObjectURL`（本地 blob URL，**只在你浏览器能播**）。完整流程：
1. 改 admin 表单：调 `supabase.storage.from('audio').upload(path, file)`
2. 拿 `data.publicUrl` 存到 episodes.audio_url
3. 我已经预留好 `createEpisode(input)` 的接口，你拿到真实音频上传通路后只改这一处

## 当前架构
- **有 env**：所有数据走 Supabase（DB + Storage）
- **无 env**（开发态）：所有数据走 mock + localStorage（演示、UI 测试用）
- **降级平滑**：组件无感，`api.ts` 是唯一数据入口
