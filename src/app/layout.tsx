import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "爱玛播 · 随心说",
  description: "小马歌 · 声音与故事 —— 故事、访谈、随笔、经典。品一杯茶，听一朵花。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} antialiased min-h-screen bg-slate-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
