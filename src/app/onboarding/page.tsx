import { redirect } from "next/navigation";
import { Building2, Globe2, Languages, Workflow } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createWorkspace } from "./actions";
import "./onboarding.css";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) redirect("/login");
    const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
    if (membership) redirect("/");
  }

  return (
    <main className="onboardingShell">
      <section className="onboardingIntro">
        <div className="brand"><span className="brandMark"><Workflow size={19} /></span><span><strong>NicheFlow</strong><small>OS</small></span></div>
        <p className="eyebrow">FIRST WORKSPACE</p>
        <h1>Configure your content operating system.</h1>
        <p>Create the organization and niche workspace that will own sources, topics, content and publishing rules.</p>
        <ol><li><Building2 size={17} />Organization identity</li><li><Globe2 size={17} />Market and niche</li><li><Languages size={17} />Editorial language</li></ol>
      </section>

      <section className="onboardingCard">
        <div><p className="eyebrow">DIGITAL INFRASTRUCTURE · MOROCCO</p><h2>Create your workspace</h2></div>
        {!configured && <div className="notice">Demo mode is active. Connect the free Supabase project before submitting this form.</div>}
        {params.error && <div className="errorNotice">{params.error}</div>}
        <form action={createWorkspace}>
          <div className="formGrid">
            <label>Organization name<input name="organizationName" defaultValue="NicheFlow Labs" required /></label>
            <label>Organization slug<input name="organizationSlug" defaultValue="nicheflow-labs" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
            <label>Workspace name<input name="workspaceName" defaultValue="Morocco Digital Infrastructure" required /></label>
            <label>Workspace slug<input name="workspaceSlug" defaultValue="morocco-digital-infrastructure" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
            <label>Market<input name="market" defaultValue="Morocco" required /></label>
            <label>Editorial language<select name="language" defaultValue="en"><option value="en">English</option><option value="fr">French</option><option value="ar">Arabic</option></select></label>
          </div>
          <label>Niche definition<textarea name="niche" defaultValue="Digital infrastructure in Morocco: cloud, data centres, telecom networks, 5G, cybersecurity, data sovereignty and public digital transformation." required /></label>
          <button className="primary onboardingSubmit" disabled={!configured}>Create organization and workspace</button>
        </form>
      </section>
    </main>
  );
}
