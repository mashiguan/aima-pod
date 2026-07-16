"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, User, Headphones, Disc3 } from "lucide-react";
import { MineDrawer } from "./MineDrawer";

export function Header() {
  const [mineOpen, setMineOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Headphones className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">爱玛播</p>
              <p className="text-[10px] text-white/50">小马歌 · 声音与故事</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <Compass className="h-3.5 w-3.5" /> 发现
            </Link>
            <Link
              href="/albums"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <Disc3 className="h-3.5 w-3.5" /> 专辑
            </Link>
            <button
              onClick={() => setMineOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <User className="h-3.5 w-3.5" /> 我的
            </button>
          </nav>
        </div>
      </header>
      <MineDrawer open={mineOpen} onClose={() => setMineOpen(false)} />
    </>
  );
}
