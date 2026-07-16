"use client";

import { useEffect, useState } from "react";
import { listAlbums, createAlbum, updateAlbum, deleteAlbum, uploadFile } from "@/lib/api";
import type { Album } from "@/lib/types";
import { Plus, Trash2, X, Check, Edit2, Image as ImageIcon } from "lucide-react";

export default function AdminAlbumsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 草稿
  const [draft, setDraft] = useState<{ name: string; description: string; coverFile: File | null; coverFileName: string; coverUrl: string | null }>(
    { name: "", description: "", coverFile: null, coverFileName: "", coverUrl: null },
  );
  const [editDraft, setEditDraft] = useState<{ name: string; description: string; coverFile: File | null; coverFileName: string; coverUrl: string | null }>(
    { name: "", description: "", coverFile: null, coverFileName: "", coverUrl: null },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(window.localStorage.getItem("aima_admin_ok") === "1");
  }, []);

  async function refresh() {
    setLoading(true);
    const list = await listAlbums();
    setAlbums(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!authed) return;
    refresh();
  }, [authed]);

  if (authed === null) {
    return <div className="mx-auto max-w-md px-6 py-20 text-center text-white/40">验证中…</div>;
  }
  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center text-white/60">
        请先在 <a href="/madmin" className="text-violet-300 underline">/madmin</a> 通过密码门
      </div>
    );
  }

  async function pickCover(file: File, mode: "draft" | "edit") {
    if (file.size > 5 * 1024 * 1024) {
      setError("封面不能超过 5MB");
      return;
    }
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      setError("封面必须是 PNG / JPG / WebP / GIF");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file, "covers");
      if (mode === "draft") {
        setDraft((d) => ({ ...d, coverFile: file, coverFileName: file.name, coverUrl: url }));
      } else {
        setEditDraft((d) => ({ ...d, coverFile: file, coverFileName: file.name, coverUrl: url }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd() {
    setError(null);
    if (!draft.name.trim()) {
      setError("专辑名必填");
      return;
    }
    try {
      await createAlbum({
        name: draft.name,
        description: draft.description,
        cover_url: draft.coverUrl,
      });
      setDraft({ name: "", description: "", coverFile: null, coverFileName: "", coverUrl: null });
      setAdding(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    }
  }

  function startEdit(a: Album) {
    setEditingId(a.id);
    setEditDraft({
      name: a.name,
      description: a.description,
      coverFile: null,
      coverFileName: "",
      coverUrl: a.cover_url,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    try {
      await updateAlbum(editingId, {
        name: editDraft.name.trim(),
        description: editDraft.description.trim(),
        cover_url: editDraft.coverUrl,
      });
      setEditingId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    }
  }

  async function handleDelete(a: Album) {
    if (!confirm(`确定删除「${a.name}」?该专辑内作品的 album_id 会被清空（作品不会删）`)) return;
    try {
      await deleteAlbum(a.id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">专辑管理</h1>
        <a
          href="/madmin"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
        >
          ← 上传节目
        </a>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-rose-300/70 hover:text-rose-200">
            <X className="h-3 w-3 inline" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-white/40">加载中…</p>
      ) : albums.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">还没有专辑</p>
      ) : (
        <div className="space-y-2">
          {albums.map((a) =>
            editingId === a.id ? (
              <EditForm
                key={a.id}
                draft={editDraft}
                setDraft={setEditDraft}
                uploading={uploading}
                onPick={(f) => pickCover(f, "edit")}
                onCancel={() => setEditingId(null)}
                onSave={saveEdit}
              />
            ) : (
              <div
                key={a.id}
                className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:bg-white/5"
              >
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white"
                  style={
                    a.cover_url
                      ? { backgroundImage: `url(${a.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  {!a.cover_url && <ImageIcon className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{a.name}</p>
                  <p className="truncate text-xs text-white/50">{a.description || "—"}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(a)}
                    className="rounded p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="rounded p-1.5 text-white/40 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {adding ? (
        <EditForm
          draft={draft}
          setDraft={setDraft}
          uploading={uploading}
          onPick={(f) => pickCover(f, "draft")}
          onCancel={() => {
            setAdding(false);
            setError(null);
          }}
          onSave={handleAdd}
          isNew
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/20 px-4 py-2 text-sm text-white/60 hover:border-violet-400 hover:text-violet-200"
        >
          <Plus className="h-3.5 w-3.5" /> 新建专辑
        </button>
      )}
    </div>
  );
}

function EditForm({
  draft,
  setDraft,
  uploading,
  onPick,
  onCancel,
  onSave,
  isNew,
}: {
  draft: { name: string; description: string; coverFile: File | null; coverFileName: string; coverUrl: string | null };
  setDraft: React.Dispatch<React.SetStateAction<typeof draft>>;
  uploading: boolean;
  onPick: (f: File) => void;
  onCancel: () => void;
  onSave: () => void;
  isNew?: boolean;
}) {
  return (
    <div className="rounded-lg border border-violet-500/30 bg-white/5 p-4">
      <div className="flex gap-4">
        <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-white/20 text-xs text-white/50 hover:border-violet-400">
          {draft.coverUrl ? (
            <div
              className="h-full w-full rounded-md"
              style={{ backgroundImage: `url(${draft.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
          ) : (
            <>
              <ImageIcon className="h-5 w-5" />
              <span className="mt-1">{uploading ? "上传中…" : "点选封面"}</span>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
          />
        </label>
        <div className="flex-1 space-y-2">
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="专辑名"
            className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="专辑介绍（选填）"
            rows={2}
            className="w-full resize-none rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-xs text-white/60 hover:text-white">
          取消
        </button>
        <button
          onClick={onSave}
          disabled={uploading}
          className="inline-flex items-center gap-1 rounded bg-violet-500 px-3 py-1.5 text-xs text-white hover:bg-violet-400 disabled:opacity-50"
        >
          <Check className="h-3 w-3" /> {isNew ? "创建" : "保存"}
        </button>
      </div>
    </div>
  );
}
