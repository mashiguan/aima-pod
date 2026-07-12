"use client";

import { useEffect, useState } from "react";
import { GENRES, TOPICS, formatDuration } from "@/lib/mock-data";
import { createEpisode, listMyEpisodes } from "@/lib/api";
import { Episode, Genre, Topic } from "@/lib/types";
import { Plus, Trash2, Music, FileAudio, ListMusic } from "lucide-react";

interface FormState {
  title: string;
  description: string;
  author: string;
  duration_sec: string; // 分钟
  genre: Genre;
  topic: Topic;
  audioFile: File | null;
  audioFileName: string;
  chapters: { t: string; label: string }[];
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  author: "小马歌",
  duration_sec: "",
  genre: "故事",
  topic: "历史",
  audioFile: null,
  audioFileName: "",
  chapters: [{ t: "0", label: "开场" }],
};

export default function AdminPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [list, setList] = useState<Episode[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    listMyEpisodes().then(setList).catch(() => setList([]));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const onPickFile = (f: File | null) => {
    setForm((s) => ({ ...s, audioFile: f, audioFileName: f ? f.name : "" }));
  };

  const addChapter = () =>
    setForm((s) => ({ ...s, chapters: [...s.chapters, { t: "", label: "" }] }));
  const updateChapter = (i: number, key: "t" | "label", val: string) => {
    setForm((s) => ({
      ...s,
      chapters: s.chapters.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)),
    }));
  };
  const removeChapter = (i: number) => {
    setForm((s) => ({ ...s, chapters: s.chapters.filter((_, idx) => idx !== i) }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast("请先填标题");
    if (!form.audioFileName && !form.audioFile) return showToast("请选择 MP3 文件");
    const minutes = parseFloat(form.duration_sec);
    const duration_sec = isNaN(minutes) ? 0 : Math.round(minutes * 60);
    try {
      const newEp = await createEpisode({
        title: form.title.trim(),
        description: form.description.trim() || "（暂无描述）",
        author: form.author.trim() || "小马歌",
        duration_sec,
        genre: form.genre,
        topic: form.topic,
        audio_url: form.audioFile ? URL.createObjectURL(form.audioFile) : "",
        cover: null,
        chapters: form.chapters
          .filter((c) => c.label.trim())
          .map((c) => ({ t: parseInt(c.t || "0", 10), label: c.label.trim() })),
        featured: false,
      });
      setList([newEp, ...list]);
      showToast("已保存到本地（如有 .env 也会同步 Supabase）");
      setForm({ ...EMPTY_FORM, author: form.author });
    } catch (err: any) {
      showToast("保存失败：" + (err?.message || "未知错误"));
    }
  };

  const onDelete = (id: string) => {
    if (!confirm("确认删除这条节目？")) return;
    const next = list.filter((e) => e.id !== id);
    setList(next);
    // TODO: 接 supabase 后调用 delete
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">后台</h1>
        <p className="mt-2 text-sm text-white/60">
          上传 MP3、填元数据、加章节时间标签。当前是 mock 模式（数据存浏览器 localStorage）。
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* 表单 */}
        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          {/* 文件选择 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">MP3 文件 *</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-5 transition hover:border-violet-400/60 hover:bg-white/10">
              <FileAudio className="h-6 w-6 text-violet-300" />
              <div className="flex-1 text-sm">
                {form.audioFileName ? (
                  <span className="text-white">{form.audioFileName}</span>
                ) : (
                  <span className="text-white/50">点击选择 MP3（mock 模式仅取文件名）</span>
                )}
              </div>
              <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200 ring-1 ring-violet-400/40">
                选择
              </span>
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* 标题 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">标题 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：三国演义·第一回"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-violet-400/60"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="一两句话说清这期讲什么"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-violet-400/60"
            />
          </div>

          {/* 作者 + 时长 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">主播</label>
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">时长（分钟）</label>
              <input
                value={form.duration_sec}
                onChange={(e) => setForm({ ...form, duration_sec: e.target.value })}
                type="number"
                step="0.1"
                placeholder="例如 30.5"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
              />
            </div>
          </div>

          {/* 体裁 + 主题 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">体裁</label>
              <select
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value as Genre })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
              >
                {GENRES.map((g) => (
                  <option key={g.value} value={g.value} className="bg-slate-900">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">主题</label>
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value as Topic })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-900">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 章节时间标签 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-white">章节时间标签</label>
              <button
                type="button"
                onClick={addChapter}
                className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-inset ring-white/10 hover:bg-white/10"
              >
                <Plus className="h-3 w-3" /> 添加
              </button>
            </div>
            <div className="space-y-2">
              {form.chapters.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={c.t}
                    onChange={(e) => updateChapter(i, "t", e.target.value)}
                    placeholder="秒"
                    type="number"
                    className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60"
                  />
                  <input
                    value={c.label}
                    onChange={(e) => updateChapter(i, "label", e.target.value)}
                    placeholder="章节名"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => removeChapter(i)}
                    className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-rose-300"
                    aria-label="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {form.chapters.length === 0 && (
                <p className="text-xs text-white/40">没有章节。点"添加"加一个。</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-white/5 pt-4">
            <button
              type="submit"
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="rounded-full bg-white/5 px-5 py-2 text-sm text-white/70 ring-1 ring-inset ring-white/10 hover:bg-white/10"
            >
              重置
            </button>
            {toast && (
              <span className="text-sm text-emerald-300">{toast}</span>
            )}
          </div>
        </form>

        {/* 右侧：已上传列表 + mock 数据提示 */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <ListMusic className="h-4 w-4" /> 我创建的（{list.length}）
            </h3>
            {list.length === 0 ? (
              <p className="text-xs text-white/40">还没创建过。提交一次就会出现在这里。</p>
            ) : (
              <ul className="space-y-3">
                {list.map((ep) => (
                  <li
                    key={ep.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{ep.title}</p>
                        <p className="mt-0.5 text-xs text-white/50">
                          {ep.genre} · {ep.topic} · {formatDuration(ep.duration_sec)}
                        </p>
                      </div>
                      <button
                        onClick={() => onDelete(ep.id)}
                        className="rounded p-1 text-white/40 hover:bg-rose-500/10 hover:text-rose-300"
                        aria-label="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-violet-400/30 bg-violet-500/5 p-5 text-xs text-white/70">
            <p className="mb-1 flex items-center gap-1.5 font-medium text-violet-200">
              <Music className="h-3.5 w-3.5" /> mock 模式说明
            </p>
            <p className="leading-relaxed">
              上传的文件、创建的节目目前只存到浏览器 localStorage。接 Supabase 后：MP3 走 Storage，元数据走 Postgres，互动（点赞/收藏）走带 device_id 的 RLS。
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
