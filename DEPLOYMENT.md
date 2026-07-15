# NicheFlow OS deployment

This project is designed for a browser-only workflow using GitHub, Supabase and Vercel free tiers.

## 1. Create the Supabase project

Create one free Supabase project for `nicheflow-os` and keep its database password private.

Collect these values from the Supabase dashboard:

- Project reference ID
- Project URL
- Publishable key
- Database password
- Personal access token for the Supabase CLI

## 2. Configure GitHub database deployment

In the repository, open **Settings → Secrets and variables → Actions** and create:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

Then open **Actions → Deploy Database → Run workflow**. The workflow links the project and applies every migration in `supabase/migrations` in filename order.

Do not commit any of these secret values.

## 3. Deploy the application on Vercel

Import `LIANN-DARDS900/nicheflow-os` from GitHub into a free Vercel project. Keep the framework preset as Next.js and add these environment variables for Production, Preview and Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Set `NEXT_PUBLIC_SITE_URL` to the final Vercel production URL, without a trailing slash.

## 4. Configure Supabase authentication URLs

In Supabase Auth URL Configuration, set:

- Site URL: the Vercel production URL
- Redirect URL: `https://your-production-domain/auth/callback`
- Preview redirect pattern when needed: `https://*.vercel.app/auth/callback`

## 5. Verify production

Open:

- `/api/health` — must return `"status": "ready"`
- `/login` — create the first account using `ilyas.nazih.dev@gmail.com`
- `/onboarding` — create the Digital Infrastructure in Morocco workspace

After onboarding, add an RSS/Atom source, run ingestion, score items, promote a topic, create a document, request approval and export the approved content.

## Safety and cost

- Free tiers only
- No automatic paid upgrade
- No secret is stored in the repository
- Publishing requires human approval
- Database migrations are validated against a fresh local Supabase database in GitHub Actions
