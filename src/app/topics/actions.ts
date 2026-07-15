"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scoreTopic } from "@/lib/scoring/topic";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RawItemRow = {
  id: string;
  source_id: string;
  title: string;
  summary: string;
  published_at: string | null;
  sources: { source_type: string; coverage_pillar: string | null } | { source_type: string; coverage_pillar: string | null }[] | null;
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
  return { supabase, workspaceId: workspace.id };
}

export async function scoreWorkspaceItems() {
  const { supabase, workspaceId } = await requireWorkspace();
  const { data, error } = await supabase
    .from("raw_items")
    .select("id,source_id,title,summary,published_at,sources(source_type,coverage_pillar)")
    .eq("workspace_id", workspaceId)
    .in("status", ["discovered", "normalized"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) redirect(`/topics?error=${encodeURIComponent(error.message)}`);
  const items = (data ?? []) as RawItemRow[];
  if (!items.length) redirect("/topics?error=No+new+normalized+items+are+ready+for+scoring.");

  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .insert({ workspace_id: workspaceId, trigger_type: "manual", status: "running", input_count: items.length, started_at: new Date().toISOString() })
    .select("id")
    .single();

  if (runError || !run) redirect(`/topics?error=${encodeURIComponent(runError?.message ?? "Unable to create scoring run.")}`);

  const { data: step } = await supabase
    .from("workflow_steps")
    .insert({ run_id: run.id, step_key: "topic-scoring", step_order: 1, status: "running", input_count: items.length, started_at: new Date().toISOString() })
    .select("id")
    .single();

  const topics = items.map((item) => {
    const source = firstRelation(item.sources);
    const score = scoreTopic({
      title: item.title,
      summary: item.summary,
      publishedAt: item.published_at,
      sourceType: source?.source_type ?? "rss",
      coveragePillar: source?.coverage_pillar ?? null,
    });

    return {
      workspace_id: workspaceId,
      raw_item_id: item.id,
      source_id: item.source_id,
      title: item.title,
      pillar: source?.coverage_pillar ?? "Unassigned",
      relevance_score: score.total,
      freshness_score: score.freshness,
      authority_score: score.authority,
      status: score.total >= 85 ? "brief_ready" : score.total >= 68 ? "qualified" : score.total >= 45 ? "discovered" : "rejected",
      rationale: { ...score.rationale, matchedTerms: score.matchedTerms, componentRelevance: score.relevance },
    };
  });

  const { error: topicError } = await supabase.from("topics").upsert(topics, { onConflict: "raw_item_id" });
  if (topicError) {
    const now = new Date().toISOString();
    if (step) await supabase.from("workflow_steps").update({ status: "failed", error_message: topicError.message, completed_at: now }).eq("id", step.id);
    await supabase.from("workflow_runs").update({ status: "failed", error_message: topicError.message, completed_at: now }).eq("id", run.id);
    redirect(`/topics?error=${encodeURIComponent(topicError.message)}`);
  }

  const now = new Date().toISOString();
  await supabase.from("raw_items").update({ status: "scored" }).in("id", items.map((item) => item.id));
  if (step) await supabase.from("workflow_steps").update({ status: "completed", output_count: topics.length, completed_at: now }).eq("id", step.id);
  await supabase.from("workflow_runs").update({ status: "completed", opportunity_count: topics.filter((topic) => topic.status === "qualified" || topic.status === "brief_ready").length, completed_at: now }).eq("id", run.id);

  revalidatePath("/topics");
  revalidatePath("/pipeline");
  redirect(`/topics?message=${encodeURIComponent(`${topics.length} items scored into topic opportunities.`)}`);
}
