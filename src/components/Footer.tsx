"use client";

import Link from "next/link";
import { useState } from "react";

export function Footer() {
  const [hover, setHover] = useState(false);
  return (
    <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-white/40">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-3">
        <span>© {new Date().getFullYear()} 爱玛播 · 用声音记录时代</span>
        <Link
          href="/admin"
          aria-label="管理"
          title="管理"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`group inline-flex h-5 w-5 items-center justify-center rounded-full transition ${
            hover ? "bg-white/10 text-white/70" : "text-white/15 hover:text-white/40"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <path d="M3 14h3v6H3zM18 14h3v6h-3z" />
            <path d="M4.5 14a7.5 7.5 0 0 1 15 0" />
            <path d="M12 4v3" />
          </svg>
        </Link>
      </div>
    </footer>
  );
}
