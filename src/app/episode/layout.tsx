import { SiteShell } from "@/components/SiteShell";

export default function EpisodeLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
