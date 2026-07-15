import Link from "next/link";
import { Activity, ArrowUpRight, Database, FileCheck2, Globe2, Newspaper, Radar, Search, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { demoSources, demoTopics } from "@/data/demo";

const pipeline = [
  ["Sources", `${demoSources.length} active`, Globe2],
  ["Ingestion", `${demoSources.reduce((sum, source) => sum + source.items, 0)} items`, Database],
  ["Scoring", `${demoTopics.length} evaluated`, Radar],
  ["Briefs", "1 ready", Newspaper],
  ["Drafts", "0 created", Sparkles],
  ["Approval", "0 pending", FileCheck2],
] as const;

export default function Home() {
  const qualified = demoTopics.filter((topic) => topic.stage === "qualified" || topic.stage === "brief-ready");

  return (
    <main className="shell">
      <AppSidebar active="overview" />
      <section className="workspace">
        <header><div><p className="eyebrow">DIGITAL INFRASTRUCTURE · MOROCCO</p><h1>Content operations overview</h1><p className="muted">Monitor trusted sources, content opportunities and production workflows.</p></div><div className="headerActions"><button className="iconButton" aria-label="Search"><Search size={18}/></button><button className="primary"><Sparkles size={17}/>New orchestration</button></div></header>

        <section className="metrics">
          <article><span>Sources monitored</span><strong>{demoSources.length}</strong><small>Institutional and industry sources</small></article>
          <article><span>Items discovered</span><strong>{demoSources.reduce((sum, source) => sum + source.items, 0)}</strong><small>Current demo dataset</small></article>
          <article><span>Qualified topics</span><strong>{qualified.length}</strong><small>{Math.round((qualified.length / demoTopics.length) * 100)}% acceptance</small></article>
          <article><span>Ready for brief</span><strong>1</strong><small>Human review enabled</small></article>
        </section>

        <section className="panel orchestration">
          <div className="panelHead"><div><p className="eyebrow">LIVE SYSTEM</p><h2>Orchestration path</h2></div><Link className="secondary" href="/topics">View pipeline <ArrowUpRight size={15}/></Link></div>
          <div className="pipeline">{pipeline.map(([name, status, Icon], i) => <div className="node" key={name}><div className="nodeIcon"><Icon size={20}/></div><strong>{name}</strong><span>{status}</span>{i < pipeline.length - 1 && <i>→</i>}</div>)}</div>
          <div className="runStatus"><Activity size={16}/><span>Demo orchestration dataset loaded</span><small>Supabase connection pending · free-tier mode</small></div>
        </section>

        <div className="contentGrid">
          <section className="panel topics"><div className="panelHead"><div><p className="eyebrow">OPPORTUNITIES</p><h2>High-potential topics</h2></div><Link className="linkButton" href="/topics">View all</Link></div>
            <div className="topicList">{demoTopics.slice(0, 4).map((topic) => <article key={topic.id}><div className="score">{topic.score}</div><div><strong>{topic.title}</strong><span>{topic.pillar}</span></div><ArrowUpRight size={17}/></article>)}</div>
          </section>
          <aside className="panel health"><p className="eyebrow">SYSTEM HEALTH</p><h2>Foundation operational</h2><div className="healthRing"><strong>96%</strong><span>Readiness</span></div><ul><li><span>Source catalogue</span><b>Ready</b></li><li><span>Topic intelligence</span><b>Ready</b></li><li><span>Supabase database</span><em>Not connected</em></li><li><span>Publishing</span><em>Not connected</em></li></ul></aside>
        </div>
      </section>
    </main>
  );
}
