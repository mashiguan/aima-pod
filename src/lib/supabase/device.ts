"use client";

/**
 * 设备 ID：浏览器内 UUID，存 localStorage
 * - 第一次访问生成，永不过期
 * - 用户清缓存会重置（可接受，跟"匿名浏览器身份"语义一致）
 */

const KEY = "aima_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
