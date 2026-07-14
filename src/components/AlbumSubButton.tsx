"use client";

import { useEffect, useState } from "react";
import { isSubscribed, subscribeAlbum } from "@/lib/api";
import { Check, Plus, Loader2 } from "lucide-react";

export function AlbumSubButton({ albumId }: { albumId: string }) {
  const [subbed, setSubbed] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    isSubscribed(albumId).then(setSubbed);
  }, [albumId]);

  async function toggle() {
    if (subbed === null) return;
    setPending(true);
    try {
      const { subscribed } = await subscribeAlbum(albumId);
      setSubbed(subscribed);
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  }

  if (subbed === null) {
    return (
      <button
        disabled
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/50"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={
        subbed
          ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/15 px-4 text-xs text-violet-200 hover:bg-violet-500/25"
          : "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/70 hover:border-violet-400 hover:bg-violet-500 hover:text-white"
      }
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : subbed ? (
        <>
          <Check className="h-3 w-3" /> 已订阅
        </>
      ) : (
        <>
          <Plus className="h-3 w-3" /> 订阅
        </>
      )}
    </button>
  );
}
