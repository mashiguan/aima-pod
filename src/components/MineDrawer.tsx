"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Heart, ThumbsUp, ThumbsDown, Headphones, Library, ChevronRight, Disc3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDeviceId } from "@/lib/supabase/device";
import type { Episode, Album } from "@/lib/types";

type Tab = "favorites" | "likes" | "albums";

export function MineDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("favorites");
  const [favorites, setFavorites] = useState<Episode[]>([]);
  const [likes, setLikes] = useState<Episode[]>([]);
  const [subs, setSubs] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const deviceId = getDeviceId();
    const sb = createClient();
    if (!sb) {
      setFavorites([]);
      setLikes([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data: favs } = await sb
        .from("interactions")
        .select("podcast_id")
        .eq("device_id", deviceId)
        .eq("type", "favorite");
      const { data: lks } = await sb
        .from("interactions")
        .select("podcast_id")
        .eq("device_id", deviceId)
        .eq("type", "like");
      const favRows = (favs ?? []) as { podcast_id: string }[];
      const likeRows = (lks ?? []) as { podcast_id: string }[];
      const ids = Array.from(new Set([...favRows.map((r) => r.podcast_id), ...likeRows.map((r) => r.podcast_id)]));
      if (ids.length === 0) {
        setFavorites([]);
        setLikes([]);
      } else {
        const { data: eps } = await sb.from("episodes").select("*").in("id", ids);
        const list = (eps ?? []) as Episode[];
        const favSet = new Set(favRows.map((r) => r.podcast_id));
        const likeSet = new Set(likeRows.map((r) => r.podcast_id));
        setFavorites(list.filter((e) => favSet.has(e.id)));
        setLikes(list.filter((e) => likeSet.has(e.id)));
      }

      // 订阅的专辑
      const { data: subRows } = await sb
        .from("album_subscriptions")
        .select("album_id, albums(*)")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });
      const subList = (subRows ?? []) as unknown as { albums: Album | null }[];
      setSubs(subList.map((r) => r.albums).filter((a): a is Album => !!a));

      setLoading(false);
    })();
  }, [open]);

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* 抽屉 */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-slate-950 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-bold text-white">我的</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-white/60 transition hover:bg-white/5 hover:text-white"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex border-b border-white/10 px-6 text-sm">
            <button
              onClick={() => setTab("favorites")}
              className={`-mb-px border-b-2 px-3 py-3 transition ${
                tab === "favorites"
                  ? "border-violet-400 text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <Heart className="mr-1 inline h-3.5 w-3.5" /> 收藏
            </button>
            <button
              onClick={() => setTab("likes")}
              className={`-mb-px border-b-2 px-3 py-3 transition ${
                tab === "likes"
                  ? "border-violet-400 text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <ThumbsUp className="mr-1 inline h-3.5 w-3.5" /> 赞过
            </button>
            <button
              onClick={() => setTab("albums")}
              className={`-mb-px border-b-2 px-3 py-3 transition ${
                tab === "albums"
                  ? "border-violet-400 text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <Disc3 className="mr-1 inline h-3.5 w-3.5" /> 专辑
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <p className="py-12 text-center text-sm text-white/40">加载中…</p>
            ) : (tab === "favorites" ? favorites : likes).length === 0 ? (
              <div className="py-12 text-center">
                <Library className="mx-auto h-10 w-10 text-white/15" />
                <p className="mt-3 text-sm text-white/40">
                  {tab === "favorites" ? "还没有收藏作品" : "还没有点赞作品"}
                </p>
                <Link
                  href="/discover"
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
                >
                  去发现页逛逛 <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : tab === "albums" ? (
              <ul className="space-y-2">
                {subs.length === 0 ? (
                  <li className="py-8 text-center text-sm text-white/40">还没有订阅专辑</li>
                ) : (
                  subs.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/album/${a.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-violet-400/40 hover:bg-white/5"
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 to-violet-600"
                          style={
                            a.cover_url
                              ? { backgroundImage: `url(${a.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                              : undefined
                          }
                        >
                          {!a.cover_url && <Disc3 className="h-5 w-5 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{a.name}</p>
                          <p className="truncate text-xs text-white/50">{a.description || "（暂无介绍）"}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/30" />
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <ul className="space-y-2">
                {(tab === "favorites" ? favorites : likes).map((ep) => (
                  <li key={ep.id}>
                    <Link
                      href={`/episode/${ep.id}`}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5"
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-cyan-600 text-white"
                        style={
                          ep.cover_url
                            ? {
                                backgroundImage: `url(${ep.cover_url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      >
                        {!ep.cover_url && <Headphones className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white group-hover:text-violet-200">
                          {ep.title}
                        </p>
                        <p className="truncate text-xs text-white/50">
                          {ep.author} · {ep.published_at?.slice(0, 10)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="border-t border-white/10 px-6 py-3 text-center text-[10px] text-white/30">
            设备 ID:{typeof window !== "undefined" ? getDeviceId().slice(0, 8) : "—"}…
          </footer>
        </div>
      </aside>
    </>
  );
}
