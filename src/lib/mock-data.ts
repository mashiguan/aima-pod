import { Episode, Genre, Topic } from "./types";

// 体裁 -> 颜色
export const GENRE_META: Record<Genre, { label: string; color: string }> = {
  故事:   { label: "故事", color: "bg-rose-500/10 text-rose-300 ring-rose-500/30" },
  访谈:   { label: "访谈", color: "bg-sky-500/10 text-sky-300 ring-sky-500/30" },
  随笔:   { label: "随笔", color: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30" },
  科普:   { label: "科普", color: "bg-violet-500/10 text-violet-300 ring-violet-500/30" },
};

// 主题 -> 颜色
export const TOPIC_META: Record<Topic, { label: string; color: string }> = {
  历史:     { label: "历史", color: "bg-amber-500/10 text-amber-300 ring-amber-500/30" },
  科技:     { label: "科技", color: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30" },
  文化:     { label: "文化", color: "bg-pink-500/10 text-pink-300 ring-pink-500/30" },
  生活:     { label: "生活", color: "bg-teal-500/10 text-teal-300 ring-teal-500/30" },
  商业:     { label: "商业", color: "bg-orange-500/10 text-orange-300 ring-orange-500/30" },
  娱乐:     { label: "娱乐", color: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/30" },
};

/** 给 Episode 列表用的元数据查找 */
export const GENRES = Object.entries(GENRE_META).map(([value, m]) => ({
  value: value as Genre,
  label: m.label,
  color: m.color,
}));
export const TOPICS = Object.entries(TOPIC_META).map(([value, m]) => ({
  value: value as Topic,
  label: m.label,
  color: m.color,
}));

/** 封面渐变：8 种高对比组合（更饱和、更易区分） */
/* eslint-disable */
// 重要：下面 8 个完整类名字符串必须以字面量形式存在源码里，
// Tailwind JIT 才能扫到并生成对应 CSS。不要改成数组下标。
function _tailwindSafelist() {
  return [
    "from-violet-500 via-fuchsia-500 to-pink-500",         // 1
    "from-rose-500 via-orange-400 to-amber-500",           // 2
    "from-sky-500 via-blue-500 to-indigo-600",              // 3
    "from-emerald-500 via-teal-400 to-cyan-500",           // 4
    "from-orange-500 via-red-500 to-fuchsia-600",          // 5
    "from-cyan-500 via-sky-400 to-blue-500",                // 6
    "from-amber-500 via-orange-500 to-rose-500",           // 7
    "from-fuchsia-500 via-purple-500 to-indigo-600",       // 8
  ];
}

export function coverGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return _tailwindSafelist()[h % _tailwindSafelist().length];
}
/* eslint-enable */

/** 封面水印字符：取标题第一个非空字（中文优先） */
export function coverGlyph(title: string): string {
  const m = title.match(/[\u4e00-\u9fa5a-zA-Z0-9]/);
  return m ? m[0].toUpperCase() : "·";
}

export const MOCK_EPISODES: Episode[] = [
  {
    id: "ep-001",
    title: "三国演义·第一回：宴桃园豪杰三结义",
    description: "黄巾起义，天下大乱。刘备、关羽、张飞在涿县桃园结义，誓共生死。一段英雄传奇，就此拉开序幕。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/sanguo-001.mp3",
    duration_sec: 1845,
    plays: 12453,
    genre: "故事",
    topic: "历史",
    chapters: [
      { t: 0, label: "开场" },
      { t: 240, label: "黄巾起义背景" },
      { t: 720, label: "桃园结义" },
      { t: 1200, label: "三人立志" },
      { t: 1600, label: "尾声" },
    ],
    published_at: "2026-07-10T08:00:00Z",
    featured: true,
  },
  {
    id: "ep-002",
    title: "对话老周：一个老北京的胡同记忆",
    description: "老周出生在南锣鼓巷，他用 30 年时间记录了胡同的变迁。这是一段关于城市、记忆与告别的故事。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/duihua-laozhou.mp3",
    duration_sec: 3620,
    plays: 8932,
    genre: "访谈",
    topic: "文化",
    chapters: [
      { t: 0, label: "嘉宾介绍" },
      { t: 300, label: "童年胡同" },
      { t: 1200, label: "老街坊们" },
      { t: 2400, label: "城市更新" },
      { t: 3300, label: "记忆与告别" },
    ],
    published_at: "2026-07-08T10:30:00Z",
    featured: true,
  },
  {
    id: "ep-003",
    title: "脱口秀：互联网的尽头是玄学",
    description: "为什么我们越理性越焦虑？为什么星座、塔罗、AI 算命突然火了？一段笑声里的人类学观察。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/tuokouxiu-001.mp3",
    duration_sec: 980,
    plays: 21054,
    genre: "随笔",
    topic: "娱乐",
    chapters: [
      { t: 0, label: "开场段子" },
      { t: 180, label: "玄学为啥火了" },
      { t: 540, label: "AI 算命现场" },
    ],
    published_at: "2026-07-11T19:00:00Z",
    featured: true,
  },
  {
    id: "ep-004",
    title: "硅谷来信：当 AI 学会写代码之后",
    description: "前 Google 工程师老李谈他从写代码到被代码写的转变。这是他给国内同行的一封长信。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/siliconvalley-001.mp3",
    duration_sec: 2980,
    plays: 15782,
    genre: "访谈",
    topic: "科技",
    chapters: [
      { t: 0, label: "来信背景" },
      { t: 360, label: "工具的演化" },
      { t: 1200, label: "写代码的人去哪儿了" },
      { t: 2100, label: "新角色" },
      { t: 2700, label: "建议与展望" },
    ],
    published_at: "2026-07-09T12:00:00Z",
    featured: true,
  },
  {
    id: "ep-005",
    title: "红楼梦·第一回：甄士隐梦幻识通灵",
    description: "用声音重新打开红楼梦。甄士隐的梦幻与贾雨村的出场，是理解整本书的两把钥匙。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/hongloumeng-001.mp3",
    duration_sec: 2100,
    plays: 6432,
    genre: "故事",
    topic: "文化",
    chapters: [
      { t: 0, label: "楔子" },
      { t: 400, label: "甄士隐" },
      { t: 1100, label: "通灵宝玉" },
      { t: 1700, label: "贾雨村" },
    ],
    published_at: "2026-07-11T15:00:00Z",
    featured: false,
  },
  {
    id: "ep-006",
    title: "夜话小马歌：三十岁后我才学会的几件事",
    description: "不是大道理，是一些迟到的、关于失败、关于选择、关于自我原谅的小事。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/yehua-001.mp3",
    duration_sec: 1620,
    plays: 4521,
    genre: "随笔",
    topic: "生活",
    chapters: [
      { t: 0, label: "深夜开场" },
      { t: 300, label: "关于失败" },
      { t: 800, label: "关于选择" },
      { t: 1200, label: "关于原谅自己" },
    ],
    published_at: "2026-07-12T00:30:00Z",
    featured: false,
  },
  {
    id: "ep-007",
    title: "科普·黑洞：宇宙最优雅的骗局",
    description: "从霍金辐射到事件视界，用普通人能听懂的话讲黑洞。本期嘉宾：中科院物理所的小林。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/blackhole-001.mp3",
    duration_sec: 2640,
    plays: 9821,
    genre: "科普",
    topic: "科技",
    chapters: [
      { t: 0, label: "什么是黑洞" },
      { t: 480, label: "事件视界" },
      { t: 1200, label: "霍金辐射" },
      { t: 1900, label: "如果掉进去" },
    ],
    published_at: "2026-07-07T09:00:00Z",
    featured: false,
  },
  {
    id: "ep-008",
    title: "商业故事：从 0 到 1，她把一家小书店做成了城市文化地标",
    description: "十一年，只开三家店。慢得不像商业，但活得比谁都稳。",
    author: "小马歌",
    cover: null,
    audio_url: "https://example.com/audio/bookstore-001.mp3",
    duration_sec: 3120,
    plays: 7230,
    genre: "故事",
    topic: "商业",
    chapters: [
      { t: 0, label: "第一家店" },
      { t: 600, label: "最难那一年" },
      { t: 1500, label: "第二家店" },
      { t: 2400, label: "第三家店" },
    ],
    published_at: "2026-07-06T11:00:00Z",
    featured: false,
  },
];

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPlays(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** 相对时间（中文） */
export function timeAgo(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} 个月前`;
  return `${Math.floor(mo / 12)} 年前`;
}
