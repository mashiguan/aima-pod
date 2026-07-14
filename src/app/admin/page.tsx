"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/mock-data";
import { createEpisode, listMyEpisodes, listTags } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Episode, Tag } from "@/lib/types";
import { Trash2, Music, FileAudio, ListMusic } from "lucide-react";

interface FormState {
  title: string;
  description: string;
  author: string;
  duration_sec: string; // 分钟
  genre: string; // 标签 value
  topic: string; // 标签 value
  audioFile: File | null;
  audioFileName: string;
  coverFile: File | null;
  coverFileName: string;
  chaptersText: string; // 一行一个：mm:ss 章节名
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  author: "小马歌",
  duration_sec: "",
  genre: "",
  topic: "",
  audioFile: null,
  audioFileName: "",
  coverFile: null,
  coverFileName: "",
  chaptersText: "00:00  开场",
};

// 解析 mm:ss 章节文本 → chapters
function parseChapters(text: string): { t: number; label: string }[] {
  // 支持两种格式：
  //  1) 单行：mm:ss + 任意空白 + 章节名     e.g. "00:00  开场"
  //  2) 两行：mm:ss 一行，标题下一行        e.g. "00:06\n电梯场景..."
  //      (中间可空行、任意行数间隔)
  const lines = text.split(/\r?\n/);
  const out: { t: number; label: string }[] = [];
  const timeRe = /^(\d{1,2}):(\d{1,2})$/;
  const lineRe = /^(\d{1,2}):(\d{1,2})\s+(.+)$/;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    // 优先尝试单行格式
    const single = line.match(lineRe);
    if (single) {
      const min = parseInt(single[1], 10);
      const sec = parseInt(single[2], 10);
      if (!isNaN(min) && !isNaN(sec) && sec < 60) {
        out.push({ t: min * 60 + sec, label: single[3].trim() });
      }
      continue;
    }
    // 尝试两行格式：当前是时间，下一行非空就是标题
    const time = line.match(timeRe);
    if (time) {
      // 往后找第一个非空行作为标题
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next) continue;
        const min = parseInt(time[1], 10);
        const sec = parseInt(time[2], 10);
        if (!isNaN(min) && !isNaN(sec) && sec < 60) {
          out.push({ t: min * 60 + sec, label: next });
          i = j; // 跳过已消费的标题行
        }
        break;
      }
    }
  }
  return out;
}

