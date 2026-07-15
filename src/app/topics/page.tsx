import { ArrowUpRight, CheckCircle2, Filter, Radar, Search, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { promoteTopicToBrief } from "@/app/content/actions";
import { listWorkspaceTopics } from "@/lib/data/workspace";
import { scoreWorkspaceItems } from "./actions";

const stageLabel = {
  discovered: "Discovered",
  qualified: "Qualified",
  "brief-ready": "Brief ready",
  rejected: "Rejected",
};

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function TopicsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { records: topics, mode, error: dataError } = await listWorkspaceTopics();
  const qualified = topics.filter((topic) => topic.stage === "qualified" || topic.stage === "brief-ready").length;
  const averageScore = topics.length ? Math.round(topics.reduce((total, topic) => total + topic.score, 0) / topics.length) : 0;
  const acceptance = topics.length ? Math.round((qualified / topics.length) * 100) : 0;
  const briefsReady = topics.filter((topic) => topic.stage === "brief-ready").length;
  const live = mode === "live";

  return (
    <main className="shell">
      <AppSidebar active="topics" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">TOPIC INTELLIGENCE · {mode.toUpperCase()} DATA</p><h1>Opportunity pipeline</h1><p className="muted">Review explainable relevance scores before content production begins.</p></div>
          <div className="headerActions"><button className="secondary"><Filter size={16} />Filter</button><form action={scoreWorkspaceItems}><button className="primary" disabled={!live}><Sparkles size={17} />Score new items</button></form></div>
        </header>

        {(params.error || dataError) && <div className="errorNotice">{params.error ?? `Topic data could not be loaded: ${dataError}`}</div>}
        {params.message && <div className="successNotice">{params.message}</div>}

        <section className="metrics compactMetrics">
          <article><span>Topics evaluated</span><strong>{topics.length}</strong><small>{mode === "demo" ? "Current demo run" : "Persisted workspace topics"}</small></article>
          <article><span>Qualified</span><strong>{qualified}</strong><small>{acceptance}% acceptance</small></article>
          <article><span>Average score</span><strong>{averageScore}</strong><small>Across relevance signals</small></article>
          <article><span>Briefs ready</span><strong>{briefsReady}</strong><small>Ready for editorial planning</small></article>
        </section>

        <section className="panel topicPipelinePanel">
          <div className="panelHead tableToolbar">
            <div><p className="eyebrow">RANKED OPPORTUNITIES</p><h2>Digital infrastructure topics</h2></div>
            <button className="iconText"><Search size={15} />Search topics</button>
          </div>
          {topics.length === 0 ? (
            <div className="emptyState"><Radar size={24} /><strong>No topics evaluated</strong><span>Run ingestion and scoring to populate the opportunity pipeline.</span></div>
          ) : (
            <div className="topicCards">
              {topics.map((topic) => {
                const promotable = live && (topic.stage === "qualified" || topic.stage === "brief-ready");
                return (
                  <article className="topicCard" key={topic.id}>
                    <div className="topicScore"><strong>{topic.score}</strong><small>score</small></div>
                    <div className="topicMain">
                      <div className="topicMeta"><span>{topic.pillar}</span><span>•</span><span>{topic.source}</span></div>
                      <h3>{topic.title}</h3>
                      <div className="signalBars">
                        <label><span>Freshness</span><b><i style={{ width: `${topic.freshness}%` }} /></b><em>{topic.freshness}</em></label>
                        <label><span>Authority</span><b><i style={{ width: `${topic.authority}%` }} /></b><em>{topic.authority}</em></label>
                      </div>
                    </div>
                    <div className="topicDecision">
                      <span className={`stageChip ${topic.stage}`}><CheckCircle2 size={13} />{stageLabel[topic.stage]}</span>
                      <form action={promoteTopicToBrief}><input name="topicId" type="hidden" value={topic.id} /><button className="rowMenu" disabled={!promotable} aria-label={`Create brief from ${topic.title}`}><ArrowUpRight size={18} /></button></form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
