/**
 * 浏览器端 Supabase 客户端
 * - 用 anon key（公开、安全）
 * - 互动数据用设备 ID（localStorage 生成的 UUID）
 * - 真实 key 在 .env.local（NEXT_PUBLIC_* 是公开前缀，可以放前端）
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // 不抛错，让 mock fallback 接管
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(url, anon);
}
