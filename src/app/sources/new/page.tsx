import Link from "next/link";
import { ArrowLeft, Globe2, Rss, Workflow } from "lucide-react";
import { addSource } from "../actions";
import "./source-form.css";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewSourcePage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="sourceFormShell">
      <section className="sourceFormIntro">
        <div className="brand"><span className="brandMark"><Workflow size={19} /></span><span><strong>NicheFlow</strong><small>OS</small></span></div>
        <p className="eyebrow">TRUSTED SOURCE ONBOARDING</p>
        <h1>Add a monitored feed.</h1>
        <p>NicheFlow accepts RSS and Atom feeds, validates the public destination, normalizes items, and records every ingestion execution.</p>
        <div className="sourceSafety"><Globe2 size={18} /><span><strong>Network protected</strong><small>Private hosts, oversized feeds and unsafe redirects are blocked.</small></span></div>
      </section>

      <section className="sourceFormCard">
        <Link className="backLink" href="/sources"><ArrowLeft size={15} />Back to Sources</Link>
        <div><p className="eyebrow">NEW SOURCE</p><h2>Configure an RSS or Atom feed</h2></div>
        {params.error && <div className="errorNotice">{params.error}</div>}
        <form action={addSource}>
          <label>Source name<input name="name" placeholder="Example: ANRT News" required /></label>
          <label>Feed URL<input name="url" type="url" placeholder="https://example.ma/feed.xml" required /></label>
          <div className="sourceFormGrid">
            <label>Feed format<select name="sourceType" defaultValue="rss"><option value="rss">RSS</option><option value="atom">Atom</option></select></label>
            <label>Fetch cadence<select name="fetchIntervalMinutes" defaultValue="360"><option value="60">Every hour</option><option value="240">Every 4 hours</option><option value="360">Every 6 hours</option><option value="720">Every 12 hours</option><option value="1440">Daily</option></select></label>
          </div>
          <label>Coverage pillar<input name="coveragePillar" placeholder="Connectivity & regulation" required /></label>
          <button className="primary sourceSubmit"><Rss size={16} />Create monitored source</button>
        </form>
      </section>
    </main>
  );
}
