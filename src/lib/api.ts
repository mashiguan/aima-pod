/**
 * 播客数据层：Supabase + mock 双轨
 * - 有 NEXT_PUBLIC_SUPABASE_URL 时走 supabase
 * - 没有时降级到 MOCK_EPISODES（开发 / 部署前）
 *
 * 所有组件统一从这套 API 拿数据，不直接 import mock。
 */

import { Episode, Interaction, InteractionType, Tag } from "./types";
import { MOCK_EPISODES } from "./mock-data";
import { createClient } from "./supabase/client";
import { getDeviceId } from "./supabase/device";

/* ---------- 1. 列表 / 单条 ---------- */

export async function listEpisodes(): Promise<Episode[]> {
  const sb = createClient();
  if (!sb) return MOCK_EPISODES;

  const { data, error } = await sb
    .from("episodes")
    .select("*")
    .order("published_at", { ascending: false });
  if (error || !data) {
    console.warn("[supabase] listEpisodes fallback to mock:", error?.message);
    return MOCK_EPISODES;
  }
  return data.map(rowToEpisode);
}

export async function getEpisode(id: string): Promise<Episode | null> {
  const sb = createClient();
  if (!sb) return MOCK_EPISODES.find((e) => e.id === id) ?? null;

  const { data, error } = await sb
    .from("episodes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return MOCK_EPISODES.find((e) => e.id === id) ?? null;
  }
  return rowToEpisode(data);
}

/* ---------- 2. 创建 ---------- */

export interface NewEpisodeInput {
  title: string;
  description: string;
  author: string;
  duration_sec: number;
  genre: string;
  topic: string;
  audio_url: string;
  cover: string | null;
  chapters: { t: number; label: string }[];
  featured: boolean;
}

export async function createEpisode(input: NewEpisodeInput): Promise<Episode> {
  const sb = createClient();
  const ep: Episode = {
    id: `ep-${Date.now().toString(36)}`,
    ...input,
    plays: 0,
    published_at: new Date().toISOString(),
  };

  if (!sb) {
    // mock 模式：写 localStorage，刷新前有效
    if (typeof window !== "undefined") {
      const KEY = "aima_my_episodes";
      const list = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Episode[];
      list.unshift(ep);
      window.localStorage.setItem(KEY, JSON.stringify(list));
    }
    return ep;
  }

  const { error } = await sb.from("episodes").insert({
    id: ep.id,
    title: ep.title,
    description: ep.description,
    author: ep.author,
    duration_sec: ep.duration_sec,
    genre: ep.genre,
    topic: ep.topic,
    audio_url: ep.audio_url,
    cover: ep.cover,
    cover_url: ep.cover,
    chapters: ep.chapters,
    featured: ep.featured,
    plays: 0,
    published_at: ep.published_at,
  });
  if (error) {
    console.error("[createEpisode] supabase error:", error);
    throw new Error(`episodes 写入失败：${error.message}（code=${error.code}，hint=${error.hint}）`);
  }
  return ep;
}

export async function listMyEpisodes(): Promise<Episode[]> {
  const sb = createClient();
  if (!sb) {
    if (typeof window === "undefined") return [];
    return JSON.parse(window.localStorage.getItem("aima_my_episodes") || "[]") as Episode[];
  }
  // 真实模式：「我创建的」=device_id 匹配的（需要 episodes 表带 created_by 字段，
  // schema 已带，见 migrations/0001_init.sql）
  const deviceId = getDeviceId();
  const { data, error } = await sb
    .from("episodes")
    .select("*")
    .eq("created_by", deviceId)
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToEpisode);
}

/* ---------- 3. 互动 ---------- */

export async function recordInteraction(
  podcast_id: string,
  type: InteractionType,
): Promise<void> {
  const sb = createClient();
  if (!sb) {
    // mock 模式：localStorage 计数
    if (typeof window === "undefined") return;
    const k = `aima_count_${podcast_id}_${type}`;
    window.localStorage.setItem(k, String(Number(window.localStorage.getItem(k) || "0") + 1));
    return;
  }
  // 有则什么都不做（忽略 unique 冲突）、无则插入
  await sb.from("interactions").insert(
    { podcast_id, device_id: getDeviceId(), type },
    { ignoreDuplicates: true },
  );
}

export async function removeInteraction(
  podcast_id: string,
  type: InteractionType,
): Promise<void> {
  const sb = createClient();
  if (!sb) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(`aima_count_${podcast_id}_${type}`);
    return;
  }
  await sb
    .from("interactions")
    .delete()
    .eq("podcast_id", podcast_id)
    .eq("device_id", getDeviceId())
    .eq("type", type);
}

