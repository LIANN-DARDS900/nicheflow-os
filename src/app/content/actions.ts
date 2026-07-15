"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildEditorialBrief, slugify } from "@/lib/editorial/brief";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();
const documentSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().trim().min(5).max(180),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500),
  bodyMarkdown: z.string().max(120000),
  metaTitle: z.string().trim().max(70),
  metaDescription: z.string().trim().max(180),
  primaryKeyword: z.string().trim().max(120),
  searchIntent: z.string().trim().max(80),
});

type TopicSourceRow = {
  id: string;
  title: string;
  pillar: string | null;
  raw_items: {
    summary: string;
    url: string;
    sources: { name: string } | { name: string }[] | null;
  } | {
    summary: string;
    url: string;
    sources: { name: string } | { name: string }[] | null;
  }[] | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function requireWorkspace() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) redirect("/login?error=Your+session+has+expired.");

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!workspace) redirect("/onboarding");
  return { supabase, workspaceId: workspace.id, userId: String(claimsData.claims.sub) };
}

export async function promoteTopicToBrief(formData: FormData) {
  const topicId = uuidSchema.safeParse(formData.get("topicId"));
  if (!topicId.success) redirect("/topics?error=Invalid+topic+identifier.");

  const { supabase, workspaceId } = await requireWorkspace();
  const { data, error } = await supabase
    .from("topics")
    .select("id,title,pillar,raw_items(summary,url,sources(name))")
    .eq("id", topicId.data)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) redirect(`/topics?error=${encodeURIComponent(error?.message ?? "Topic not found.")}`);
  const topic = data as TopicSourceRow;
  const rawItem = firstRelation(topic.raw_items);
  const sourceName = firstRelation(rawItem?.sources ?? null)?.name ?? "Trusted source";
  const brief = buildEditorialBrief({
    title: topic.title,
    summary: rawItem?.summary ?? "",
    url: rawItem?.url ?? "",
    sourceName,
    pillar: topic.pillar,
  });

  const { data: savedBrief, error: briefError } = await supabase
    .from("content_briefs")
    .upsert({
      workspace_id: workspaceId,
      topic_id: topic.id,
      title: brief.title,
      objective: brief.objective,
      audience: brief.audience,
      primary_keyword: brief.primaryKeyword,
      secondary_keywords: brief.secondaryKeywords,
      search_intent: brief.searchIntent,
      outline: brief.outline,
      source_references: brief.sourceReferences,
      status: "ready",
    }, { onConflict: "topic_id" })
    .select("id")
    .single();

  if (briefError || !savedBrief) redirect(`/topics?error=${encodeURIComponent(briefError?.message ?? "Unable to create brief.")}`);
  await supabase.from("topics").update({ status: "brief_ready" }).eq("id", topic.id);
  revalidatePath("/topics");
  revalidatePath("/content");
  redirect(`/content/briefs/${savedBrief.id}`);
}

export async function createDocumentFromBrief(formData: FormData) {
  const briefId = uuidSchema.safeParse(formData.get("briefId"));
  if (!briefId.success) redirect("/content?error=Invalid+brief+identifier.");

  const { supabase, workspaceId } = await requireWorkspace();
  const { data: existing } = await supabase.from("content_documents").select("id").eq("brief_id", briefId.data).maybeSingle();
  if (existing) redirect(`/content/${existing.id}`);

  const { data: brief, error } = await supabase
    .from("content_briefs")
    .select("id,topic_id,title,objective,primary_keyword,search_intent,outline")
    .eq("id", briefId.data)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !brief) redirect(`/content?error=${encodeURIComponent(error?.message ?? "Brief not found.")}`);
  const outline = Array.isArray(brief.outline) ? brief.outline : [];
  const body = outline
    .map((section) => {
      const item = typeof section === "object" && section !== null ? section as { heading?: string; guidance?: string } : {};
      return `## ${item.heading ?? "Section"}\n\n${item.guidance ?? ""}\n`;
    })
    .join("\n");

  const { data: document, error: documentError } = await supabase
    .from("content_documents")
    .insert({
      workspace_id: workspaceId,
      brief_id: brief.id,
      topic_id: brief.topic_id,
      title: brief.title,
      slug: slugify(brief.title),
      excerpt: brief.objective,
      body_markdown: body,
      meta_title: brief.title.slice(0, 70),
      meta_description: brief.objective.slice(0, 180),
      primary_keyword: brief.primary_keyword,
      search_intent: brief.search_intent,
      status: "draft",
    })
    .select("id")
    .single();

  if (documentError || !document) redirect(`/content/briefs/${brief.id}?error=${encodeURIComponent(documentError?.message ?? "Unable to create document.")}`);
  revalidatePath("/content");
  redirect(`/content/${document.id}`);
}

