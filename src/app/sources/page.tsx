import { AlertTriangle, CheckCircle2, Filter, Globe2, MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { listWorkspaceSources } from "@/lib/data/workspace";

export default async function SourcesPage() {
  const { records: sources, mode, error } = await listWorkspaceSources();
  const healthy = sources.filter((source) => source.status === "healthy").length;
  const discovered = sources.reduce((total, source) => total + source.items, 0);
  const coverage = new Set(sources.map((source) => source.pillar)).size;
  const healthRate = sources.length ? Math.round((healthy / sources.length) * 100) : 0;

  return (
    <main className="shell">
      <AppSidebar active="sources" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">SOURCE INTELLIGENCE · {mode.toUpperCase()} DATA</p><h1>Sources Manager</h1><p className="muted">Control where NicheFlow discovers trusted digital-infrastructure signals.</p></div>
          <div className="headerActions"><button className="secondary"><RefreshCw size={16} />Run ingestion</button><button className="primary"><Plus size={17} />Add source</button></div>
        </header>

        {error && <div className="errorNotice">Source data could not be loaded: {error}</div>}

        <section className="metrics compactMetrics">
          <article><span>Configured sources</span><strong>{sources.length}</strong><small>Digital infrastructure workspace</small></article>
          <article><span>Healthy sources</span><strong>{healthy}</strong><small>{healthRate}% operational</small></article>
          <article><span>Items collected</span><strong>{discovered}</strong><small>{mode === "demo" ? "Current demo dataset" : "Persisted source records"}</small></article>
          <article><span>Coverage pillars</span><strong>{coverage}</strong><small>Policy, cloud, telecom and more</small></article>
        </section>

        <section className="panel tablePanel">
          <div className="panelHead tableToolbar">
            <div><p className="eyebrow">MONITORED NETWORK</p><h2>Active sources</h2></div>
            <div className="tableActions"><button className="iconText"><Search size={15} />Search</button><button className="iconText"><Filter size={15} />Filter</button></div>
          </div>
          {sources.length === 0 ? (
            <div className="emptyState"><Globe2 size={24} /><strong>No sources configured</strong><span>Add the first RSS, Atom or institutional source to begin ingestion.</span></div>
          ) : (
            <div className="dataTable sourceTable">
              <div className="tableRow tableHeader"><span>Source</span><span>Type</span><span>Coverage</span><span>Cadence</span><span>Last run</span><span>Items</span><span>Status</span><span /></div>
              {sources.map((source) => (
                <div className="tableRow" key={source.id}>
                  <span className="sourceIdentity"><i><Globe2 size={17} /></i><span><strong>{source.name}</strong><small>{source.domain}</small></span></span>
                  <span><b className="neutralChip">{source.type}</b></span>
                  <span>{source.pillar}</span>
                  <span>{source.cadence}</span>
                  <span>{source.lastRun}</span>
                  <span>{source.items}</span>
                  <span className={`statusLabel ${source.status}`}>{source.status === "healthy" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{source.status}</span>
                  <span><button className="rowMenu" aria-label={`Actions for ${source.name}`}><MoreHorizontal size={17} /></button></span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
