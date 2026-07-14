"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDuration,
  formatPlays,
  GENRES,
  TOPICS,
  coverGradient,
} from "@/lib/mock-data";
import { getEpisode, hasInteraction, recordInteraction, removeInteraction, recordPlay, getInteractionCounts } from "@/lib/api";
import { Episode } from "@/lib/types";
import {
  ArrowLeft,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  Star,
  Share2,
  Headphones,
  Calendar,
  Clock,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useToast } from "@/components/Toast";

import { getDeviceId } from "@/lib/supabase/device";

function interactKey(epId: string) {
  return `aima-interact-${getDeviceId()}-${epId}`;
}

export default function EpisodePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [ep, setEp] = useState<Episode | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getEpisode(id).then((data) => {
      if (alive) setEp(data);
    });
    getInteractionCounts(id).then((c) => {
      if (alive) setCounts(c);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [favAnimKey, setFavAnimKey] = useState(0); // 触发星星弹动画

  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [fav, setFav] = useState(false);
  const [counts, setCounts] = useState<{ like: number; dislike: number; favorite: number; share: number }>({ like: 0, dislike: 0, favorite: 0, share: 0 });

  const { push, list: toastList } = useToast();

  // 读取持久化互动状态
  useEffect(() => {
    if (!ep || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(interactKey(ep.id));
      if (raw) {
        const d = JSON.parse(raw);
        setVote(d.vote ?? null);
        setFav(!!d.fav);
      } else {
        setVote(null);
        setFav(false);
      }
    } catch {}
  }, [ep?.id]);

  if (ep === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center text-white/50">正在加载…</div>
    );
  }
  if (ep === null) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-white/70">没找到这期节目。</p>
        <button
          onClick={() => router.push("/discover")}
          className="mt-4 rounded-full bg-violet-500 px-4 py-2 text-sm text-white transition hover:bg-violet-400"
        >
          去发现
        </button>
      </div>
    );
  }

  const genre = GENRES.find((g) => g.value === ep.genre);
  const topic = TOPICS.find((t) => t.value === ep.topic);
  const gradient = coverGradient(ep.id);
  const dur = Number(ep.duration_sec) || 0;
  const pct = dur > 0 ? Math.min(100, (currentTime / dur) * 100) : 0;

  // 持久化"已选状态"到 localStorage。key 内含 device_id，所以多端不会互踩。
  // 注意：next.vote / next.fav 是"目标最终值"，可能为 null/false（取消）。
  // 不要用 `?? vote`，否则取消时会用旧值写回，刷新又被读出来。
  const persist = (next: { vote?: "like" | "dislike" | null; fav?: boolean }) => {
    const data = {
      vote: next.vote !== undefined ? next.vote : vote,
      fav: next.fav !== undefined ? next.fav : fav,
    };
    try {
      localStorage.setItem(interactKey(ep.id), JSON.stringify(data));
    } catch {}
  };

  const playTrackedRef = useRef(false);
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => {});
      setPlaying(true);
      // 每次会话只计 1 次播放（避免在某个点反复点播放被刷高）
      if (!playTrackedRef.current) {
        playTrackedRef.current = true;
        recordPlay(ep.id).catch(() => {});
        setEp((cur) => (cur ? { ...cur, plays: (cur.plays || 0) + 1 } : cur));
      }
    }
  };

  const seekTo = (sec: number) => {
    const a = audioRef.current;
    const s = Math.max(0, Math.min(dur, sec));
    if (a) {
      a.currentTime = s;
      setCurrentTime(s);
      if (!playing) {
        a.play().catch(() => {});
        setPlaying(true);
      }
    } else {
      // audio 404 时：手动更新 currentTime 即可（slider 还能拖）
      setCurrentTime(s);
    }
  };

  const skip = (delta: number) => seekTo(currentTime + delta);

  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const onLike = () => {
    const next = vote === "like" ? null : "like";
    setVote(next);
    persist({ vote: next });
    if (next) {
      recordInteraction(ep.id, "like").catch(() => {});
      setCounts((c) => ({ ...c, like: c.like + 1 }));
      push("like");
    } else {
      removeInteraction(ep.id, "like").catch(() => {});
      setCounts((c) => ({ ...c, like: Math.max(0, c.like - 1) }));
    }
  };
  const onDislike = () => {
    const next = vote === "dislike" ? null : "dislike";
    setVote(next);
    persist({ vote: next });
    if (next) {
      recordInteraction(ep.id, "dislike").catch(() => {});
      setCounts((c) => ({ ...c, dislike: c.dislike + 1 }));
      push("dislike");
    } else {
      removeInteraction(ep.id, "dislike").catch(() => {});
      setCounts((c) => ({ ...c, dislike: Math.max(0, c.dislike - 1) }));
    }
  };
  const onFav = () => {
    const next = !fav;
    setFav(next);
    setFavAnimKey((k) => k + 1);
    persist({ fav: next });
    if (next) {
      recordInteraction(ep.id, "favorite").catch(() => {});
      setCounts((c) => ({ ...c, favorite: c.favorite + 1 }));
    } else {
      removeInteraction(ep.id, "favorite").catch(() => {});
      setCounts((c) => ({ ...c, favorite: Math.max(0, c.favorite - 1) }));
    }
    push(next ? "fav-on" : "fav-off");
  };
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    recordInteraction(ep.id, "share").catch(() => {});
    setCounts((c) => ({ ...c, share: c.share + 1 }));
    push("share");
  };

  return (
    <>
      {toastList}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <button
          onClick={() => router.back()}
          className="group mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" /> 返回
        </button>

        {/* 封面 + 信息 */}
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div
            className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} ring-1 ring-white/10`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:scale-105 hover:bg-white/20">
                <Play className="h-9 w-9 fill-white text-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
              {formatDuration(ep.duration_sec)}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{ep.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/60">
              <span>主播：{ep.author}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Headphones className="h-3 w-3" /> {formatPlays(ep.plays)} 播放
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {ep.published_at.slice(0, 10)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
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
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60 ring-1 ring-inset ring-white/10">
                <Clock className="h-2.5 w-2.5" /> {formatDuration(ep.duration_sec)}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{ep.description}</p>
          </div>
        </div>

        {/* 播放器 */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <audio
            ref={audioRef}
            src={ep.audio_url}
            onTimeUpdate={onTimeUpdate}
            onEnded={() => setPlaying(false)}
            preload="metadata"
          />
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 transition hover:scale-105 hover:bg-violet-400"
              aria-label={playing ? "暂停" : "播放"}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
            </button>

            <button
              onClick={() => skip(-15)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="后退 15 秒"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={Math.max(1, dur)}
                value={Math.floor(currentTime)}
                step={1}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="aima-range w-full"
                style={{ ["--pct" as any]: `${pct}%` }}
                aria-label="播放进度"
              />
              <div className="mt-1 flex justify-between text-xs text-white/50 tabular-nums">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(ep.duration_sec)}</span>
              </div>
            </div>

            <button
              onClick={() => skip(15)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="前进 15 秒"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* 互动 */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
            <button
              onClick={onLike}
              aria-label={vote === "like" ? "取消点赞" : "点赞"}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm ring-1 ring-inset transition active:scale-95 ${
                vote === "like"
                  ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/40"
                  : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${vote === "like" ? "fill-emerald-300" : ""}`} /> 点赞 <span className="tabular-nums text-xs opacity-70">{counts.like}</span>
            </button>
            <button
              onClick={onDislike}
              aria-label={vote === "dislike" ? "取消点踩" : "点踩"}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm ring-1 ring-inset transition active:scale-95 ${
                vote === "dislike"
                  ? "bg-rose-500/20 text-rose-300 ring-rose-400/40"
                  : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
              }`}
            >
              <ThumbsDown className={`h-4 w-4 ${vote === "dislike" ? "fill-rose-300" : ""}`} /> 点踩 <span className="tabular-nums text-xs opacity-70">{counts.dislike}</span>
            </button>
            <button
              onClick={onFav}
              aria-label={fav ? "取消收藏" : "收藏"}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm ring-1 ring-inset transition active:scale-95 ${
                fav
                  ? "bg-amber-500/20 text-amber-300 ring-amber-400/40"
                  : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
              }`}
            >
              <span key={favAnimKey} className={fav ? "animate-fav-pop inline-flex" : "inline-flex"}>
                <Star className={`h-4 w-4 ${fav ? "fill-amber-300" : ""}`} />
              </span>
              {fav ? "已收藏" : "收藏"} <span className="tabular-nums text-xs opacity-70">{counts.favorite}</span>
            </button>
            <button
              onClick={onShare}
              aria-label="转发复制链接"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-1.5 text-sm text-white/70 ring-1 ring-inset ring-white/10 transition active:scale-95 hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" /> 转发 <span className="tabular-nums text-xs opacity-70">{counts.share}</span>
            </button>
          </div>
        </div>

        {/* 章节 */}
        {ep.chapters.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-white">章节</h2>
            <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {ep.chapters.map((c, i) => {
                const isCurrent = currentTime >= c.t && (i === ep.chapters.length - 1 || currentTime < ep.chapters[i + 1].t);
                return (
                  <li key={i}>
                    <button
                      onClick={() => seekTo(c.t)}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-white/10 ${
                        isCurrent
                          ? "border-l-2 border-violet-300 bg-violet-500/15"
                          : "border-l-2 border-transparent"
                      }`}
                    >
                      <span
                        className={`w-14 shrink-0 font-mono text-sm tabular-nums ${
                          isCurrent ? "font-semibold text-violet-200" : "text-violet-300/80"
                        }`}
                      >
                        {formatDuration(c.t)}
                      </span>
                      <span
                        className={`flex-1 text-sm ${
                          isCurrent ? "font-medium text-white" : "text-white/80"
                        }`}
                      >
                        {c.label}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] font-medium text-violet-100 ring-1 ring-inset ring-violet-300/40">
                          正在听
                        </span>
                      ) : (
                        <Play className="h-3.5 w-3.5 text-white/40" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
