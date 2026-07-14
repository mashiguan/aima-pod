"use client";

import { useEffect, useMemo, useState } from "react";
import { GENRES, TOPICS } from "@/lib/mock-data";
import { EpisodeCard } from "@/components/EpisodeCard";
import { listEpisodes, listTags } from "@/lib/api";
import { Episode, Tag } from "@/lib/types";
import { Search, X } from "lucide-react";

type SortKey = "newest" | "popular" | "shortest" | "longest";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "最新发布" },
  { value: "popular", label: "最多播放" },
  { value: "shortest", label: "时长最短" },
  { value: "longest", label: "时长最长" },
];

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [all, setAll] = useState<Episode[]>([]);
  const [tagMap, setTagMap] = useState<Map<string, Tag>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listEpisodes(), listTags()]).then(([list, tags]) => {
      if (alive) {
        setAll(list);
        setTagMap(new Map(tags.map((t) => [`${t.kind}:${t.value}`, t])));
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const results = useMemo(() => {
    let list = all.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.author.toLowerCase().includes(q),
      );
    }
    if (selectedGenres.length) list = list.filter((e) => selectedGenres.includes(e.genre));
    if (selectedTopics.length) list = list.filter((e) => selectedTopics.includes(e.topic));
    if (sort === "newest") list.sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at));
    if (sort === "popular") list.sort((a, b) => b.plays - a.plays);
    if (sort === "shortest") list.sort((a, b) => a.duration_sec - b.duration_sec);
    if (sort === "longest") list.sort((a, b) => b.duration_sec - a.duration_sec);
    return list;
  }, [all, query, selectedGenres, selectedTopics, sort]);

  const activeCount = selectedGenres.length + selectedTopics.length + (query ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">发现</h1>
        <p className="mt-2 text-sm text-white/60">
          按体裁、主题、关键词，挖一挖你可能喜欢的节目。
        </p>
      </header>

      <div className="space-y-5">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索节目、描述、作者…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm text-white placeholder-white/40 outline-none transition focus:border-violet-400/60 focus:bg-white/10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="清空"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 体裁 */}
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/50">体裁</div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const active = selectedGenres.includes(g.value);
              return (
                <button
                  key={g.value}
                  onClick={() => setSelectedGenres(toggle(selectedGenres, g.value))}
                  className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-inset transition ${
                    active
                      ? g.color + " ring-2"
                      : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 主题 */}
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/50">主题</div>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => {
              const active = selectedTopics.includes(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => setSelectedTopics(toggle(selectedTopics, t.value))}
                  className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-inset transition ${
                    active
                      ? t.color + " ring-2"
                      : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 排序 + 清空 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>共 {results.length} 期</span>
            {activeCount > 0 && (
              <button
                onClick={() => {
                  setQuery("");
                  setSelectedGenres([]);
                  setSelectedTopics([]);
                }}
                className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                清空筛选 ×
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">排序</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-400/60"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="bg-slate-900">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 结果 */}
      {loading ? (
        <div className="mt-16 text-center text-white/50">正在加载…</div>
      ) : results.length === 0 ? (
        <div className="mt-16 text-center text-white/50">没找到匹配的节目，换个关键词试试？</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((ep) => (
            <EpisodeCard key={ep.id} ep={ep} tagMap={tagMap} />
          ))}
        </div>
      )}
    </div>
  );
}
