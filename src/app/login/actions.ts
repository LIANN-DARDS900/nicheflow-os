"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
}

export async function signIn(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials.success) redirect("/login?error=Enter+a+valid+email+and+a+password+of+at+least+8+characters.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  redirect(membership ? "/" : "/onboarding");
}

export async function signUp(formData: FormData) {
  const credentials = readCredentials(formData);
  if (!credentials.success) redirect("/login?error=Enter+a+valid+email+and+a+password+of+at+least+8+characters.");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials.data,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.session) redirect("/onboarding");
  redirect("/login?message=Check+your+email+to+confirm+your+account.");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
