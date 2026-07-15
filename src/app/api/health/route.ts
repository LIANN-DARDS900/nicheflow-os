import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = hasSupabaseEnv();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  return NextResponse.json(
    {
      status: databaseConfigured ? "ready" : "demo",
      application: "nicheflow-os",
      database: databaseConfigured ? "configured" : "not-configured",
      commit,
      checkedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
