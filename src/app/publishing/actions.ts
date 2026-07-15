"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const exportSchema = z.object({
  documentId: z.string().uuid(),
  format: z.enum(["markdown", "html"]),
});

export async function exportApprovedDocument(formData: FormData) {
  const values = exportSchema.safeParse({ documentId: formData.get("documentId"), format: formData.get("format") });
  if (!values.success) redirect("/publishing?error=Invalid+export+request.");

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) redirect("/login?error=Your+session+has+expired.");

  const { data: document, error } = await supabase
    .from("content_documents")
    .select("id,workspace_id,title,slug,status,seo_score,word_count")
    .eq("id", values.data.documentId)
    .single();

  if (error || !document) redirect(`/publishing?error=${encodeURIComponent(error?.message ?? "Document not found.")}`);
  if (!["approved", "scheduled", "published"].includes(document.status)) redirect("/publishing?error=Only+approved+documents+can+be+exported.");

  const now = new Date().toISOString();
  const { error: jobError } = await supabase.from("publishing_jobs").insert({
    workspace_id: document.workspace_id,
    document_id: document.id,
    status: "published",
    payload: { format: values.data.format, title: document.title, seoScore: document.seo_score, wordCount: document.word_count },
    external_url: `/api/content/${document.id}/export?format=${values.data.format}`,
    started_at: now,
    completed_at: now,
  });

  if (jobError) redirect(`/publishing?error=${encodeURIComponent(jobError.message)}`);
  redirect(`/api/content/${document.id}/export?format=${values.data.format}`);
}
