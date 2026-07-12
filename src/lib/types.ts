/**
 * 全站通用类型定义（与 mock-data + 组件保持一致）
 * 接 Supabase 时再扩展 DB 字段映射（timestamp_seconds / play_count 等）
 */

export const GENRES = ["故事", "访谈", "随笔", "科普"] as const;
export type Genre = (typeof GENRES)[number];

export const TOPICS = ["历史", "科技", "文化", "生活", "商业", "娱乐"] as const;
export type Topic = (typeof TOPICS)[number];

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
  audio_url: string;
  duration_sec: number;
  plays: number;
  genre: Genre;
  topic: Topic;
  chapters: Chapter[];
  published_at: string;
  featured: boolean;
}
