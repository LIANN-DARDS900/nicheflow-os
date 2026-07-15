import { CheckCircle2, Clock3, Download, FileText, Globe2, Send, Webhook } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exportApprovedDocument } from "./actions";
import "./publishing.css";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };
type DocumentRow = { id: string; title: string; slug: string; seo_score: number; word_count: number; approved_at: string | null };
type JobRow = { id: string; status: string; created_at: string; payload: Record<string, unknown>; content_documents: { title: string } | { title: string }[] | null };

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function PublishingPage({ searchParams }: Props) {
  const params = await searchParams;
  const live = hasSupabaseEnv();
  let documents: DocumentRow[] = [];
  let jobs: JobRow[] = [];
  let dataError: string | null = null;

  if (live) {
    const supabase = await createSupabaseServerClient();
    const [documentResult, jobResult] = await Promise.all([
      supabase.from("content_documents").select("id,title,slug,seo_score,word_count,approved_at").in("status", ["approved", "scheduled", "published"]).order("approved_at", { ascending: false, nullsFirst: false }),
      supabase.from("publishing_jobs").select("id,status,created_at,payload,content_documents(title)").order("created_at", { ascending: false }).limit(20),
    ]);
    documents = (documentResult.data ?? []) as DocumentRow[];
    jobs = (jobResult.data ?? []) as JobRow[];
    dataError = documentResult.error?.message ?? jobResult.error?.message ?? null;
  } else {
    documents = [{ id: "demo", title: "A practical guide to data sovereignty for Moroccan infrastructure operators", slug: "data-sovereignty-morocco", seo_score: 94, word_count: 1920, approved_at: new Date().toISOString() }];
    jobs = [{ id: "demo-job", status: "published", created_at: new Date().toISOString(), payload: { format: "markdown" }, content_documents: { title: documents[0].title } }];
  }

  return (
    <main className="shell">
      <AppSidebar active="publishing" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">PUBLISHING CONTROL · {live ? "LIVE" : "DEMO"} DATA</p><h1>Publishing Center</h1><p className="muted">Release only approved content and preserve a complete job history.</p></div>
          <div className="publishingState"><CheckCircle2 size={18} /><span><strong>Export channel ready</strong><small>WordPress and webhooks remain disconnected.</small></span></div>
        </header>

        {(params.error || dataError) && <div className="errorNotice">{params.error ?? dataError}</div>}
        {params.message && <div className="successNotice">{params.message}</div>}

        <section className="destinationGrid">
          <article className="panel destinationCard ready"><Download size={21} /><div><strong>File exports</strong><span>Markdown and clean HTML</span></div><b>Ready</b></article>
          <article className="panel destinationCard"><Globe2 size={21} /><div><strong>WordPress</strong><span>REST API destination</span></div><b>Not connected</b></article>
          <article className="panel destinationCard"><Webhook size={21} /><div><strong>Webhook</strong><span>Custom CMS integration</span></div><b>Not connected</b></article>
        </section>

        <div className="publishingGrid">
          <section className="panel publishablePanel">
            <div className="panelHead"><div><p className="eyebrow">APPROVED CONTENT</p><h2>Ready to export</h2></div><Send size={18} /></div>
            {documents.length === 0 ? <div className="emptyState"><FileText size={24} /><strong>No approved content</strong><span>Approved documents will become available for publishing here.</span></div> : <div className="publishableList">{documents.map((document) => <article key={document.id}><div className="documentIcon"><FileText size={18} /></div><div><strong>{document.title}</strong><span>{document.word_count.toLocaleString()} words · SEO {document.seo_score}</span></div><form action={exportApprovedDocument}><input name="documentId" type="hidden" value={document.id} /><button className="secondary" name="format" value="markdown" disabled={!live}>Markdown</button><button className="primary" name="format" value="html" disabled={!live}>HTML</button></form></article>)}</div>}
          </section>

          <section className="panel jobPanel">
            <div className="panelHead"><div><p className="eyebrow">JOB HISTORY</p><h2>Recent publishing activity</h2></div><Clock3 size={18} /></div>
            {jobs.length === 0 ? <div className="miniEmpty">No publishing jobs yet.</div> : <div className="jobList">{jobs.map((job) => { const document = firstRelation(job.content_documents); return <article key={job.id}><span className={`jobStatus ${job.status}`}>{job.status}</span><div><strong>{document?.title ?? "Content export"}</strong><small>{String(job.payload.format ?? "export")} · {new Date(job.created_at).toLocaleString("en")}</small></div></article>; })}</div>}
          </section>
        </div>
      </section>
    </main>
  );
}