export async function saveDocument(formData: FormData) {
  const values = documentSchema.safeParse({
    documentId: formData.get("documentId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    bodyMarkdown: formData.get("bodyMarkdown"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    primaryKeyword: formData.get("primaryKeyword"),
    searchIntent: formData.get("searchIntent"),
  });

  if (!values.success) redirect(`/content?error=Document+validation+failed.`);
  const { supabase, workspaceId } = await requireWorkspace();
  const { data: current, error: currentError } = await supabase
    .from("content_documents")
    .select("id")
    .eq("id", values.data.documentId)
    .eq("workspace_id", workspaceId)
    .single();
  if (currentError || !current) redirect("/content?error=Document+not+found.");

  const { data: latestVersion } = await supabase
    .from("content_versions")
    .select("version_number")
    .eq("document_id", current.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestVersion?.version_number ?? 0) + 1;
  const { error: versionError } = await supabase.from("content_versions").insert({
    document_id: current.id,
    version_number: nextVersion,
    title: values.data.title,
    body_markdown: values.data.bodyMarkdown,
    meta_title: values.data.metaTitle,
    meta_description: values.data.metaDescription,
    change_summary: `Saved from Content Studio as version ${nextVersion}.`,
  });
  if (versionError) redirect(`/content/${current.id}?error=${encodeURIComponent(versionError.message)}`);

  const wordCount = values.data.bodyMarkdown.trim() ? values.data.bodyMarkdown.trim().split(/\s+/).length : 0;
  const seoScore = Math.min(100, Math.round(
    (values.data.primaryKeyword ? 20 : 0) +
    (values.data.metaTitle.length >= 30 && values.data.metaTitle.length <= 65 ? 20 : 8) +
    (values.data.metaDescription.length >= 110 && values.data.metaDescription.length <= 165 ? 20 : 8) +
    (wordCount >= 800 ? 25 : Math.min(20, wordCount / 40)) +
    (values.data.bodyMarkdown.includes("## ") ? 15 : 0),
  ));

  const { error: updateError } = await supabase.from("content_documents").update({
    title: values.data.title,
    slug: values.data.slug,
    excerpt: values.data.excerpt,
    body_markdown: values.data.bodyMarkdown,
    meta_title: values.data.metaTitle,
    meta_description: values.data.metaDescription,
    primary_keyword: values.data.primaryKeyword,
    search_intent: values.data.searchIntent,
    seo_score: seoScore,
    word_count: wordCount,
    status: "draft",
  }).eq("id", current.id);

  if (updateError) redirect(`/content/${current.id}?error=${encodeURIComponent(updateError.message)}`);
  revalidatePath("/content");
  revalidatePath(`/content/${current.id}`);
  redirect(`/content/${current.id}?message=${encodeURIComponent(`Version ${nextVersion} saved.`)}`);
}

export async function requestDocumentApproval(formData: FormData) {
  const documentId = uuidSchema.safeParse(formData.get("documentId"));
  if (!documentId.success) redirect("/content?error=Invalid+document+identifier.");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase.from("approval_requests").insert({ workspace_id: workspaceId, document_id: documentId.data, note });
  if (error) redirect(`/content/${documentId.data}?error=${encodeURIComponent(error.code === "23505" ? "An approval request is already pending." : error.message)}`);
  await supabase.from("content_documents").update({ status: "review" }).eq("id", documentId.data);
  revalidatePath("/content");
  redirect(`/content/${documentId.data}?message=Approval+requested.`);
}
