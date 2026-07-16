"use client";

import { useEffect, useState } from "react";
import { listTags, createTag, updateTag, deleteTag, TAG_COLOR_PRESETS } from "@/lib/api";
import type { Tag } from "@/lib/types";
import { Plus, Trash2, X, Check, Edit2 } from "lucide-react";

type Kind = "genre" | "topic";

export default function AdminTagsPage() {
  const [kind, setKind] = useState<Kind>("genre");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 新建表单
  const [draft, setDraft] = useState<{ value: string; label: string; color: string }>({
    value: "",
    label: "",
    color: TAG_COLOR_PRESETS[0].value,
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑表单
  const [editDraft, setEditDraft] = useState<{ value: string; label: string; color: string }>({
    value: "",
    label: "",
    color: TAG_COLOR_PRESETS[0].value,
  });

  async function refresh() {
    setLoading(true);
    const list = await listTags(kind);
    setTags(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [kind]);

  async function handleAdd() {
    setError(null);
    if (!draft.value.trim() || !draft.label.trim()) {
      setError("value 和 label 都要填");
      return;
    }
    try {
      await createTag({ kind, value: draft.value.trim(), label: draft.label.trim(), color: draft.color });
      setDraft({ value: "", label: "", color: TAG_COLOR_PRESETS[0].value });
      setAdding(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    }
  }

  function startEdit(t: Tag) {
    setEditingId(t.id);
    setEditDraft({ value: t.value, label: t.label, color: t.color });
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    try {
      await updateTag(editingId, {
        value: editDraft.value.trim(),
        label: editDraft.label.trim(),
        color: editDraft.color,
      });
      setEditingId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    }
  }

  async function handleDelete(t: Tag) {
    if (!confirm(`确定删除「${t.label}」?`)) return;
    try {
      await deleteTag(t.id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">标签管理</h1>
        <a
          href="/madmin"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
        >
          ← 上传节目
        </a>
      </div>

      {/* 顶部错误条 */}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-rose-300/70 hover:text-rose-200">
            <X className="h-3 w-3 inline" />
          </button>
        </div>
      )}

      {/* 切换 体裁/主题 */}
      <div className="mb-6 flex gap-1 border-b border-white/10">
        <button
          onClick={() => setKind("genre")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${
            kind === "genre" ? "border-violet-400 text-white" : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          体裁
        </button>
        <button
          onClick={() => setKind("topic")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${
            kind === "topic" ? "border-violet-400 text-white" : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          主题
        </button>
      </div>

      {/* 列表 */}
      <div className="space-y-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-white/40">加载中…</p>
        ) : tags.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">还没有{kind === "genre" ? "体裁" : "主题"}</p>
        ) : (
          tags.map((t) =>
            editingId === t.id ? (
              <div key={t.id} className="rounded-lg border border-violet-500/30 bg-white/5 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={editDraft.value}
                    onChange={(e) => setEditDraft((d) => ({ ...d, value: e.target.value }))}
                    placeholder="value (英文/数字, 唯一)"
                    className="rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={editDraft.label}
                    onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))}
                    placeholder="label (显示名)"
                    className="rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TAG_COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setEditDraft((d) => ({ ...d, color: p.value }))}
                      className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                        p.value
                      } ${editDraft.color === p.value ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded px-3 py-1.5 text-xs text-white/60 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveEdit}
                    className="inline-flex items-center gap-1 rounded bg-violet-500 px-3 py-1.5 text-xs text-white hover:bg-violet-400"
                  >
                    <Check className="h-3 w-3" /> 保存
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs ring-1 ${t.color}`}>{t.label}</span>
                  <span className="text-xs text-white/40">value: {t.value}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(t)}
                    className="rounded p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
                    title="编辑"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="rounded p-1.5 text-white/40 hover:bg-rose-500/10 hover:text-rose-300"
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>

      {/* 新建 */}
      {adding ? (
        <div className="mt-4 rounded-lg border border-violet-500/30 bg-white/5 p-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={draft.value}
              onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
              placeholder="value (如:心理学)"
              className="rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            <input
              value={draft.label}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              placeholder="label (显示名)"
              className="rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAG_COLOR_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDraft((d) => ({ ...d, color: p.value }))}
                className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                  p.value
                } ${draft.color === p.value ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="rounded px-3 py-1.5 text-xs text-white/60 hover:text-white"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="rounded bg-violet-500 px-3 py-1.5 text-xs text-white hover:bg-violet-400"
            >
              添加
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/20 px-4 py-2 text-sm text-white/60 hover:border-violet-400 hover:text-violet-200"
        >
          <Plus className="h-3.5 w-3.5" /> 新增{kind === "genre" ? "体裁" : "主题"}
        </button>
      )}
    </div>
  );
}
