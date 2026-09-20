# Phase 1 Research Findings — Product Exploration & Reference Behavior

**Project:** Hive Inspect FDE Take-Home — Template Importer
**Author:** [your name]
**Date:** 19 September 2026
**Scope:** Hands-on exploration of Hive Inspect (required), Spectora (required, source of input file), and reference-behavior testing of Hive's own Spectora template importer against our committed sample file.

---

## 1. Purpose of this document

Before building our own importer, we used Hive Inspect's live product to (a) understand the target workflow a switching customer goes through, and (b) establish a **verified reference behavior** for how a competent, shipped importer handles our exact input file. Every claim below was checked against the raw source file with a script, not eyeballed — see Section 4 for method.

This document informs the schema and import-mapping decisions made in later phases (see `NOTES.md` for the decisions themselves).

---

## 2. Environment access completed

| Product | Status | Notes |
|---|---|---|
| Hive Inspect | ✅ Signed up, free trial | Account: "solo" workspace |
| Spectora | ✅ Signed up, free trial | Used to source the input file |
| Binsr | ⬜ Not completed | Optional per brief; deprioritized in favor of deeper Hive/Spectora testing given time constraints. Willing to revisit if time allows before submission. |

---

## 3. Hive Inspect — sample inspection workflow

**What we did:**
1. Created a sample inspection ("Demo Client," 123 Sample Street, Demo City).
2. Opened the associated report (built from the pre-loaded "Demo Residential Template").
3. Reviewed and added to existing findings across Roof, Exterior, Plumbing, and Electrical sections.
4. Published the report via **Inspection Order Page → Select Report → Publish**.
5. Confirmed status changed from "Report Available (Draft)" to **"Published"** (1/1 published).

**Observed data model, inferred from the report editor UI:**
- Hierarchy: **Section → Item → Subsection → comment blocks**, where comment blocks are grouped by type: **Information**, **Limitations**, **Defects/Deficiencies** (and likely **Recommendations**/general Comments beyond what we saw).
- Each comment block is independently editable (save / edit / photo / flag / duplicate / swap / delete icons on every row) — no evidence of whole-template blob storage; this matches the assignment's explicit prohibition on blob storage and is good validation that our own schema direction (Section → Item → Comment, all independently editable rows) is the right shape.
- Fields have a declared **Answer Type** with structured input (e.g., "Covering Material" as a button-group multiple-choice, "Approximate Age" as a range choice, "Notes" as free text).

**UX friction observed (for walkthrough section 7 / Hive feedback):**
- The clearest issue I hit was a missing loading state on navigation. Clicking
  "Templates" in the sidebar produced no visible feedback at all — no spinner, no
  disabled button state, no skeleton screen — for what felt like a noticeable pause
  before the page actually rendered. Because nothing indicated the click had registered,
  I ended up clicking the same button multiple times, assuming the first attempts hadn't
  worked. A simple loading indicator (even a basic spinner or disabled-state button)
  would remove this ambiguity and prevent the repeated-click behavior it currently
  invites.
- More broadly, several transitions in the product (particularly the Reports/Templates
  area) felt slower than expected for what should be simple navigation, which compounds
  the above issue — a delay is far less frustrating when the UI visibly acknowledges the
  action immediately, even if the underlying data takes a moment longer to load.
- To be clear, this is specifically about perceived responsiveness during navigation, not
  the product's core functionality or design direction — the underlying template import
  and report-building workflow itself felt well thought out and matched what a switching
  customer would actually need.
---

## 4. Spectora — input file structure

**Source:** Spectora free trial → Templates → Template Center → "InterNACHI Template" → added to My Templates → exported via **My Templates → select template → ⋮ → Export to spreadsheet → Export HTML Text → Download File**.

**File:** `InterNACHI_Residential_-2026-09-19.xls`, committed to `sample-data/` in the repo.

**Method:** Parsed programmatically with `pandas`/`openpyxl` to establish ground truth before any manual comparison.

**Structural findings:**

