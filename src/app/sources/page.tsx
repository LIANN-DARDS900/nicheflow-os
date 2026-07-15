import { AlertTriangle, CheckCircle2, Filter, Globe2, MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { demoSources } from "@/data/demo";

export default function SourcesPage() {
  const healthy = demoSources.filter((source) => source.status === "healthy").length;
  const discovered = demoSources.reduce((total, source) => total + source.items, 0);

  return (
    <main className="shell">
      <AppSidebar active="sources" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">SOURCE INTELLIGENCE</p><h1>Sources Manager</h1><p className="muted">Control where NicheFlow discovers trusted digital-infrastructure signals.</p></div>
          <div className="headerActions"><button className="secondary"><RefreshCw size={16} />Run ingestion</button><button className="primary"><Plus size={17} />Add source</button></div>
        </header>

        <section className="metrics compactMetrics">
          <article><span>Configured sources</span><strong>{demoSources.length}</strong><small>Digital infrastructure workspace</small></article>
          <article><span>Healthy sources</span><strong>{healthy}</strong><small>{Math.round((healthy / demoSources.length) * 100)}% operational</small></article>
          <article><span>Items collected</span><strong>{discovered}</strong><small>Current demo dataset</small></article>
          <article><span>Coverage pillars</span><strong>6</strong><small>Policy, cloud, telecom and more</small></article>
        </section>

        <section className="panel tablePanel">
          <div className="panelHead tableToolbar">
            <div><p className="eyebrow">MONITORED NETWORK</p><h2>Active sources</h2></div>
            <div className="tableActions"><button className="iconText"><Search size={15} />Search</button><button className="iconText"><Filter size={15} />Filter</button></div>
          </div>
          <div className="dataTable sourceTable">
            <div className="tableRow tableHeader"><span>Source</span><span>Type</span><span>Coverage</span><span>Cadence</span><span>Last run</span><span>Items</span><span>Status</span><span /></div>
            {demoSources.map((source) => (
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
        </section>
      </section>
    </main>
  );
}
