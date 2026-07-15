import Link from "next/link";
import { Bot, Globe2, LayoutDashboard, Newspaper, Radar, Settings2, Workflow } from "lucide-react";

const items = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/sources", label: "Sources", icon: Globe2 },
  { href: "/topics", label: "Topics", icon: Radar },
  { href: "/content", label: "Content", icon: Newspaper },
  { href: "/automations", label: "Automations", icon: Bot },
];

type AppSidebarProps = {
  active: "overview" | "pipeline" | "sources" | "topics" | "content" | "automations";
};

export function AppSidebar({ active }: AppSidebarProps) {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brandMark"><Workflow size={19} /></span>
        <span><strong>NicheFlow</strong><small>OS</small></span>
      </Link>
      <nav>
        {items.map(({ href, label, icon: Icon }) => (
          <Link className={active === label.toLowerCase() ? "active" : undefined} href={href} key={href}>
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
