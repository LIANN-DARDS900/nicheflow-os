import Link from "next/link";
import { ArrowUpRight, CheckCircle2, FileCheck2, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decideApproval } from "./actions";
import "./approvals.css";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };
type ApprovalRecord = {
  id: string;
  status: string;
  note: string;
  requested_at: string;
  content_documents: { id: string; title: string; seo_score: number; word_count: number; primary_keyword: string } | { id: string; title: string; seo_score: number; word_count: number; primary_keyword: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function ApprovalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const live = hasSupabaseEnv();
  let approvals: ApprovalRecord[] = [];
  let dataError: string | null = null;

  if (live) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("approval_requests")
      .select("id,status,note,requested_at,content_documents(id,title,seo_score,word_count,primary_keyword)")
      .eq("status", "pending")
      .order("requested_at", { ascending: true });
    approvals = (data ?? []) as ApprovalRecord[];
    dataError = error?.message ?? null;
  } else {
    approvals = [{ id: "demo-approval", status: "pending", note: "Verify claims, source traceability and the final recommendation section.", requested_at: new Date().toISOString(), content_documents: { id: "article-cables", title: "How subsea cables are strengthening Morocco's digital gateway position", seo_score: 91, word_count: 1680, primary_keyword: "Morocco subsea cables" } }];
  }

  return (
    <main className="shell">
      <AppSidebar active="approvals" />
      <section className="workspace">
        <header>
          <div><p className="eyebrow">HUMAN GOVERNANCE · {live ? "LIVE" : "DEMO"} DATA</p><h1>Approval Center</h1><p className="muted">Review content quality and make explicit decisions before anything can publish.</p></div>
          <div className="approvalGuard"><ShieldCheck size={18} /><span><strong>Human gate enforced</strong><small>Publishing remains blocked until approval.</small></span></div>
        </header>

        {(params.error || dataError) && <div className="errorNotice">{params.error ?? dataError}</div>}
        {params.message && <div className="successNotice">{params.message}</div>}

        <section className="metrics compactMetrics">
          <article><span>Pending reviews</span><strong>{approvals.length}</strong><small>Require an authorized reviewer</small></article>
          <article><span>Approval policy</span><strong>100%</strong><small>No autonomous publishing</small></article>
          <article><span>Decision options</span><strong>2</strong><small>Approve or request changes</small></article>
          <article><span>Audit trail</span><strong>On</strong><small>Reviewer, note and timestamp</small></article>
        </section>

        <section className="approvalQueue">
          {approvals.length === 0 ? (
            <div className="panel emptyState"><FileCheck2 size={24} /><strong>No pending reviews</strong><span>Documents sent for review will appear here.</span></div>
          ) : approvals.map((approval) => {
            const document = firstRelation(approval.content_documents);
            if (!document) return null;
            return (
              <article className="panel approvalCard" key={approval.id}>
                <div className="approvalDocument">
                  <div className="documentIcon"><FileCheck2 size={19} /></div>
                  <div><p className="eyebrow">PENDING REVIEW</p><h2>{document.title}</h2><div className="documentDetails"><span>{document.word_count.toLocaleString()} words</span><span>SEO {document.seo_score}</span><span>{document.primary_keyword || "Keyword not set"}</span></div></div>
                  <Link className="rowMenu" href={live ? `/content/${document.id}` : "/content"}><ArrowUpRight size={18} /></Link>
                </div>
                <div className="reviewRequest"><MessageSquareWarning size={16} /><span><strong>Editor note</strong><p>{approval.note || "Review the document for accuracy, structure and source traceability."}</p></span></div>
                <form action={decideApproval} className="decisionForm">
                  <input name="requestId" type="hidden" value={approval.id} />
                  <label>Reviewer decision note<textarea name="note" placeholder="Record the reason for this decision." disabled={!live} /></label>
                  <div><button className="secondary changesButton" name="decision" value="changes_requested" disabled={!live}><MessageSquareWarning size={15} />Request changes</button><button className="primary" name="decision" value="approved" disabled={!live}><CheckCircle2 size={15} />Approve document</button></div>
                </form>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
