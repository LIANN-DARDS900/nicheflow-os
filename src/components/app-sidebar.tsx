import Link from "next/link";
import { Bot, FileCheck2, Globe2, LayoutDashboard, Newspaper, Radar, Send, Settings2, Workflow } from "lucide-react";

const items = [
  { href: "/", label: "Overview", key: "overview", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", key: "pipeline", icon: Workflow },
  { href: "/sources", label: "Sources", key: "sources", icon: Globe2 },
  { href: "/topics", label: "Topics", key: "topics", icon: Radar },
  { href: "/content", label: "Content", key: "content", icon: Newspaper },
  { href: "/approvals", label: "Approvals", key: "approvals", icon: FileCheck2 },
  { href: "/publishing", label: "Publishing", key: "publishing", icon: Send },
  { href: "/automations", label: "Automations", key: "automations", icon: Bot },
] as const;

type AppSidebarProps = {
  active: typeof items[number]["key"];
};

export function AppSidebar({ active }: AppSidebarProps) {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brandMark"><Workflow size={19} /></span>
        <span><strong>NicheFlow</strong><small>OS</small></span>
      </Link>
      <nav>
        {items.map(({ href, label, key, icon: Icon }) => (
          <Link className={active === key ? "active" : undefined} href={href} key={href}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
      <div className="sideBottom">
        <Link href="/settings"><Settings2 size={18} />Settings</Link>
        <div className="profile"><span>IN</span><div><strong>Ilyas Nazih</strong><small>Platform owner</small></div></div>
      </div>
    </aside>
  );
}
