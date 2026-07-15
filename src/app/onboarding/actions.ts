"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const slug = z.string().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const onboardingSchema = z.object({
  organizationName: z.string().trim().min(2).max(80),
  organizationSlug: slug,
  workspaceName: z.string().trim().min(2).max(80),
  workspaceSlug: slug,
  market: z.string().trim().min(2).max(80),
  niche: z.string().trim().min(2).max(120),
  language: z.enum(["en", "fr", "ar"]),
});

export async function createWorkspace(formData: FormData) {
  const values = onboardingSchema.safeParse({
    organizationName: formData.get("organizationName"),
    organizationSlug: formData.get("organizationSlug"),
    workspaceName: formData.get("workspaceName"),
    workspaceSlug: formData.get("workspaceSlug"),
    market: formData.get("market"),
    niche: formData.get("niche"),
    language: formData.get("language"),
  });

  if (!values.success) redirect("/onboarding?error=Check+the+names+and+use+lowercase+hyphenated+slugs.");

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) redirect("/login?error=Your+session+has+expired.");

  const { error } = await supabase.rpc("create_organization_with_workspace", {
    organization_name: values.data.organizationName,
    organization_slug: values.data.organizationSlug,
    workspace_name: values.data.workspaceName,
    workspace_slug: values.data.workspaceSlug,
    workspace_market: values.data.market,
    workspace_niche: values.data.niche,
    workspace_language: values.data.language,
  });

  if (error) {
    const message = error.code === "23505" ? "That organization slug is already in use." : error.message;
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }

  redirect("/");
}
