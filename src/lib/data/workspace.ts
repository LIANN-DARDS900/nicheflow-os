import { demoContent, demoSources, demoTopics, type ContentRecord, type SourceRecord, type TopicRecord } from "@/data/demo";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceData<T> = {
  records: T[];
  mode: "demo" | "live";
  error: string | null;
};

export type WorkflowRunRecord = {
  id: string;
  started: string;
  duration: string;
  items: number;
  opportunities: number;
  status: "Queued" | "Running" | "Completed" | "Failed" | "Cancelled";
};

type SourceRow = {
  id: string;
  name: string;
  url: string;
  source_type: string;
  status: string;
  domain: string | null;
  coverage_pillar: string | null;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  item_count: number;
};

type TopicRow = {
  id: string;
  title: string;
  pillar: string | null;
  relevance_score: number | null;
  freshness_score: number | null;
  authority_score: number | null;
  status: string;
  sources: { name: string } | { name: string }[] | null;
};

type ContentRow = {
  id: string;
  title: string;
  primary_keyword: string;
  search_intent: string;
  status: string;
  seo_score: number;
  word_count: number;
  updated_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

type WorkflowRunRow = {
  id: string;
  status: string;
  input_count: number;
  opportunity_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

function relativeTime(value: string | null): string {
  if (!value) return "Never";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function clockTime(value: string): string {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function duration(started: string | null, completed: string | null): string {
  if (!started) return "—";
  const end = completed ? new Date(completed).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - new Date(started).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function cadence(minutes: number): string {
  if (minutes < 60) return `Every ${minutes} min`;
  if (minutes % 1440 === 0) return minutes === 1440 ? "Daily" : `Every ${minutes / 1440} days`;
  if (minutes % 60 === 0) return `Every ${minutes / 60} hours`;
  return `Every ${minutes} min`;
}

function safeHostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function sourceType(value: string): SourceRecord["type"] {
  if (value === "rss" || value === "atom") return "RSS";
  if (value === "url" || value === "sitemap") return "Website";
  return "Institution";
}

function sourceStatus(value: string): SourceRecord["status"] {
  if (value === "paused") return "paused";
  if (value === "error") return "warning";
  return "healthy";
}

function topicStage(value: string): TopicRecord["stage"] {
  if (value === "qualified") return "qualified";
  if (value === "brief_ready") return "brief-ready";
  if (value === "rejected") return "rejected";
  return "discovered";
}

function contentStage(value: string): ContentRecord["stage"] {
  if (value === "draft") return "draft";
  if (value === "review" || value === "changes_requested") return "review";
  if (value === "approved" || value === "scheduled" || value === "published") return "approved";
  return "brief";
}

function runStatus(value: string): WorkflowRunRecord["status"] {
  if (value === "running") return "Running";
  if (value === "completed") return "Completed";
  if (value === "failed") return "Failed";
  if (value === "cancelled") return "Cancelled";
  return "Queued";
}

async function getWorkspaceId(): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  return { id: data?.id ?? null, error: error?.message ?? null };
}

export async function listWorkspaceSources(): Promise<WorkspaceData<SourceRecord>> {
  if (!hasSupabaseEnv()) return { records: demoSources, mode: "demo", error: null };
  const workspace = await getWorkspaceId();
  if (!workspace.id) return { records: [], mode: "live", error: workspace.error };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sources")
    .select("id,name,url,source_type,status,domain,coverage_pillar,fetch_interval_minutes,last_fetched_at,item_count")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  const records = ((data ?? []) as SourceRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    domain: row.domain ?? safeHostname(row.url),
    type: sourceType(row.source_type),
    pillar: row.coverage_pillar ?? "Unassigned",
    cadence: cadence(row.fetch_interval_minutes),
    lastRun: relativeTime(row.last_fetched_at),
    items: row.item_count,
    status: sourceStatus(row.status),
  }));

  return { records, mode: "live", error: error?.message ?? null };
}

export async function listWorkspaceTopics(): Promise<WorkspaceData<TopicRecord>> {
  if (!hasSupabaseEnv()) return { records: demoTopics, mode: "demo", error: null };
  const workspace = await getWorkspaceId();
  if (!workspace.id) return { records: [], mode: "live", error: workspace.error };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id,title,pillar,relevance_score,freshness_score,authority_score,status,sources(name)")
    .eq("workspace_id", workspace.id)
    .order("relevance_score", { ascending: false, nullsFirst: false });

  const records = ((data ?? []) as TopicRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    source: firstRelation(row.sources)?.name ?? "Manual topic",
    pillar: row.pillar ?? "Unassigned",
    score: row.relevance_score ?? 0,
    freshness: row.freshness_score ?? 0,
    authority: row.authority_score ?? 0,
    stage: topicStage(row.status),
  }));

  return { records, mode: "live", error: error?.message ?? null };
}

export async function listWorkspaceContent(): Promise<WorkspaceData<ContentRecord>> {
  if (!hasSupabaseEnv()) return { records: demoContent, mode: "demo", error: null };
  const workspace = await getWorkspaceId();
  if (!workspace.id) return { records: [], mode: "live", error: workspace.error };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_documents")
    .select("id,title,primary_keyword,search_intent,status,seo_score,word_count,updated_at,profiles!content_documents_owner_id_fkey(full_name)")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  const records = ((data ?? []) as ContentRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    keyword: row.primary_keyword || "Keyword not set",
    intent: row.search_intent,
    stage: contentStage(row.status),
    seoScore: row.seo_score,
    words: row.word_count,
    updated: relativeTime(row.updated_at),
    owner: firstRelation(row.profiles)?.full_name ?? "Workspace editor",
  }));

  return { records, mode: "live", error: error?.message ?? null };
}

export async function listWorkflowRuns(): Promise<WorkspaceData<WorkflowRunRecord>> {
  if (!hasSupabaseEnv()) {
    return {
      mode: "demo",
      error: null,
      records: [
        { id: "DEMO-004", started: "13:42", duration: "18s", items: 46, opportunities: 5, status: "Completed" },
        { id: "DEMO-003", started: "12:40", duration: "15s", items: 39, opportunities: 4, status: "Completed" },
        { id: "DEMO-002", started: "11:38", duration: "21s", items: 52, opportunities: 7, status: "Completed" },
      ],
    };
  }

  const workspace = await getWorkspaceId();
  if (!workspace.id) return { records: [], mode: "live", error: workspace.error };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("id,status,input_count,opportunity_count,started_at,completed_at,created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const records = ((data ?? []) as WorkflowRunRow[]).map((row) => ({
    id: row.id.slice(0, 8).toUpperCase(),
    started: clockTime(row.started_at ?? row.created_at),
    duration: duration(row.started_at, row.completed_at),
    items: row.input_count,
    opportunities: row.opportunity_count,
    status: runStatus(row.status),
  }));

  return { records, mode: "live", error: error?.message ?? null };
}
