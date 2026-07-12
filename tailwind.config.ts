import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // 封面渐变：动态拼接的 class 字符串 JIT 扫不到，必须列出
    "from-violet-500 via-fuchsia-500 to-pink-500",
    "from-rose-500 via-orange-400 to-amber-500",
    "from-sky-500 via-blue-500 to-indigo-600",
    "from-emerald-500 via-teal-400 to-cyan-500",
    "from-orange-500 via-red-500 to-fuchsia-600",
    "from-cyan-500 via-sky-400 to-blue-500",
    "from-amber-500 via-orange-500 to-rose-500",
    "from-fuchsia-500 via-purple-500 to-indigo-600",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
