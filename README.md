# Hive Template Importer

Imports a Spectora HTML-text spreadsheet export into a structured, editable template
system (Section → Item → Comment), lets an inspector edit it, and lets them duplicate a
template with fully independent copies. Built for the Hive Inspect Forward Deployed
Engineer take-home assignment.

**Live app:** https://hive-template-importer-beta.vercel.app/
**Full research writeup:** `research/phase1-findings.md`
**Detailed notes, limitations, and decisions:** `NOTES.md`

## Getting started locally

### 1. Install dependencies
```bash
npm install
```

### 2. Set up a Supabase project
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project and run the schema below to create
   the required tables.
3. Go to **Project Settings → API** and copy your Project URL, `anon` public key, and
   `service_role` key.

### 3. Environment variables
Create a `.env.local` file in the project root:

NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

Never commit this file — it's already listed in `.gitignore`.

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). Go to `/import` to upload a
Spectora HTML-text spreadsheet export, or `/templates` to browse existing ones.

## Database schema

Run this once in your Supabase project's SQL Editor to initialize all required tables:

```sql
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source text not null default 'manual' check (source in ('spectora_import', 'copy', 'manual')),
  original_template_id uuid references templates(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  name text,
  text text,
  comment_type text not null check (comment_type in ('info', 'limit', 'defect')),
  category integer,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists import_issues (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  row_reference text,
  issue_type text not null,
  description text not null,
  raw_content text,
  created_at timestamptz not null default now()
);
```

## Project structure

app/
api/
import/route.ts # Parses and persists a Spectora export
templates/route.ts # Lists all templates
templates/[id]/duplicate/route.ts # Duplicates a template with independent rows
sections/[id]/route.ts # Updates a section name
items/[id]/route.ts # Updates an item name
comments/[id]/route.ts # Updates a comment's name/text
import/page.tsx # Upload UI + import summary view
templates/page.tsx # Template list + duplicate action
templates/[id]/page.tsx # Template detail (fetches data, renders TemplateView)
components/
EditableField.tsx # Reusable inline-edit component with validation
TemplateView.tsx # Client component rendering sections/items/comments
lib/
supabaseServer.ts # Server-side Supabase client (service role key)
sample-data/
InterNACHI_Residential_-2026-09-19.xls # Committed Spectora export used for testing
research/
phase1-findings.md # Product exploration + reference-behavior research


## Deploying

Deployed on [Vercel](https://vercel.com). To deploy your own copy:
1. Import this repo into Vercel.
2. Add the same three environment variables listed above in the Vercel project's
   Environment Variables settings.
3. Deploy. Env vars must be set **before** the first deploy, or you'll need to trigger a
   redeploy after adding them.

## Sample data

`sample-data/InterNACHI_Residential_-2026-09-19.xls` is the committed input file used to
build and test this importer. Source: Spectora free trial → Templates → Template Center
→ InterNACHI Template → exported via **My Templates → ⋮ → Export to spreadsheet →
Export HTML Text**. See `sample-data/README.md` for full details and
`research/phase1-findings.md` for the structural analysis of this file.