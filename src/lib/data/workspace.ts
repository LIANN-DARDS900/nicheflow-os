import { demoContent, demoSources, demoTopics, type ContentRecord, type SourceRecord, type TopicRecord } from "@/data/demo";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceData<T> = {
  records: T[];
  mode: "demo" | "live";
  error: string | null;
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

function cadence(minutes: number): string {
  if (minutes < 60) return `Every ${minutes} min`;
  if (minutes % 1440 === 0) return minutes === 1440 ? "Daily" : `Every ${minutes / 1440} days`;
  if (minutes % 60 === 0) return `Every ${minutes / 60} hours`;
  return `Every ${minutes} min`;
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
    domain: row.domain ?? new URL(row.url).hostname,
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
