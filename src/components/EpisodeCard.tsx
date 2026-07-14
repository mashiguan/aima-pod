"use client";

import Link from "next/link";
import { Episode, Tag } from "@/lib/types";
import {
  formatDuration,
  formatPlays,
  GENRES,
  TOPICS,
  coverGradient,
  coverGlyph,
  timeAgo,
} from "@/lib/mock-data";
import { Play, Headphones } from "lucide-react";

// Tailwind JIT safelist：8 个封面渐变完整 class 字符串
// （mock-data 里动态拼接，JIT 扫不到，需要在这里显式引用）
void (
  "from-violet-500 via-fuchsia-500 to-pink-500|" +
  "from-rose-500 via-orange-400 to-amber-500|" +
  "from-sky-500 via-blue-500 to-indigo-600|" +
  "from-emerald-500 via-teal-400 to-cyan-500|" +
  "from-orange-500 via-red-500 to-fuchsia-600|" +
  "from-cyan-500 via-sky-400 to-blue-500|" +
  "from-amber-500 via-orange-500 to-rose-500|" +
  "from-fuchsia-500 via-purple-500 to-indigo-600"
);

export function EpisodeCard({ ep, tagMap }: { ep: Episode; tagMap?: Map<string, Tag> }) {
  // 优先从后台 tags 表查,fallback 到 mock 默认
  const tagGenre = tagMap?.get(`genre:${ep.genre}`);
  const tagTopic = tagMap?.get(`topic:${ep.topic}`);
  const genre = tagGenre
    ? { value: tagGenre.value, label: tagGenre.label, color: tagGenre.color }
    : GENRES.find((g) => g.value === ep.genre);
  const topic = tagTopic
    ? { value: tagTopic.value, label: tagTopic.label, color: tagTopic.color }
    : TOPICS.find((t) => t.value === ep.topic);
  const gradient = coverGradient(ep.id);
  const glyph = coverGlyph(ep.title);
  return (
    <Link
      href={`/episode/${ep.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-violet-500/10"
    >
      <div
        className={`relative aspect-square w-full overflow-hidden bg-gradient-to-br ${gradient}`}
      >
        {ep.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ep.cover_url}
            alt={ep.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* 大字水印（无封面时才显示） */}
        {!ep.cover_url && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-2 select-none text-[140px] font-black leading-none text-white/20 transition group-hover:text-white/30"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {glyph}
        </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur transition duration-300 group-hover:scale-110 group-hover:bg-white/30">
            <Play className="h-7 w-7 fill-white text-white" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white tabular-nums">
          {formatDuration(ep.duration_sec)}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-white transition group-hover:text-violet-200">
          {ep.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {genre && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset ${genre.color}`}>
              {genre.label}
            </span>
          )}
          {topic && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset ${topic.color}`}>
              {topic.label}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between text-xs text-white/50">
          <span className="inline-flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            {formatPlays(ep.plays)}
          </span>
          <span className="text-white/40">{timeAgo(ep.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}
