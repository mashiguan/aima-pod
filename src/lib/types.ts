/**
 * 全站通用类型定义（与 mock-data + 组件保持一致）
 * 接 Supabase 时再扩展 DB 字段映射（timestamp_seconds / play_count 等）
 */

export const GENRES = ["故事", "访谈", "随笔", "科普"] as const;
export type Genre = (typeof GENRES)[number];

export const TOPICS = ["历史", "科技", "文化", "生活", "商业", "娱乐"] as const;
export type Topic = (typeof TOPICS)[number];

/** 标签（后台可自定义的体裁 / 主题，存 Supabase tags 表） */
export interface Tag {
  id: string;
  kind: "genre" | "topic";
  value: string;
  label: string;
  color: string;
  sort: number;
}

/** 专辑 */
export interface Album {
  id: string;
  name: string;
  description: string;
  cover_url: string | null;
  created_at: string;
}

/** 专辑 + 该专辑内作品总播放数（首页/列表用） */
export interface AlbumWithStats extends Album {
  episode_count: number;
  total_plays: number;
}

export const INTERACTION_TYPES = ["like", "dislike", "favorite", "share"] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

/** 章节（前端：t=秒，label=标题） */
export interface Chapter {
  t: number;
  label: string;
}

/** 单条互动记录（localStorage / 未来 Supabase 通用） */
export interface Interaction {
  podcast_id: string;
  device_id: string;
  type: InteractionType;
  created_at?: string;
}

/** 播客（前端 view-model） */
export interface Episode {
  id: string;
  title: string;
  description: string;
  author: string;
  cover: string | null;
  cover_url?: string | null;
  audio_url: string;
  duration_sec: number;
  plays: number;
  genre: string; // 标签 value（对应 tags.value）
  topic: string; // 标签 value（对应 tags.value）
  chapters: Chapter[];
  published_at: string;
  featured: boolean;
  album_id?: string | null; // 所属专辑,可空
}