| Property | Finding |
|---|---|
| Shape | 393 rows × 42 columns (1 header row + 392 data rows) |
| Hierarchy encoding | **Flat table, not indented.** A row's `Section Name` and `Item Name` values determine its place in the hierarchy by repetition — rows sharing the same `Section Name` belong to that section; rows sharing the same `Item Name` within a section belong to that item. There is no separate "level" or indentation column. |
| Sections | 13 total: Inspection Details, Exterior, Roof, Basement/Foundation/Crawlspace & Structure, Heating, Cooling, Plumbing, Electrical, Fireplace, Attic/Insulation & Ventilation, Doors/Windows & Interior, Built-in Appliances, Garage |
| Comment classification | `Comment Type` column: one of `info`, `limit`, `defect` — maps directly to the Information / Limitations / Defects-Deficiencies grouping seen in Hive's UI |
| Explicit ordering | `Order (w/i item)` column present and populated (0, 1, 2, 3…) — **ordering does not need to be inferred from row position**, it's given directly |
| Answer types | `checkbox`, `number`, `boolean`, `text` observed |
| Rich content | `Comment Text` contains inline HTML on 198 of 392 rows (`<p>` tags, `\r\n`, non-breaking spaces `\xa0`) |
| HTML entities | Section/item names sometimes contain HTML entities, e.g. `Basement, Foundation, Crawlspace &amp; Structure` |
| Multiple choice data | `Multiple Choice Options` column: comma-separated option lists (e.g., Siding Material: "Stucco, Brick Veneer, Asphalt, Fiber Cement, Wood, Shingles, Masonry, Brick, Logs, Vinyl, Stone Veneer, Plastic, Metal, Engineered Wood, Concrete, Stone") |
| Severity/category | `Category` column: `-1` (Low), `0` (Med), `1` (High). In this file, only `0` (281 rows) and `1` (21 rows) appear — no `-1` examples exist in this particular export. |
| Photo columns | 10 pairs of `Default Photo N` / `Default Photo N Caption` columns exist in the schema but are **empty in every row** of this export |
| Unused/low-value columns present | `Recommendation`, `Default Location`, `Default Estimate Min/Max`, `Locked`, `Simple Format`, `Disable Photos`, `Uses`, `Last Modified` — all present in the column schema but not exercised meaningfully by this particular file |

---

## 5. Reference test — importing our file into Hive's own importer

**Why we did this:** Hive's own product already solves the exact problem this assignment asks us to solve. Testing our real input file against a live, shipped competitor implementation gives us a verified "known-good" behavior to design toward, rather than guessing at edge cases blind.

**Method:** Templates → Add Templates (Upload) → Import Template modal → Source: Spectora → uploaded `InterNACHI_Residential_-2026-09-19.xls` → Import Template.

### 5.1 Top-line result

