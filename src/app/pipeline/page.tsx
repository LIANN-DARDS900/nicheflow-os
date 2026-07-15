import { CheckCircle2, Clock3, Database, FileCheck2, Globe2, Newspaper, Play, Radar, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import "./pipeline.css";

const engines = [
  { name: "Source ingestion", detail: "Fetch and normalize trusted feeds", status: "Ready", icon: Globe2 },
  { name: "Deduplication", detail: "Identify repeated URLs and overlapping signals", status: "Ready", icon: Database },
  { name: "Topic scoring", detail: "Evaluate relevance, freshness and authority", status: "Ready", icon: Radar },
  { name: "Brief generation", detail: "Create governed editorial structure", status: "Configured", icon: Newspaper },
  { name: "Draft generation", detail: "Generate content after human selection", status: "API pending", icon: Sparkles },
  { name: "Approval", detail: "Require editorial validation before publishing", status: "Ready", icon: FileCheck2 },
];

const recentRuns = [
  { id: "DEMO-004", started: "13:42", duration: "18s", items: 46, opportunities: 5, status: "Completed" },
  { id: "DEMO-003", started: "12:40", duration: "15s", items: 39, opportunities: 4, status: "Completed" },
  { id: "DEMO-002", started: "11:38", duration: "21s", items: 52, opportunities: 7, status: "Completed" },
];

export default function PipelinePage() {
  return (
    <main className="shell">
      <AppSidebar active="pipeline" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">ORCHESTRATION CONTROL</p><h1>Pipeline executions</h1><p className="muted">Inspect every engine, handoff and result in the content workflow.</p></div>
          <button className="primary"><Play size={16} />Run demo pipeline</button>
        </header>

        <section className="panel enginePanel">
          <div className="panelHead"><div><p className="eyebrow">ENGINE MAP</p><h2>Controlled orchestration path</h2></div><span className="modeChip">Demo mode</span></div>
          <div className="engineGrid">
            {engines.map(({ name, detail, status, icon: Icon }, index) => (
              <article className="engineCard" key={name}>
                <div className="engineTop"><span><Icon size={18} /></span><b>{String(index + 1).padStart(2, "0")}</b></div>
                <h3>{name}</h3><p>{detail}</p>
                <small className={status === "API pending" ? "pending" : "ready"}>{status}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel runsPanel">
          <div className="panelHead"><div><p className="eyebrow">EXECUTION HISTORY</p><h2>Recent runs</h2></div><button className="iconText"><Clock3 size={15} />Last 24 hours</button></div>
          <div className="runRows">
            {recentRuns.map((run) => (
              <article key={run.id}><span className="runId">{run.id}</span><span><small>Started</small><strong>{run.started}</strong></span><span><small>Duration</small><strong>{run.duration}</strong></span><span><small>Items</small><strong>{run.items}</strong></span><span><small>Opportunities</small><strong>{run.opportunities}</strong></span><span className="completed"><CheckCircle2 size={14} />{run.status}</span></article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
