# NicheFlow OS

**Content Orchestration as a Service**

> The niche changes. The engine stays.

NicheFlow OS turns trusted industry sources into governed, SEO-ready content through an auditable workflow.

`Sources → Ingestion → Extraction → Scoring → Niche Matching → Brief → Draft → SEO → Approval → Publishing`

## Demo workspace

- **Market:** Morocco
- **Niche:** Digital infrastructure
- **Administrator:** ilyas.nazih.dev@gmail.com
- **Operating constraint:** Free tiers only

## Stack

- Next.js 16 and TypeScript
- Supabase PostgreSQL and Auth
- GitHub Codespaces and GitHub Actions
- Vercel-ready deployment
- Secure RSS and Atom ingestion

## Available screens

- `/` — Operations overview
- `/sources` — Sources Manager
- `/topics` — Topic opportunity pipeline
- `/content` — Versioned Content Studio
- `/approvals` — Human review and approval queue
- `/publishing` — Approved exports and publishing history
- `/pipeline` — Execution map and run history
- `/automations` — Workflow rules and safeguards
- `/login` — Account access
- `/onboarding` — Organization and workspace creation
- `/api/health` — Runtime deployment status

## Browser-only development

1. Open the repository in GitHub Codespaces.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the forwarded port `3000` URL.

No local server, XAMPP, cPanel or FTP is required.

## Supabase free-tier setup

Copy `.env.example` to `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Authentication and protected routes activate automatically when both Supabase variables exist. Without them, the interface remains accessible in safe demo mode.

The repository includes:

- Database migration CI against a fresh local Supabase stack
- A manual `Deploy Database` GitHub Action for the production project
- Security headers and a no-cache health endpoint
- Exact browser-only production steps in [`DEPLOYMENT.md`](DEPLOYMENT.md)

## Validation

```bash
npm run typecheck
npm run build
```

GitHub Actions validates the application and all database migrations before deployment changes can merge.