| Metric | Raw file | Hive's import result | Match? |
|---|---|---|---|
| Sections | 13 | 13 | ✅ |
| Items (as "Subsections" in Hive's terminology) | 69 distinct Section+Item combinations in raw data | 69 Subsections | ✅ |
| Comment rows | 392 data rows | 392 Fields | ✅ |

**Conclusion:** No evidence of silent data loss at the row/field level. This is a strong fidelity baseline, and confirms the file itself is a clean, well-formed input (i.e., any future gaps we find in our own importer are implementation gaps, not source-data problems).

### 5.2 Item-level spot checks

| Location | Raw: info / limit / defect | Hive: Information / Limitations / Defects fields | Order preserved? |
|---|---|---|---|
| Roof → Coverings | 1 / 0 / 10 | 1 / 0 / 10 | ✅ exact sequence match (Damaged (General) → Delamination → Discoloration → Improper/Incomplete Nailing → Ponding → Shingles Missing → Splitting → Tiles Cracked/Broken → Under-Driven Nails → Underlayment Damage) |
| Roof → Flashings | 1 / 0 / 4 | 1 / 0 / 4 | ✅ exact sequence match (Corroded - Minor → Corroded - Severe → Loose/Separated → Missing) |

The "0 Limitations" result for both items is a **correct empty state**, verified against the raw file — not a drop. Important distinction to preserve in our own importer's testing discipline: absence of data must be checked against source, not assumed to be a bug.

### 5.3 Rich text / HTML handling

**Raw source (`Evidence of Water Intrusion`, Exterior → Siding, Flashing & Trim):**
```
<p>Siding showed signs of water intrusion. This could lead to further siding
deterioration and/or mold. Recommend a qualified siding contractor evaluate
and repair.\xa0</p>
```

**Rendered in Hive's edit view:**
```
Siding showed signs of water intrusion. This could lead to further siding
deterioration and/or mold. Recommend a qualified siding contractor evaluate
and repair.
```

**Finding:** The `<p>` wrapper is correctly interpreted as paragraph structure (not leaked as literal text), and the trailing non-breaking space produces no visible artifact. This confirms proper HTML parsing rather than naive string storage.

### 5.4 HTML entity decoding

**Raw section name:** `Basement, Foundation, Crawlspace &amp; Structure`
**Displayed in Hive:** `Basement, Foundation, Crawlspace & Structure`

**Finding:** HTML entities in section/item names are decoded for display, not shown raw.

### 5.5 Multiple-choice options fidelity

**Raw `Multiple Choice Options` for "Siding Material":** Stucco, Brick Veneer, Asphalt, Fiber Cement, Wood, Shingles, Masonry, Brick, Logs, Vinyl, Stone Veneer, Plastic, Metal, Engineered Wood, Concrete, Stone

**Displayed options in Hive's edit modal:** Identical list, same order, comma-for-comma.

**Finding:** Choice-list parsing is exact, no reordering or loss.

### 5.6 Severity/category mapping (partially verified)

Hive's "Edit Comment" modal for a Defect/Deficiency field shows a **Defect/Deficiency Category** selector with three options: **Maintenance Items / Recommendations / Safety Concerns**.

Observed: raw `Category = 0` ("Med") on "Evidence of Water Intrusion" → Hive pre-selected **"Recommendations"** (the middle option).

**Inferred mapping (not fully confirmed):** `-1 → Maintenance Items`, `0 → Recommendations`, `1 → Safety Concerns`. The `-1` case could not be verified because no row in this file carries that value. A row with `Category = 1` ("Foundation Cracks - Major," under Basement/Foundation → Foundation) was identified as a candidate for confirming the high end of the mapping but was not checked before this document was written — **flagged as an open follow-up**, not a confirmed fact.

---

## 6. What we are replicating from Hive's approach

These are deliberate design choices for our own importer, directly informed by the above testing:

1. **Three-level structured hierarchy** (Section → Item → Comment), never a whole-template HTML blob — consistent with both Hive's implementation and the assignment's explicit requirement.
2. **Preserve the explicit `Order` column** rather than re-deriving order from row position or alphabetization — the source data already gives us this, and Hive's result confirms it's the right ordering signal to trust.
3. **HTML-decode entities** in section/item names for display, while keeping the underlying raw value recoverable if needed.
4. **Parse `<p>`-wrapped rich text** into real paragraph structure rather than storing/display it as an escaped string — matches how a switching customer would expect their formatting to look.
5. **Preserve comment type as a first-class classification** (`info` / `limit` / `defect`), not just free-form metadata — this is what lets our own UI group comments meaningfully, the same way Hive's Information/Limitations/Defects grouping does.

---

## 7. Where we intend to differ or go further

1. **Visible import diagnostics.** Nothing in Hive's import flow surfaced a summary of what was imported, skipped, or ambiguous — the only way we validated fidelity was by manually cross-referencing counts against the raw file with a script. Our own importer will surface an explicit **import summary + issues list** (counts imported, anything flagged) directly in the UI, which is both a customer-trust feature and a direct response to a real gap we personally hit while testing.
2. **Explicit handling of empty/never-populated columns.** The 10 pairs of photo columns and several metadata columns (`Recommendation`, `Default Location`, estimate ranges, `Locked`, etc.) exist in the schema but are unused in this file. Our importer will explicitly document which of these columns we map, and treat a populated-but-unsupported column as a distinct, logged case — separate from a column that's simply empty/not present in the source.
3. **We will not assume the severity-to-category mapping** we observed (`0 → Recommendations`, etc.) is something we need to replicate exactly, since our own product has no equivalent three-way categorization requirement. We may keep `Category` as a stored numeric/label field without forcing it into Hive's specific UI categories — documented explicitly as a deliberate scope decision, not an oversight.

---

## 8. Summary

Phase 1 gave us a verified, evidence-based understanding of both the input data (Spectora's export format) and a working reference implementation's behavior (Hive's own importer), rather than starting the build on assumptions. Every fidelity claim above was checked programmatically against the source file, not visually estimated. This foundation directly shapes the schema and import-mapping decisions made from Phase 3 onward, and gives us a legitimate basis for explaining *why* we made those decisions in the walkthrough, rather than only describing *what* we built.