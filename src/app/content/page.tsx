import Link from "next/link";
import { ArrowUpRight, FileText, Filter, Plus, Search, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { listWorkspaceContent } from "@/lib/data/workspace";
import "./content.css";

const stageLabels = { brief: "Brief", draft: "Draft", review: "In review", approved: "Approved" };
type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function ContentPage({ searchParams }: Props) {
  const params = await searchParams;
  const { records: content, mode, error } = await listWorkspaceContent();
  const averageSeo = content.length ? Math.round(content.reduce((total, item) => total + item.seoScore, 0) / content.length) : 0;
  const awaitingReview = content.filter((item) => item.stage === "review").length;
  const approved = content.filter((item) => item.stage === "approved").length;
  const live = mode === "live";

  return (
    <main className="shell">
      <AppSidebar active="content" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">CONTENT PRODUCTION · {mode.toUpperCase()} DATA</p><h1>Content Studio</h1><p className="muted">Move qualified opportunities through briefs, drafts, review and approval.</p></div>
          <div className="headerActions"><Link className="secondary" href="/topics"><Sparkles size={16} />Generate brief</Link><Link className={`primary${live ? "" : " disabledAction"}`} href={live ? "/topics" : "/login"}><Plus size={17} />New document</Link></div>
        </header>

        {(params.error || error) && <div className="errorNotice">{params.error ?? `Content data could not be loaded: ${error}`}</div>}
        {params.message && <div className="successNotice">{params.message}</div>}

        <section className="metrics compactMetrics">
          <article><span>Active documents</span><strong>{content.length}</strong><small>Across the editorial workflow</small></article>
          <article><span>Awaiting review</span><strong>{awaitingReview}</strong><small>Human approval required</small></article>
          <article><span>Average SEO score</span><strong>{averageSeo}</strong><small>Metadata and structure checks</small></article>
          <article><span>Approved</span><strong>{approved}</strong><small>Ready for publishing connection</small></article>
        </section>

        <section className="panel contentBoard">
          <div className="panelHead tableToolbar">
            <div><p className="eyebrow">EDITORIAL QUEUE</p><h2>Workspace documents</h2></div>
            <div className="tableActions"><button className="iconText"><Search size={15} />Search</button><button className="iconText"><Filter size={15} />Filter</button></div>
          </div>
          {content.length === 0 ? (
            <div className="emptyState"><FileText size={24} /><strong>No content documents</strong><span>Promote a qualified topic into a brief to begin the editorial workflow.</span></div>
          ) : (
            <div className="contentCards">
              {content.map((item) => (
                <article className="contentCard" key={item.id}>
                  <div className="documentIcon"><FileText size={19} /></div>
                  <div className="documentMain">
                    <div className="topicMeta"><span>{item.keyword}</span><span>•</span><span>{item.intent}</span></div>
                    <h3>{item.title}</h3>
                    <div className="documentDetails"><span>{item.words ? `${item.words.toLocaleString()} words` : "Outline not generated"}</span><span>Updated {item.updated}</span><span>{item.owner}</span></div>
                  </div>
                  <div className="seoBadge"><strong>{item.seoScore}</strong><small>SEO</small></div>
                  <span className={`stageChip ${item.stage}`}>{stageLabels[item.stage]}</span>
                  <Link className="rowMenu" href={live ? `/content/${item.id}` : "/login"} aria-label={`Open ${item.title}`}><ArrowUpRight size={18} /></Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
