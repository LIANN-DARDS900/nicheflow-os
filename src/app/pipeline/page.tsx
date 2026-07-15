import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Database, FileCheck2, Globe2, Newspaper, Play, Radar, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { listWorkflowRuns } from "@/lib/data/workspace";
import "./pipeline.css";

const engines = [
  { name: "Source ingestion", detail: "Fetch and normalize trusted feeds", status: "Ready", icon: Globe2 },
  { name: "Deduplication", detail: "Identify repeated URLs and overlapping signals", status: "Ready", icon: Database },
  { name: "Topic scoring", detail: "Evaluate relevance, freshness and authority", status: "Ready", icon: Radar },
  { name: "Brief generation", detail: "Create governed editorial structure", status: "Configured", icon: Newspaper },
  { name: "Draft generation", detail: "Generate content after human selection", status: "API pending", icon: Sparkles },
  { name: "Approval", detail: "Require editorial validation before publishing", status: "Ready", icon: FileCheck2 },
];

export default async function PipelinePage() {
  const { records: recentRuns, mode, error } = await listWorkflowRuns();

  return (
    <main className="shell">
      <AppSidebar active="pipeline" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">ORCHESTRATION CONTROL · {mode.toUpperCase()} DATA</p><h1>Pipeline executions</h1><p className="muted">Inspect every engine, handoff and result in the content workflow.</p></div>
          <Link className="primary" href="/sources"><Play size={16} />Run ingestion</Link>
        </header>

        {error && <div className="errorNotice">Workflow history could not be loaded: {error}</div>}

        <section className="panel enginePanel">
          <div className="panelHead"><div><p className="eyebrow">ENGINE MAP</p><h2>Controlled orchestration path</h2></div><span className="modeChip">{mode === "demo" ? "Demo mode" : "Live workspace"}</span></div>
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
          <div className="panelHead"><div><p className="eyebrow">EXECUTION HISTORY</p><h2>Recent runs</h2></div><button className="iconText"><Clock3 size={15} />Latest 20</button></div>
          {recentRuns.length === 0 ? (
            <div className="emptyState"><Clock3 size={24} /><strong>No workflow runs</strong><span>Run source ingestion to create the first auditable execution.</span></div>
          ) : (
            <div className="runRows">
              {recentRuns.map((run) => {
                const failed = run.status === "Failed" || run.status === "Cancelled";
                return (
                  <article key={run.id}><span className="runId">{run.id}</span><span><small>Started</small><strong>{run.started}</strong></span><span><small>Duration</small><strong>{run.duration}</strong></span><span><small>Inputs</small><strong>{run.items}</strong></span><span><small>Opportunities</small><strong>{run.opportunities}</strong></span><span className={failed ? "failed" : "completed"}>{failed ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}{run.status}</span></article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
