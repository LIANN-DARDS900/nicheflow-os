"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ingestFeed } from "@/lib/ingestion/rss";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  url: z.string().url().max(2048),
  sourceType: z.enum(["rss", "atom"]),
  coveragePillar: z.string().trim().min(2).max(120),
  fetchIntervalMinutes: z.coerce.number().int().min(15).max(10080),
});

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

export async function addSource(formData: FormData) {
  const values = sourceSchema.safeParse({
    name: formData.get("name"),
    url: formData.get("url"),
    sourceType: formData.get("sourceType"),
    coveragePillar: formData.get("coveragePillar"),
    fetchIntervalMinutes: formData.get("fetchIntervalMinutes"),
  });

  if (!values.success) redirect("/sources/new?error=Check+the+source+name,+feed+URL,+coverage+and+schedule.");
  const { supabase, workspaceId } = await requireWorkspace();
  const parsedUrl = new URL(values.data.url);

  const { error } = await supabase.from("sources").insert({
    workspace_id: workspaceId,
    name: values.data.name,
    url: values.data.url,
    domain: parsedUrl.hostname,
    source_type: values.data.sourceType,
    coverage_pillar: values.data.coveragePillar,
    fetch_interval_minutes: values.data.fetchIntervalMinutes,
    status: "active",
  });

  if (error) redirect(`/sources/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/sources");
  redirect("/sources?message=Source+created+successfully.");
}

export async function runWorkspaceIngestion() {
  const { supabase, workspaceId } = await requireWorkspace();
  const { data: sources, error: sourceError } = await supabase
    .from("sources")
    .select("id,name,url")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .in("source_type", ["rss", "atom"])
    .order("created_at", { ascending: true })
    .limit(10);

  if (sourceError) redirect(`/sources?error=${encodeURIComponent(sourceError.message)}`);
  if (!sources?.length) redirect("/sources?error=Add+an+active+RSS+or+Atom+source+first.");

  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .insert({ workspace_id: workspaceId, trigger_type: "manual", status: "running", input_count: sources.length, started_at: new Date().toISOString() })
    .select("id")
    .single();

  if (runError || !run) redirect(`/sources?error=${encodeURIComponent(runError?.message ?? "Unable to create workflow run.")}`);

  let totalItems = 0;
  let failures = 0;

  for (const [index, source] of sources.entries()) {
    const stepKey = `ingest:${source.id}`;
    const { data: step } = await supabase
      .from("workflow_steps")
      .insert({ run_id: run.id, step_key: stepKey, step_order: index + 1, status: "running", started_at: new Date().toISOString() })
      .select("id")
      .single();

    try {
      const feed = await ingestFeed(source.url);
      const payload = feed.items.map((item) => ({
        workspace_id: workspaceId,
        source_id: source.id,
        external_id: item.externalId,
        title: item.title,
        url: item.url,
        summary: item.summary,
        author: item.author,
        published_at: item.publishedAt,
        status: "normalized" as const,
        normalized_payload: item,
      }));

      if (payload.length) {
        const { error: itemError } = await supabase.from("raw_items").upsert(payload, { onConflict: "source_id,external_id", ignoreDuplicates: false });
        if (itemError) throw new Error(itemError.message);
      }

      const { count } = await supabase.from("raw_items").select("id", { count: "exact", head: true }).eq("source_id", source.id);
      const now = new Date().toISOString();
      await supabase.from("sources").update({ last_fetched_at: now, last_success_at: now, last_error: null, item_count: count ?? payload.length, status: "active" }).eq("id", source.id);
      if (step) await supabase.from("workflow_steps").update({ status: "completed", output_count: payload.length, completed_at: now, metadata: { feedTitle: feed.title } }).eq("id", step.id);
      totalItems += payload.length;
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : "Unknown ingestion error";
      const now = new Date().toISOString();
      await supabase.from("sources").update({ last_fetched_at: now, last_error: message, status: "error" }).eq("id", source.id);
      if (step) await supabase.from("workflow_steps").update({ status: "failed", error_message: message, completed_at: now }).eq("id", step.id);
    }
  }

  const finalStatus = failures === sources.length ? "failed" : "completed";
  await supabase.from("workflow_runs").update({
    status: finalStatus,
    opportunity_count: 0,
    error_message: failures ? `${failures} source(s) failed.` : null,
    completed_at: new Date().toISOString(),
  }).eq("id", run.id);

  revalidatePath("/sources");
  revalidatePath("/pipeline");
  redirect(`/sources?message=${encodeURIComponent(`Ingestion completed: ${totalItems} items normalized, ${failures} failures.`)}`);
}
