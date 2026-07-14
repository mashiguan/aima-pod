import Link from "next/link";
import { listAlbumsWithStats } from "@/lib/api";
import { Disc3, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "专辑 · 爱玛播",
  description: "按主题串起的好声音。",
};

export default async function AlbumsPage() {
  const albums = await listAlbumsWithStats();
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">专辑</h1>
        <p className="mt-1 text-sm text-white/60">按主题串起的好声音 · 共 {albums.length} 个</p>
      </header>

      {albums.length === 0 ? (
        <div className="py-20 text-center text-white/40">还没有专辑</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Link
              key={a.id}
              href={`/album/${a.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-violet-400/40 hover:bg-white/5"
            >
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white"
                style={
                  a.cover_url
                    ? { backgroundImage: `url(${a.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                {!a.cover_url && <Disc3 className="h-7 w-7" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-white group-hover:text-violet-200">
                  {a.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/55">
                  {a.description || "（暂无介绍）"}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-white/40">
                  <Headphones className="h-3 w-3" /> {a.episode_count} 期 · {a.total_plays} 收听
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
