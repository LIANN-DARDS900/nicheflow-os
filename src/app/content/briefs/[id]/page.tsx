import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ExternalLink, FilePlus2, Target, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDocumentFromBrief } from "../../actions";
import "./brief.css";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
type OutlineItem = { heading?: string; guidance?: string };
type SourceReference = { title?: string; url?: string; source?: string };

export default async function BriefPage({ params, searchParams }: Props) {
  if (!hasSupabaseEnv()) redirect("/content");
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: brief } = await supabase
    .from("content_briefs")
    .select("id,title,objective,audience,primary_keyword,secondary_keywords,search_intent,outline,source_references,status,updated_at")
    .eq("id", id)
    .single();
  if (!brief) notFound();

  const { data: document } = await supabase.from("content_documents").select("id").eq("brief_id", brief.id).maybeSingle();
  const outline = (Array.isArray(brief.outline) ? brief.outline : []) as OutlineItem[];
  const references = (Array.isArray(brief.source_references) ? brief.source_references : []) as SourceReference[];

  return (
    <main className="shell">
      <AppSidebar active="content" />
      <section className="workspace briefWorkspace">
        <header>
          <div><Link className="backLink" href="/content"><ArrowLeft size={15} />Content Studio</Link><p className="eyebrow">EDITORIAL BRIEF · {String(brief.status).toUpperCase()}</p><h1>{brief.title}</h1><p className="muted">Review the governed structure before opening the writing document.</p></div>
          {document ? <Link className="primary" href={`/content/${document.id}`}><BookOpen size={16} />Open document</Link> : <form action={createDocumentFromBrief}><input name="briefId" type="hidden" value={brief.id} /><button className="primary"><FilePlus2 size={16} />Create document</button></form>}
        </header>

        {query.error && <div className="errorNotice">{query.error}</div>}

        <div className="briefGrid">
          <section className="panel briefMain">
            <div className="briefFact"><Target size={18} /><div><span>Objective</span><p>{brief.objective}</p></div></div>
            <div className="briefFact"><Users size={18} /><div><span>Audience</span><p>{brief.audience}</p></div></div>
            <div className="briefSection"><p className="eyebrow">ARTICLE STRUCTURE</p><h2>Governed outline</h2><div className="outlineList">{outline.map((item, index) => <article key={`${item.heading}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{item.heading ?? "Section"}</strong><p>{item.guidance ?? ""}</p></div></article>)}</div></div>
          </section>

          <aside className="panel briefSide">
            <p className="eyebrow">SEO DIRECTION</p><h2>Search framing</h2>
            <dl><div><dt>Primary keyword</dt><dd>{brief.primary_keyword}</dd></div><div><dt>Search intent</dt><dd>{brief.search_intent}</dd></div><div><dt>Secondary keywords</dt><dd>{(brief.secondary_keywords ?? []).join(", ") || "None"}</dd></div></dl>
            <div className="briefReferences"><p className="eyebrow">SOURCE TRACEABILITY</p>{references.map((reference, index) => <a href={reference.url || "#"} target="_blank" rel="noreferrer" key={`${reference.url}-${index}`}><span><strong>{reference.source ?? "Source"}</strong><small>{reference.title ?? brief.title}</small></span><ExternalLink size={14} /></a>)}</div>
            <div className="briefReady"><CheckCircle2 size={17} /><span><strong>Human-controlled workflow</strong><small>No content is published from this brief automatically.</small></span></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
