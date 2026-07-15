import { Bell, Clock3, FileCheck2, Pause, Play, Plus, Radar, Rss, ShieldCheck, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import "./automations.css";

const automations = [
  { name: "Source ingestion", description: "Fetch enabled RSS and institutional sources on schedule.", schedule: "Every 6 hours", status: "Enabled", icon: Rss },
  { name: "Topic scoring", description: "Score normalized items against the Morocco digital-infrastructure niche.", schedule: "After ingestion", status: "Enabled", icon: Radar },
  { name: "Brief preparation", description: "Prepare a structured brief only for topics scoring 85 or higher.", schedule: "On qualification", status: "Enabled", icon: Sparkles },
  { name: "Editorial approval", description: "Block publishing until a human reviewer explicitly approves content.", schedule: "Before publish", status: "Protected", icon: FileCheck2 },
  { name: "Failure notification", description: "Surface ingestion and publishing failures inside the dashboard.", schedule: "On failure", status: "Enabled", icon: Bell },
];

export default function AutomationsPage() {
  return (
    <main className="shell">
      <AppSidebar active="automations" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">WORKFLOW AUTOMATION</p><h1>Automations</h1><p className="muted">Define deterministic triggers and human approval gates without uncontrolled autonomous behavior.</p></div>
          <button className="primary"><Plus size={17} />New automation</button>
        </header>

        <section className="automationSummary">
          <article><ShieldCheck size={20} /><div><strong>Free-tier guard active</strong><span>No paid API or infrastructure action can start automatically.</span></div></article>
          <article><Clock3 size={20} /><div><strong>5 workflow rules</strong><span>Four automated steps and one mandatory human gate.</span></div></article>
        </section>

        <section className="panel automationPanel">
          <div className="panelHead"><div><p className="eyebrow">ACTIVE RULES</p><h2>Workspace automation map</h2></div><span className="automationMode"><Play size={12} />Demo enabled</span></div>
          <div className="automationList">
            {automations.map(({ name, description, schedule, status, icon: Icon }) => (
              <article key={name}>
                <div className="automationIcon"><Icon size={18} /></div>
                <div><h3>{name}</h3><p>{description}</p></div>
                <span className="automationSchedule"><Clock3 size={13} />{schedule}</span>
                <span className={`automationStatus ${status.toLowerCase()}`}>{status}</span>
                <button className="rowMenu" aria-label={`Pause ${name}`}><Pause size={16} /></button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