// 从文件名提取合理标题：去后缀、_/- 换空格、去掉首尾空白
function guessTitleFromFileName(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function AdminPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [list, setList] = useState<Episode[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null); // null=未确认, true=已通过
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [uploading, setUploading] = useState(false);

  // 检查是否已通过（localStorage 持久化）
  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(window.localStorage.getItem("aima_admin_ok") === "1");
  }, []);

  // 加载后台专属节目列表（放在 early return 之前，遵守 React hook 顺序）
  useEffect(() => {
    if (!authed) return;
    listMyEpisodes().then(setList).catch(() => setList([]));
  }, [authed]);

  // 加载后台标签（体裁 / 主题）用于表单下拉
  const [tagGenres, setTagGenres] = useState<Tag[]>([]);
  const [tagTopics, setTagTopics] = useState<Tag[]>([]);
  useEffect(() => {
    if (!authed) return;
    listTags().then((all) => {
      setTagGenres(all.filter((t) => t.kind === "genre"));
      setTagTopics(all.filter((t) => t.kind === "topic"));
    });
  }, [authed]);

  const tryPwd = () => {
    const want = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
    if (!want) {
      setPwdError("后端未设置 NEXT_PUBLIC_ADMIN_PASSWORD，无法进入");
      return;
    }
    if (pwd === want) {
      window.localStorage.setItem("aima_admin_ok", "1");
      setAuthed(true);
      setPwdError("");
    } else {
      setPwdError("密码不对，再试一次");
    }
  };

  if (authed === null) {
    return <div className="mx-auto max-w-md px-6 py-20 text-center text-white/40">验证中…</div>;
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-lg font-semibold text-white">管理后台</h1>
          <p className="mt-1 text-sm text-white/50">请输入管理密码</p>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryPwd()}
            placeholder="••••••••"
            className="mt-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
            autoFocus
          />
          {pwdError && <p className="mt-2 text-xs text-rose-300">{pwdError}</p>}
          <button
            onClick={tryPwd}
            className="mt-4 w-full rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
          >
            进入
          </button>
        </div>
      </div>
    );
  }


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const onPickFile = (f: File | null) => {
    if (!f) {
      setForm((s) => ({ ...s, audioFile: null, audioFileName: "" }));
      return;
    }
    // 1) 预填标题
    const guessedTitle = guessTitleFromFileName(f.name);
    setForm((s) => ({
      ...s,
      audioFile: f,
      audioFileName: f.name,
      title: s.title.trim() ? s.title : guessedTitle,
    }));
    // 2) 读取音频时长
    try {
      const url = URL.createObjectURL(f);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const sec = audio.duration;
        URL.revokeObjectURL(url);
        if (isFinite(sec) && sec > 0) {
          const minutes = (sec / 60).toFixed(1);
          setForm((s) => ({ ...s, duration_sec: s.duration_sec ? s.duration_sec : minutes }));
        }
      };
      audio.onerror = () => URL.revokeObjectURL(url);
      audio.src = url;
    } catch {}
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast("请先填标题");
    if (!form.audioFile) return showToast("请选择音频文件");

    setUploading(true);
    try {
      // 1) 先把音频文件上传到 Supabase Storage（audio bucket，public）
      let audio_url = "";
      let cover_url: string | null = null;
      const supa = createClient();
      if (supa) {
        // 用更安全的路径：纯英文+时间戳+随机后缀，完全避免中文/特殊字符
        const ext = (form.audioFile.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
        const rand = Math.random().toString(36).slice(2, 8);
        const path = `episodes/${Date.now()}-${rand}.${ext}`;
        const { error: upErr } = await supa.storage
          .from("audio")
          .upload(path, form.audioFile, {
            contentType: form.audioFile.type || "audio/mpeg",
            upsert: false,
          });
        if (upErr) {
          console.error("[storage.upload] error:", upErr, "path:", path, "file:", form.audioFile.name, "type:", form.audioFile.type, "size:", form.audioFile.size);
          throw new Error("音频上传失败：" + upErr.message + " (path=" + path + ")");
        }
        const { data: pub } = supa.storage.from("audio").getPublicUrl(path);
        audio_url = pub.publicUrl;

        // 1b) 如果有封面，上传到 covers bucket
        if (form.coverFile) {
          const cExt = (form.coverFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          const cRand = Math.random().toString(36).slice(2, 8);
          const cPath = `covers/${Date.now()}-${cRand}.${cExt}`;
          const { error: cErr } = await supa.storage
            .from("covers")
            .upload(cPath, form.coverFile, {
              contentType: form.coverFile.type || "image/jpeg",
              upsert: false,
            });
          if (cErr) {
            console.error("[cover.upload] error:", cErr, "path:", cPath);
            throw new Error("封面上传失败：" + cErr.message + " (path=" + cPath + ")");
          }
          const { data: cPub } = supa.storage.from("covers").getPublicUrl(cPath);
          cover_url = cPub.publicUrl;
        }
      } else {
        audio_url = URL.createObjectURL(form.audioFile);
      }

      const minutes = parseFloat(form.duration_sec);
      const duration_sec = isNaN(minutes) ? 0 : Math.round(minutes * 60);

      const newEp = await createEpisode({
        title: form.title.trim(),
        description: form.description.trim() || "（暂无描述）",
        author: form.author.trim() || "小马歌",
        duration_sec,
        genre: form.genre,
        topic: form.topic,
        audio_url,
        cover: cover_url,
        chapters: parseChapters(form.chaptersText),
        featured: false,
      });
      setList([newEp, ...list]);
      showToast("✅ 上传成功，已发布");
      setForm({ ...EMPTY_FORM, author: form.author });
    } catch (err: any) {
      showToast("保存失败：" + (err?.message || JSON.stringify(err) || "未知错误"));
    } finally {
      setUploading(false);
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
          上传 MP3 到 Supabase Storage、填元数据、加章节时间标签。文件会真存到云端，可永久播放。
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
                  <span className="text-white/50">点击选择 MP3 / M4A / WAV（最大 50MB）</span>
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

          {/* 封面选择（可选） */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">封面图 <span className="text-white/40">（可选）</span></label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-4 transition hover:border-violet-400/60 hover:bg-white/10">
              {form.coverFileName ? (
                <span className="text-sm text-white">{form.coverFileName}</span>
              ) : (
                <>
                  <span className="text-sm text-white/50">点击选择 JPG / PNG（最大 5MB，留空用渐变）</span>
                </>
              )}
              <span className="ml-auto rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200 ring-1 ring-violet-400/40">
                选择
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 5 * 1024 * 1024) {
                    showToast("封面太大，限制 5MB");
                    return;
                  }
                  setForm((s) => ({ ...s, coverFile: f, coverFileName: f ? f.name : "" }));
                }}
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
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
              >
                <option value="" className="bg-slate-900" disabled>
                  {tagGenres.length === 0 ? "加载中…" : "请选择"}
                </option>
                {tagGenres.map((g) => (
                  <option key={g.id} value={g.value} className="bg-slate-900">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">主题</label>
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
              >
                <option value="" className="bg-slate-900" disabled>
                  {tagTopics.length === 0 ? "加载中…" : "请选择"}
                </option>
                {tagTopics.map((t) => (
                  <option key={t.id} value={t.value} className="bg-slate-900">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 章节时间标签（单文本框：mm:ss 标题） */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">章节时间标签</label>
            <textarea
              value={form.chaptersText}
              onChange={(e) => setForm({ ...form, chaptersText: e.target.value })}
              rows={6}
              placeholder={"00:00  开场\n02:30  本期主题\n15:42  收尾互动"}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-white/30 outline-none focus:border-violet-400/60"
            />
            <p className="mt-1 text-xs text-white/40">
              一行一个，格式 <span className="font-mono">mm:ss  章节名</span>（中间 2 个空格）。<br />也支持两行格式：<span className="font-mono">mm:ss</span> 一行、章节名下一行。解析后 {parseChapters(form.chaptersText).length} 条。
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-white/5 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "上传中…" : "保存"}
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
