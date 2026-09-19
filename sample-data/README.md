# Sample data

**File:** InterNACHI_Residential_-2026-09-19.xls
**Source:** Spectora (free trial) → Templates → Template Center → InterNACHI Template → added to My Templates
**Export path:** My Templates → select template → three dots (⋮) → Export to spreadsheet → Export HTML Text → Download File
**Exported:** 2026-09-19

## Structure notes
- Flat table, 393 rows (1 header + 392 data rows), 42 columns
- Key columns used: Section Name, Item Name, Comment Name, Comment Text, Comment Type (info/limit/defect),
  Category (-1/0/1 severity), Order (w/i item), Answer Type, Multiple Choice Options, Unit Type Options
- Hierarchy is flat/repeated-value, not indented: rows sharing a Section Name belong to that section,
  rows sharing an Item Name within a section belong to that item
- Comment Text sometimes contains inline HTML (<p> tags, non-breaking spaces)
- Section/Item names sometimes contain HTML entities (e.g. &amp;)
- 20 "Default Photo N / Caption" columns exist but are empty in this export