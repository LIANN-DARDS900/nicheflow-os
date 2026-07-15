import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2, History, Save, SearchCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestDocumentApproval, saveDocument } from "../actions";
import "./editor.css";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> };

type VersionRow = { id: string; version_number: number; change_summary: string; created_at: string };
type ApprovalRow = { id: string; status: string; note: string; decision_note: string; requested_at: string };

export default async function DocumentEditorPage({ params, searchParams }: Props) {
  if (!hasSupabaseEnv()) redirect("/content");
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: document } = await supabase
    .from("content_documents")
    .select("id,title,slug,excerpt,body_markdown,meta_title,meta_description,primary_keyword,search_intent,seo_score,word_count,status,updated_at")
    .eq("id", id)
    .single();
  if (!document) notFound();

  const [{ data: versions }, { data: approvals }] = await Promise.all([
    supabase.from("content_versions").select("id,version_number,change_summary,created_at").eq("document_id", id).order("version_number", { ascending: false }).limit(8),
    supabase.from("approval_requests").select("id,status,note,decision_note,requested_at").eq("document_id", id).order("requested_at", { ascending: false }).limit(5),
  ]);

  const versionRows = (versions ?? []) as VersionRow[];
  const approvalRows = (approvals ?? []) as ApprovalRow[];
  const pendingApproval = approvalRows.find((approval) => approval.status === "pending");

  return (
    <main className="shell">
      <AppSidebar active="content" />
      <section className="workspace editorWorkspace">
        <header>
          <div><Link className="backLink" href="/content"><ArrowLeft size={15} />Content Studio</Link><p className="eyebrow">DOCUMENT · {String(document.status).replaceAll("_", " ").toUpperCase()}</p><h1>{document.title}</h1><p className="muted">Edit the article, review SEO metadata and preserve every saved version.</p></div>
          <div className="editorHeaderScore"><SearchCheck size={18} /><span><strong>{document.seo_score}</strong><small>SEO score</small></span></div>
        </header>

        {query.error && <div className="errorNotice">{query.error}</div>}
        {query.message && <div className="successNotice">{query.message}</div>}

        <form action={saveDocument} className="editorGrid">
          <input name="documentId" type="hidden" value={document.id} />
          <section className="panel editorMain">
            <div className="editorField"><label>Article title</label><input name="title" defaultValue={document.title} required /></div>
            <div className="editorField"><label>Slug</label><input name="slug" defaultValue={document.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></div>
            <div className="editorField"><label>Excerpt</label><textarea className="excerptEditor" name="excerpt" defaultValue={document.excerpt} /></div>
            <div className="editorField"><label>Article body · Markdown</label><textarea className="bodyEditor" name="bodyMarkdown" defaultValue={document.body_markdown} /></div>
            <button className="primary saveButton"><Save size={16} />Save new version</button>
          </section>

          <aside className="editorSide">
            <section className="panel seoPanel">
              <p className="eyebrow">SEO METADATA</p><h2>Search presentation</h2>
              <div className="editorField"><label>Primary keyword</label><input name="primaryKeyword" defaultValue={document.primary_keyword} /></div>
              <div className="editorField"><label>Search intent</label><input name="searchIntent" defaultValue={document.search_intent} /></div>
              <div className="editorField"><label>Meta title</label><input name="metaTitle" maxLength={70} defaultValue={document.meta_title} /></div>
              <div className="editorField"><label>Meta description</label><textarea name="metaDescription" maxLength={180} defaultValue={document.meta_description} /></div>
              <div className="documentStats"><span><strong>{document.word_count}</strong><small>words</small></span><span><strong>{document.seo_score}</strong><small>SEO</small></span></div>
            </section>
          </aside>
        </form>

        <div className="editorBottomGrid">
          <section className="panel versionPanel">
            <div className="panelHead"><div><p className="eyebrow">VERSION HISTORY</p><h2>Saved revisions</h2></div><History size={18} /></div>
            {versionRows.length ? <div className="versionList">{versionRows.map((version) => <article key={version.id}><b>v{version.version_number}</b><span><strong>{version.change_summary}</strong><small><Clock3 size={11} />{new Date(version.created_at).toLocaleString("en")}</small></span></article>)}</div> : <div className="miniEmpty">Save the document to create version 1.</div>}
          </section>

          <section className="panel approvalPanel">
            <div className="panelHead"><div><p className="eyebrow">HUMAN APPROVAL</p><h2>Editorial gate</h2></div><FileCheck2 size={18} /></div>
            {pendingApproval ? <div className="approvalPending"><CheckCircle2 size={17} /><span><strong>Review requested</strong><small>{pendingApproval.note || "Waiting for an authorized reviewer."}</small></span></div> : <form action={requestDocumentApproval}><input name="documentId" type="hidden" value={document.id} /><label>Reviewer note<textarea name="note" placeholder="What should the reviewer verify?" /></label><button className="secondary">Request approval</button></form>}
          </section>
        </div>
      </section>
    </main>
  );
}
