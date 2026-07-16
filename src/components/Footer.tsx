export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-white/40">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-3">
        <span>© {new Date().getFullYear()} 爱玛播 · 用声音记录时代</span>
      </div>
    </footer>
  );
}
