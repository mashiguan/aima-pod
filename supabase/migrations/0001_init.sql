-- 爱玛播 数据库 Schema
-- 在 Supabase SQL Editor 里执行一次即可

-- 启用 uuid 扩展（防 device_id 撞名）
create extension if not exists "pgcrypto";

-- 1. episodes 表
create table if not exists public.episodes (
  id text primary key,
  title text not null,
  description text default '',
  author text not null default '小马歌',
  cover text,                      -- 封面图 URL（可空，使用渐变 fallback）
  audio_url text not null,         -- 来自 Supabase Storage / 外部 CDN
  duration_sec integer not null default 0,
  plays bigint not null default 0,
  genre text not null check (genre in ('故事','访谈','随笔','科普')),
  topic text not null check (topic in ('历史','科技','文化','生活','商业','娱乐')),
  chapters jsonb not null default '[]'::jsonb,  -- [{t:0,label:'开场'},...]
  featured boolean not null default false,
  created_by uuid,                 -- 创建设备 ID（匿名）
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 索引
create index if not exists episodes_published_at_idx on public.episodes (published_at desc);
create index if not exists episodes_featured_idx on public.episodes (featured) where featured = true;
create index if not exists episodes_created_by_idx on public.episodes (created_by);

-- RLS：所有人可读
alter table public.episodes enable row level security;
drop policy if exists "episodes_read_all" on public.episodes;
create policy "episodes_read_all" on public.episodes for select using (true);

-- RLS：匿名可写（生产环境应该用 service role / 限流；先打开 demo 模式）
drop policy if exists "episodes_anon_write" on public.episodes;
create policy "episodes_anon_write" on public.episodes for insert with check (true);
drop policy if exists "episodes_anon_update" on public.episodes;
create policy "episodes_anon_update" on public.episodes for update using (true) with check (true);

-- 2. interactions 表（点赞 / 点踩 / 收藏 / 转发）
create table if not exists public.interactions (
  id bigserial primary key,
  podcast_id text not null references public.episodes(id) on delete cascade,
  device_id uuid not null,
  type text not null check (type in ('like','dislike','favorite','share')),
  created_at timestamptz not null default now()
);

-- 同设备对同一节目同类型只能 1 条（取消则删除）
create unique index if not exists interactions_unique
  on public.interactions (podcast_id, device_id, type);

create index if not exists interactions_podcast_idx on public.interactions (podcast_id);

alter table public.interactions enable row level security;
drop policy if exists "interactions_read_all" on public.interactions;
create policy "interactions_read_all" on public.interactions for select using (true);
drop policy if exists "interactions_anon_write" on public.interactions;
create policy "interactions_anon_write" on public.interactions for insert with check (true);
drop policy if exists "interactions_anon_delete" on public.interactions;
create policy "interactions_anon_delete" on public.interactions for delete using (true);

-- 3. RPC：原子 +1 播放数
create or replace function public.increment_plays(ep_id text)
returns void as $$
begin
  update public.episodes set plays = plays + 1 where id = ep_id;
end;
$$ language plpgsql security definer;

-- 4. 预置 8 条 mock 数据（保证首屏有内容）
insert into public.episodes (id, title, description, author, audio_url, duration_sec, plays, genre, topic, chapters, featured, published_at) values
  ('ep-001', '三国演义·第一回：宴桃园豪杰三结义',
   '黄巾起义，天下大乱。刘备、关羽、张飞在涿县桃园结义，誓共生死。一段英雄传奇，就此拉开序幕。',
   '小马歌', 'https://example.com/ep-001.mp3', 1845, 12300, '故事', '历史',
   '[{"t":0,"label":"开场"},{"t":240,"label":"黄巾起义背景"},{"t":720,"label":"桃园结义"},{"t":1200,"label":"三人立志"},{"t":1600,"label":"尾声"}]'::jsonb,
   true, '2026-07-10 10:00:00+00'),
  ('ep-002', '对话老周：在胡同里长大是一种什么体验',
   '老周是土生土长的北京人。他从 60 年代的胡同讲起，讲到今天的网红打卡——一座城市的呼吸，从来都在小巷子里。',
   '小马歌', 'https://example.com/ep-002.mp3', 2520, 8700, '访谈', '文化',
   '[{"t":0,"label":"自我介绍"},{"t":300,"label":"童年胡同"},{"t":900,"label":"邻里关系"},{"t":1500,"label":"变迁"},{"t":2100,"label":"今天"}]'::jsonb,
   true, '2026-07-08 14:00:00+00'),
  ('ep-003', '脱口秀：互联网的尽头是玄学',
   '算法推送、外卖红包、相亲贴……一切看起来很科学的东西，最后都走向了算命。这一期聊聊当代玄学。',
   '小马歌', 'https://example.com/ep-003.mp3', 1500, 23000, '随笔', '生活',
   '[{"t":0,"label":"开场段子"},{"t":200,"label":"算法与命运"},{"t":600,"label":"红包与风水"},{"t":1000,"label":"相亲与占卜"},{"t":1300,"label":"结语"}]'::jsonb,
   true, '2026-07-06 21:00:00+00'),
  ('ep-004', '硅谷来信：AI 是怎么写出那首十四行的',
   '从 Transformer 到 RLHF，从 GPT-2 到 Claude——这一期我们用尽可能少的技术黑话，讲清楚 LLM 是什么、能做什么、不能做什么。',
   '小马歌', 'https://example.com/ep-004.mp3', 3120, 31200, '科普', '科技',
   '[{"t":0,"label":"开场"},{"t":240,"label":"从规则到统计"},{"t":900,"label":"Transformer 是什么"},{"t":1800,"label":"RLHF 是什么"},{"t":2400,"label":"现在能做什么"}]'::jsonb,
   true, '2026-07-05 09:00:00+00'),
  ('ep-005', '夜话小马歌：夜里的便利店',
   '凌晨两点的便利店，是城市最后一种 24 小时书房。这一期我从便利店的小哥聊到凌晨的食客——夜里的城市什么样？',
   '小马歌', 'https://example.com/ep-005.mp3', 1980, 6400, '随笔', '生活',
   '[{"t":0,"label":"夜的开场"},{"t":180,"label":"便利店的灯"},{"t":600,"label":"夜班的人"},{"t":1200,"label":"凌晨 3 点"},{"t":1700,"label":"结语"}]'::jsonb,
   false, '2026-07-11 02:30:00+00'),
  ('ep-006', '红楼梦读书会：黛玉葬花那一回',
   '「侬今葬花人笑痴，他年葬侬知是谁？」—我们逐句读黛玉葬花，讲她为什么哭、讲花与女性、讲大观园里的隐喻。',
   '小马歌', 'https://example.com/ep-006.mp3', 3540, 5100, '故事', '文化',
   '[{"t":0,"label":"开篇"},{"t":300,"label":"葬花场景"},{"t":1200,"label":"逐句解读"},{"t":2400,"label":"隐喻"},{"t":3200,"label":"总结"}]'::jsonb,
   false, '2026-07-09 19:00:00+00'),
  ('ep-007', '黑洞：一张看不见的网',
   '黑洞不是洞，黑洞是星。这一期我们用一张图讲清楚：事件视界、吸积盘、引力波——以及为什么我们看不见它。',
   '小马歌', 'https://example.com/ep-007.mp3', 2200, 14800, '科普', '科技',
   '[{"t":0,"label":"什么是黑洞"},{"t":300,"label":"事件视界"},{"t":800,"label":"看见它"},{"t":1500,"label":"引力波"},{"t":1900,"label":"现在我们知道什么"}]'::jsonb,
   false, '2026-07-07 15:00:00+00'),
  ('ep-008', '商业故事：从一辆共享单车看十年',
   '2014 到 2024，共享单车从「五颜六色的战争」到「美团一家独大」。这一期讲一个完整的行业周期——从风口、混战、并购、上市、退市。',
   '小马歌', 'https://example.com/ep-008.mp3', 2800, 9200, '故事', '商业',
   '[{"t":0,"label":"开场"},{"t":240,"label":"2014 的风"},{"t":900,"label":"混战"},{"t":1600,"label":"合并"},{"t":2200,"label":"今天"}]'::jsonb,
   false, '2026-07-04 11:00:00+00')
on conflict (id) do nothing;
