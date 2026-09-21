# NOTES.md

## What this is
A template importer that takes a Spectora HTML-text spreadsheet export and brings it into
a structured, editable system: Section → Item → Comment, matching the hierarchy Spectora
itself uses. Verified against a real Spectora export and cross-checked against Hive's own
built-in importer (see `research/phase1-findings.md` for the full comparison).

## Stack
- Next.js (App Router, TypeScript) + Supabase (Postgres) + Vercel
- `xlsx` npm package for parsing the spreadsheet export
- No starter template beyond the default `create-next-app` scaffold

## What's supported
- Spectora "Export to spreadsheet → Export HTML Text" format (.xls/.xlsx)
- Full Section → Item → Comment hierarchy, preserving the file's explicit Order column
- Comment classification (info / limit / defect)
- Inline HTML in comment text (links, bold, paragraphs) — decoded and rendered properly,
  not stored as opaque blobs
- HTML entity decoding in section/item names (e.g. `&amp;` → `&`)
- Editing of section names, item names, and comment text/name, with real-time persistence
- Independent template duplication (verified: editing a copy never affects the original)
- Import diagnostics: unsupported content (e.g. an embedded video wrapper found in the
  committed sample file) is flagged and logged, never silently dropped
- Required-field validation on section/item names in the editor (can't save blank)
- Import summary view showing counts and a clear "everything recognized" vs "these need
  a look" message immediately after import

## What I cut and why
- No drag-and-drop reordering of sections/items — text editing covers the core requirement
  (preserve and allow editing of names/text); reordering is a real feature but not
  essential to proving the import/edit/copy loop in the time available.
- Comment text is edited as raw HTML in a plain textarea, not a WYSIWYG rich-text editor.
  The display view renders it properly (links, bold, etc.); editing the underlying HTML
  directly is a reasonable time-boxed tradeoff for a two-day build.
- Did not build support for the 20 photo columns in the Spectora export, since they were
  empty in the committed sample file — this is a genuine "missing from export" case for
  this file, not an importer limitation, though a real customer file with photos would
  need this handled separately.
- Did not replicate Hive's severity-category mapping (Maintenance Items / Recommendations
  / Safety Concerns) seen during Phase 1 testing — out of scope for this exercise; the raw
  numeric `Category` value from the source file is preserved instead of being mapped to a
  UI label.
- No drag reordering, no bulk operations, no multi-user access control — single-user
  hackathon scope, documented as deliberate rather than oversight.

## Known limitations
- `dangerouslySetInnerHTML` is used to render preserved comment formatting. This is an
  acceptable tradeoff for a controlled, self-exported source file, but would need HTML
  sanitization (e.g. `sanitize-html` with an allowlist of tags) before handling arbitrary
  user-uploaded files in a real product.
- No authentication — single-user hackathon scope. All database access goes through the
  Supabase service role key, used server-side only (never exposed to the browser).
- Import is synchronous and can take up to ~30s for a large template, since it makes
  many sequential Supabase insert calls (one per section/item/comment batch). Acceptable
  for this scope; a production version would batch inserts or move import to a background
  job with progress feedback.

## How I checked my work
- Verified the raw Spectora file's structure independently with a Python script
  (pandas/openpyxl) before writing any import code, to establish ground truth
  (see `research/phase1-findings.md`)
- Cross-tested import fidelity against Hive Inspect's own built-in Spectora importer using
  the exact same committed file — confirmed matching section/item/comment counts,
  preserved ordering, correct HTML paragraph handling, and correct entity decoding
- Verified persistence survives a full server restart (real backend storage, not
  in-memory state)
- Verified editing a duplicated template never affects the original — checked both in the
  UI and directly in the Supabase table editor
- Generalization test: imported "(2026) Florida Uniform Mitigation Verification
  Inspection Form" — a structurally different Spectora template, not the committed
  InterNACHI export — resulting in 16 sections, 51 items, 200 comments, 0 issues, with no
  crash and sane output. Confirms the importer isn't hardcoded to the committed sample
  file.
- Failure case tested:The app returns a clear error message ("This file has
  no data rows. Please check you exported the correct template.") instead of crashing or
  showing a blank page. Validation happens server-side in `app/api/import/route.ts`
  before any database writes occur, so a bad file never creates partial/corrupt data.

## The hardest part
Found a real edge case in the committed template: a comment ("Doorknob Hole" under
Doors, Windows & Interior → Walls) contained an empty
`<div class="youtube-embed-wrapper">` — a leftover from an embedded video that Spectora's
spreadsheet export format doesn't actually carry. Distinguished this as "missing from the
export" (the video itself was never in the file) rather than "importer failure" (a
parsing bug), stripped the dead markup, and logged it as a flagged import issue with the
original raw content preserved for review — rather than silently dropping it or leaving
broken HTML sitting in the displayed text.

## Go further: what I built and why
Chose import trust + editor safety as the improvement area, based on real evidence from
Phase 1 research: Hive's own importer gives no visible summary of what was imported or
flagged during import — the only way to verify fidelity was manual cross-checking against
the raw file. For a customer switching off four years of tuned Spectora content, that
uncertainty is exactly the kind of thing that erodes trust in a migration.

1. **Import summary view** — clear stat counts (sections/items/comments/issues) and an
   explicit "everything was recognized" vs "these need a look" message immediately after
   import, so an inspector doesn't have to take the import on faith or dig through data
   manually.
2. **Required-field validation** on section/item names in the editor, so a non-technical
   user can't accidentally save a blank structural label and silently break their
   template's organization.

Both are small, targeted additions built on infrastructure already in place (the
`import_issues` table and the `EditableField` component), rather than new scope — a
deliberate choice given the remaining time budget, rather than spreading effort thin
across unrelated features.

## Approximate time spent

Approximately 20 hours across 19–20 September 2026. This included exploring Hive
Inspect's live product end to end (running a sample inspection, publishing a report,
testing its own Spectora import flow), signing up for and exporting from Spectora,
independently verifying the export's structure before writing any code, schema design,
building the import/parse/persist pipeline, inline editing, template duplication,
deployment to Vercel, and this documentation.

## Credit
Built on the default `create-next-app` scaffold (Next.js App Router, TypeScript). No
other starter templates, UI kits, or external boilerplate used. Parsing via the `xlsx`
npm package; Supabase JS client for persistence.
