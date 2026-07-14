import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlbum, listEpisodes, listTags } from "@/lib/api";
import { EpisodeCard } from "@/components/EpisodeCard";
import { AlbumSubButton } from "@/components/AlbumSubButton";
import { Disc3, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const album = await getAlbum(params.id);
  if (!album) notFound();
  const all = await listEpisodes();
  const eps = all
    .filter((e) => e.album_id === album.id)
    .sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at));
  const allTags = await listTags();
  const tagMap = new Map(allTags.map((t) => [`${t.kind}:${t.value}`, t]));
  const totalPlays = eps.reduce((s, e) => s + (e.plays || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/albums"
        className="mb-4 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" /> 全部专辑
      </Link>

      <header className="flex flex-col gap-6 border-b border-white/5 pb-8 sm:flex-row sm:items-end">
        <div
          className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-xl shadow-violet-500/20"
          style={
            album.cover_url
              ? { backgroundImage: `url(${album.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          {!album.cover_url && <Disc3 className="h-12 w-12 text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-violet-300">专辑</p>
          <h1 className="mt-1 text-3xl font-bold text-white">{album.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">{album.description || "（暂无介绍）"}</p>
          <p className="mt-3 text-xs text-white/40">
            {eps.length} 期 · {totalPlays} 次收听
          </p>
        </div>
        <AlbumSubButton albumId={album.id} />
      </header>

      <section className="mt-8">
        {eps.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/40">这个专辑还没有作品</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {eps.map((ep) => (
              <EpisodeCard key={ep.id} ep={ep} tagMap={tagMap} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
