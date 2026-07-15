import { Activity, ArrowUpRight, Bot, Database, FileCheck2, Globe2, LayoutDashboard, Newspaper, Radar, Search, Settings2, Sparkles, Workflow } from "lucide-react";

const pipeline = [
  ["Sources", "12 active", Globe2],
  ["Ingestion", "248 items", Database],
  ["Scoring", "87 qualified", Radar],
  ["Briefs", "19 ready", Newspaper],
  ["Drafts", "8 created", Sparkles],
  ["Approval", "3 pending", FileCheck2],
];

const topics = [
  ["Morocco expands national cloud and data-centre capacity", "Cloud infrastructure", "92"],
  ["5G deployment priorities for enterprises and public services", "Connectivity", "88"],
  ["New subsea cable routes strengthen Morocco’s digital position", "International networks", "85"],
  ["Data sovereignty and cybersecurity requirements for Moroccan operators", "Policy & security", "81"],
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark"><Workflow size={19}/></span><div><strong>NicheFlow</strong><small>OS</small></div></div>
        <nav>
          <a className="active"><LayoutDashboard size={18}/>Overview</a>
          <a><Workflow size={18}/>Pipeline</a>
          <a><Globe2 size={18}/>Sources</a>
          <a><Radar size={18}/>Topics</a>
          <a><Newspaper size={18}/>Content</a>
          <a><Bot size={18}/>Automations</a>
        </nav>
        <div className="sideBottom"><a><Settings2 size={18}/>Settings</a><div className="profile"><span>IN</span><div><strong>Ilyas Nazih</strong><small>Platform owner</small></div></div></div>
      </aside>

      <section className="workspace">
        <header><div><p className="eyebrow">DIGITAL INFRASTRUCTURE · MOROCCO</p><h1>Content operations overview</h1><p className="muted">Monitor trusted sources, content opportunities and production workflows.</p></div><div className="headerActions"><button className="iconButton"><Search size={18}/></button><button className="primary"><Sparkles size={17}/>New orchestration</button></div></header>

        <section className="metrics">
          <article><span>Sources monitored</span><strong>12</strong><small>+2 this month</small></article>
          <article><span>Items discovered</span><strong>248</strong><small>Last 7 days</small></article>
          <article><span>Qualified topics</span><strong>87</strong><small>35% acceptance</small></article>
          <article><span>Ready to publish</span><strong>5</strong><small>3 awaiting review</small></article>
        </section>

        <section className="panel orchestration">
          <div className="panelHead"><div><p className="eyebrow">LIVE SYSTEM</p><h2>Orchestration path</h2></div><button className="secondary">View executions <ArrowUpRight size={15}/></button></div>
          <div className="pipeline">{pipeline.map(([name, status, Icon], i) => <div className="node" key={name as string}><div className="nodeIcon"><Icon size={20}/></div><strong>{name as string}</strong><span>{status as string}</span>{i < pipeline.length - 1 && <i>→</i>}</div>)}</div>
          <div className="runStatus"><Activity size={16}/><span>Latest run completed successfully</span><small>2 minutes ago · 34 items processed · 6 opportunities created</small></div>
        </section>

        <div className="contentGrid">
          <section className="panel topics"><div className="panelHead"><div><p className="eyebrow">OPPORTUNITIES</p><h2>High-potential topics</h2></div><button className="linkButton">View all</button></div>
            <div className="topicList">{topics.map(([title, pillar, score]) => <article key={title}><div className="score">{score}</div><div><strong>{title}</strong><span>{pillar}</span></div><ArrowUpRight size={17}/></article>)}</div>
          </section>
          <aside className="panel health"><p className="eyebrow">SYSTEM HEALTH</p><h2>All engines operational</h2><div className="healthRing"><strong>98%</strong><span>Success rate</span></div><ul><li><span>Source ingestion</span><b>Healthy</b></li><li><span>Topic intelligence</span><b>Healthy</b></li><li><span>Content engine</span><b>Ready</b></li><li><span>Publishing</span><em>Not connected</em></li></ul></aside>
        </div>
      </section>
    </main>
  );
}
