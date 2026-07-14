import Link from "next/link";
import { EpisodeCard } from "@/components/EpisodeCard";
import { listEpisodes } from "@/lib/api";
import { ArrowRight, Sparkles } from "lucide-react";

// 实时拉取：后台发新节目后刷首页立刻能看到
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const all = await listEpisodes();
  // 热门 = 按 plays 降序取前 4
  const featured = [...all].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 4);
  // 最新 = 按发布时间降序取前 4（与热门不互斥，同一部可以两边都在）
  const latest = [...all]
    .sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at))
    .slice(0, 4);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-3xl animate-hero-glow" />
          <div
            className="absolute -right-1/4 top-20 h-[500px] w-[500px] rounded-full bg-fuchsia-500/15 blur-3xl animate-hero-glow"
            style={{ animationDelay: "-4s" }}
          />
          <div
            className="absolute left-1/3 top-40 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-3xl animate-hero-glow"
            style={{ animationDelay: "-8s" }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <Sparkles className="h-3 w-3 text-violet-300" /> 小马歌 · 声音与故事
          </p>
          <h1 className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
            爱玛播 · 随心说
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/60">
            故事/访谈/随笔/经典——情绪/关系/认知/智慧。
            品一杯茶，听一朵花。
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/discover"
              className="group inline-flex items-center gap-1.5 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400"
            >
              开始聆听
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 热门 */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">热门播客</h2>
            <p className="mt-1 text-sm text-white/50">最近被反复点开的那几期</p>
          </div>
          <Link
            href="/discover"
            className="group inline-flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200"
          >
            看全部
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((ep) => (
            <EpisodeCard key={ep.id} ep={ep} />
          ))}
        </div>
      </section>

      {/* 最新 */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">最新发布</h2>
            <p className="mt-1 text-sm text-white/50">刚刚上线的几期</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {latest.map((ep) => (
            <EpisodeCard key={ep.id} ep={ep} />
          ))}
        </div>
      </section>
    </>
  );
}
