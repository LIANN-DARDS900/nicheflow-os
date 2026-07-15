import { Workflow } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { signIn, signUp } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();

  return (
    <main className="authShell">
      <section className="authIntro">
        <div className="brand"><span className="brandMark"><Workflow size={19} /></span><div><strong>NicheFlow</strong><small>OS</small></div></div>
        <p className="eyebrow">CONTENT ORCHESTRATION AS A SERVICE</p>
        <h1>Turn trusted signals into governed content.</h1>
        <p>Built for the Digital Infrastructure in Morocco demonstration workspace.</p>
      </section>
      <section className="authCard">
        <p className="eyebrow">PLATFORM ACCESS</p>
        <h2>Sign in to your workspace</h2>
        {!configured && <div className="notice">Demo mode is active. Add the free Supabase environment variables to enable accounts.</div>}
        {params.error && <div className="errorNotice">{params.error}</div>}
        {params.message && <div className="successNotice">{params.message}</div>}
        <form>
          <label>Email<input name="email" type="email" defaultValue="ilyas.nazih.dev@gmail.com" required /></label>
          <label>Password<input name="password" type="password" minLength={8} required /></label>
          <div className="authActions">
            <button className="primary" formAction={signIn} disabled={!configured}>Sign in</button>
            <button className="secondary" formAction={signUp} disabled={!configured}>Create account</button>
          </div>
        </form>
        <a className="demoLink" href="/">Open dashboard demo →</a>
      </section>
    </main>
  );
}
