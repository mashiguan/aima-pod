import { SiteShell } from "@/components/SiteShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
