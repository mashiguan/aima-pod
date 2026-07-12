"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, HeartCrack, Star, Link2 } from "lucide-react";

export type ToastKind = "like" | "dislike" | "fav-on" | "fav-off" | "share";

export interface ToastItem {
  id: number;
  kind: ToastKind;
}

const META: Record<ToastKind, { text: string; icon: React.ReactNode; ring: string }> = {
  like:     { text: "已点赞",        icon: <CheckCircle2 className="h-4 w-4" />, ring: "ring-emerald-400/40" },
  dislike:  { text: "已点踩",        icon: <HeartCrack className="h-4 w-4" />,    ring: "ring-rose-400/40" },
  "fav-on": { text: "已加入收藏",   icon: <Star className="h-4 w-4 fill-amber-300 text-amber-300" />, ring: "ring-amber-400/40" },
  "fav-off":{ text: "已取消收藏",   icon: <Star className="h-4 w-4" />,           ring: "ring-white/15" },
  share:    { text: "链接已复制到剪贴板", icon: <Link2 className="h-4 w-4" />,     ring: "ring-violet-400/40" },
};

let nextId = 1;

export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = (kind: ToastKind) => {
    const id = nextId++;
    setItems((arr) => [...arr, { id, kind }]);
    setTimeout(() => {
      setItems((arr) => arr.filter((x) => x.id !== id));
    }, 1800);
  };

  const list = (
    <div className="pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 space-y-2">
      {items.map((it) => {
        const m = META[it.kind];
        return (
          <div
            key={it.id}
            className={`pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-sm text-white shadow-2xl ring-1 ring-inset backdrop-blur ${m.ring} animate-[toast-in_0.25s_ease-out]`}
            style={{
              animation: "toast-in 0.25s ease-out",
            }}
          >
            {m.icon}
            <span>{m.text}</span>
          </div>
        );
      })}
    </div>
  );

  return { push, list };
}