export async function getInteractionCounts(
  podcast_id: string,
): Promise<Record<InteractionType, number>> {
  const sb = createClient();
  const zero = { like: 0, dislike: 0, favorite: 0, share: 0 } as Record<InteractionType, number>;
  if (!sb) {
    if (typeof window === "undefined") return zero;
    for (const t of Object.keys(zero) as InteractionType[]) {
      zero[t] = Number(window.localStorage.getItem(`aima_count_${podcast_id}_${t}`) || "0");
    }
    return zero;
  }
  const { data, error } = await sb
    .from("interactions")
    .select("type")
    .eq("podcast_id", podcast_id);
  if (error || !data) return zero;
  for (const row of data) zero[row.type as InteractionType] = (zero[row.type as InteractionType] || 0) + 1;
  return zero;
}

export async function hasInteraction(
  podcast_id: string,
  type: InteractionType,
): Promise<boolean> {
  const sb = createClient();
  if (!sb) {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(`aima_count_${podcast_id}_${type}`) !== null;
  }
  const { data, error } = await sb
    .from("interactions")
    .select("id")
    .eq("podcast_id", podcast_id)
    .eq("device_id", getDeviceId())
    .eq("type", type)
    .limit(1);
  return !error && !!data && data.length > 0;
}

export async function recordPlay(podcast_id: string): Promise<void> {
  const sb = createClient();
  if (!sb) {
    if (typeof window === "undefined") return;
    const k = `aima_play_${podcast_id}`;
    window.localStorage.setItem(k, String(Number(window.localStorage.getItem(k) || "0") + 1));
    return;
  }
  // 真实：RPC（原子 +1），fallback to direct upsert
  const { error } = await sb.rpc("increment_plays", { ep_id: podcast_id });
  if (error) {
    // 兜底
    const { data } = await sb.from("episodes").select("plays").eq("id", podcast_id).maybeSingle();
    if (data) {
      await sb.from("episodes").update({ plays: (data.plays || 0) + 1 }).eq("id", podcast_id);
    }
  }
}

/* ---------- 4. 行 → Episode ---------- */

function rowToEpisode(row: any): Episode {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    author: row.author,
    cover: row.cover,
    audio_url: row.audio_url,
    cover_url: row.cover_url || row.cover,
    duration_sec: row.duration_sec,
    plays: row.plays || 0,
    genre: row.genre,
    topic: row.topic,
    chapters: Array.isArray(row.chapters) ? row.chapters : [],
    published_at: row.published_at,
    featured: !!row.featured,
  };
}

/* ---------- 5. 标签管理 ---------- */

/** 后台可用的 8 套 Tailwind 调色板（防乱填） */
export const TAG_COLOR_PRESETS = [
  { name: "玫红", value: "bg-rose-500/10 text-rose-300 ring-rose-500/30" },
  { name: "橙",   value: "bg-orange-500/10 text-orange-300 ring-orange-500/30" },
  { name: "琥珀", value: "bg-amber-500/10 text-amber-300 ring-amber-500/30" },
  { name: "黄绿", value: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30" },
  { name: "青",   value: "bg-teal-500/10 text-teal-300 ring-teal-500/30" },
  { name: "天蓝", value: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30" },
  { name: "蓝",   value: "bg-sky-500/10 text-sky-300 ring-sky-500/30" },
  { name: "紫",   value: "bg-violet-500/10 text-violet-300 ring-violet-500/30" },
  { name: "粉",   value: "bg-pink-500/10 text-pink-300 ring-pink-500/30" },
  { name: "品红", value: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/30" },
];

export async function listTags(kind?: "genre" | "topic"): Promise<Tag[]> {
  const sb = createClient();
  if (!sb) return [];
  let q = sb.from("tags").select("*").order("sort", { ascending: true });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error || !data) {
    console.warn("[supabase] listTags failed:", error?.message);
    return [];
  }
  return (data as Tag[]).map((t) => ({
    id: t.id,
    kind: t.kind,
    value: t.value,
    label: t.label,
    color: t.color,
    sort: t.sort ?? 0,
  }));
}

export interface NewTagInput {
  kind: "genre" | "topic";
  value: string;
  label: string;
  color: string;
  sort?: number;
}

export async function createTag(input: NewTagInput): Promise<Tag> {
  const sb = createClient();
  if (!sb) throw new Error("Supabase 未配置");
  const { data, error } = await sb
    .from("tags")
    .insert({
      kind: input.kind,
      value: input.value,
      label: input.label,
      color: input.color,
      sort: input.sort ?? 999,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "创建失败");
  return data as Tag;
}

export async function updateTag(id: string, patch: Partial<NewTagInput>): Promise<void> {
  const sb = createClient();
  if (!sb) throw new Error("Supabase 未配置");
  const { error } = await sb.from("tags").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTag(id: string): Promise<void> {
  const sb = createClient();
  if (!sb) throw new Error("Supabase 未配置");
  const { error } = await sb.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
