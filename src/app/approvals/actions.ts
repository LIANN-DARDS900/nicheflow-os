"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  note: z.string().trim().max(2000),
});

export async function decideApproval(formData: FormData) {
  const values = decisionSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    note: String(formData.get("note") ?? ""),
  });

  if (!values.success) redirect("/approvals?error=Invalid+approval+decision.");
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) redirect("/login?error=Your+session+has+expired.");

  const { data: documentId, error } = await supabase.rpc("decide_approval_request", {
    target_request_id: values.data.requestId,
    requested_decision: values.data.decision,
    reviewer_note: values.data.note,
  });

  if (error) redirect(`/approvals?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/approvals");
  revalidatePath("/content");
  if (documentId) revalidatePath(`/content/${documentId}`);
  redirect(`/approvals?message=${values.data.decision === "approved" ? "Document+approved." : "Changes+requested."}`);
}
