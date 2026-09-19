import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

type ImportIssue = {
  rowReference: string
  issueType: string
  description: string
  rawContent: string
}

type ParsedComment = {
  name: string | null
  text: string | null
  commentType: string
  category: number | null
  orderIndex: number
}

type ParsedItem = {
  name: string
  orderIndex: number
  comments: ParsedComment[]
}

type ParsedSection = {
  name: string
  orderIndex: number
  items: Map<string, ParsedItem>
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\xa0/g, ' ')
}

function detectUnsupportedEmbeds(str: string): boolean {
  return /<div[^>]*embed[^>]*>\s*<\/div>/i.test(str) || /<iframe/i.test(str)
}

function stripHtmlTags(str: string): string {
  const cleaned = str
    .replace(/<div[^>]*embed[^>]*>\s*<\/div>/gi, '') // empty embed wrapper divs (video not preserved in export)
    .replace(/<\/?p[^>]*>/gi, '')
  return decodeHtmlEntities(cleaned.trim())
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let workbook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch (e) {
    return NextResponse.json(
      { error: 'Could not read this file. Please upload a valid Spectora HTML-text spreadsheet export (.xls or .xlsx).' },
      { status: 400 }
    )
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  if (rows.length < 2) {
    return NextResponse.json(
      { error: 'This file has no data rows. Please check you exported the correct template.' },
      { status: 400 }
    )
  }

  const header = rows[0].map((h) => (h ?? '').toString().trim())
  const dataRows = rows.slice(1)

  // Find column indexes by name, so we're not hardcoded to exact positions
  const col = (name: string) => header.findIndex((h) => h.startsWith(name))

  const idx = {
    sectionName: col('Section Name'),
    itemName: col('Item Name'),
    commentName: col('Comment Name'),
    commentText: col('Comment Text'),
    commentType: col('Comment Type'),
    category: col('Category'),
    order: col('Order'),
  }

  const requiredCols = ['sectionName', 'itemName', 'commentType'] as const
  for (const key of requiredCols) {
    if (idx[key] === -1) {
      return NextResponse.json(
        { error: `This file is missing an expected column: "${key}". It may not be a valid Spectora HTML-text export.` },
        { status: 400 }
      )
    }
  }

  const sections = new Map<string, ParsedSection>()
  const issues: ImportIssue[] = []
  let sectionOrder = 0
  let sectionAppearanceOrder: string[] = []

  dataRows.forEach((row, rowNum) => {
    const rawSectionName = row[idx.sectionName]
    const rawItemName = row[idx.itemName]
    const rawCommentType = row[idx.commentType]

    // Skip fully blank rows silently — not an issue, just spreadsheet padding
    if (!rawSectionName && !rawItemName && !rawCommentType) return

    if (!rawSectionName || !rawItemName) {
      issues.push({
        rowReference: `Row ${rowNum + 2}`, // +2: 1 for header, 1 for 0-index
        issueType: 'missing_required_field',
        description: 'Row is missing a Section Name or Item Name and was skipped.',
        rawContent: JSON.stringify(row),
      })
      return
    }

    const commentType = (rawCommentType ?? '').toString().trim().toLowerCase()
    if (!['info', 'limit', 'defect'].includes(commentType)) {
      issues.push({
        rowReference: `Row ${rowNum + 2}`,
        issueType: 'unrecognized_comment_type',
        description: `Comment Type "${rawCommentType}" is not one of info/limit/defect. Row was imported with type "info" as a fallback.`,
        rawContent: JSON.stringify(row),
      })
    }

    const sectionName = decodeHtmlEntities((rawSectionName ?? '').toString().trim())
    const itemName = decodeHtmlEntities((rawItemName ?? '').toString().trim())

    if (!sections.has(sectionName)) {
      sections.set(sectionName, {
        name: sectionName,
        orderIndex: sectionOrder++,
        items: new Map(),
      })
    }
    const section = sections.get(sectionName)!

    if (!section.items.has(itemName)) {
      section.items.set(itemName, {
        name: itemName,
        orderIndex: section.items.size,
        comments: [],
      })
    }
    const item = section.items.get(itemName)!

    const rawCommentText = idx.commentText !== -1 ? row[idx.commentText] : null
    const rawCommentName = idx.commentName !== -1 ? row[idx.commentName] : null
    const rawCategory = idx.category !== -1 ? row[idx.category] : null
    const rawOrder = idx.order !== -1 ? row[idx.order] : null

    if (rawCommentText && detectUnsupportedEmbeds(rawCommentText.toString())) {
      issues.push({
        rowReference: `Row ${rowNum + 2}`,
        issueType: 'unsupported_embedded_media',
        description: `Comment "${rawCommentName}" referenced an embedded video/media element that is not preserved in the Spectora spreadsheet export. The wrapper markup was removed; the video itself was never present in the source file.`,
        rawContent: rawCommentText.toString(),
      })
    }

    item.comments.push({
      name: rawCommentName ? decodeHtmlEntities(rawCommentName.toString().trim()) : null,
      text: rawCommentText ? stripHtmlTags(rawCommentText.toString()) : null,
      commentType: ['info', 'limit', 'defect'].includes(commentType) ? commentType : 'info',
      category: rawCategory !== null && rawCategory !== '' ? Number(rawCategory) : null,
      orderIndex: rawOrder !== null && rawOrder !== '' ? Number(rawOrder) : item.comments.length,
    })
  })

  // Sort comments within each item by orderIndex
  for (const section of sections.values()) {
    for (const item of section.items.values()) {
      item.comments.sort((a, b) => a.orderIndex - b.orderIndex)
    }
  }

  const result = Array.from(sections.values()).map((s) => ({
    name: s.name,
    orderIndex: s.orderIndex,
    items: Array.from(s.items.values()),
  }))

  const totalComments = result.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.comments.length, 0),
    0
  )

    const supabase = getSupabaseServerClient()

  // 1. Create the template
  const templateName = file.name.replace(/\.(xls|xlsx)$/i, '')
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .insert({ name: templateName, source: 'spectora_import' })
    .select()
    .single()

  if (templateError || !template) {
    return NextResponse.json(
      { error: 'Failed to create template record.', details: templateError?.message },
      { status: 500 }
    )
  }

  // 2. Insert sections, items, comments — in order, so we can link foreign keys
  for (const section of result) {
    const { data: sectionRow, error: sectionError } = await supabase
      .from('sections')
      .insert({ template_id: template.id, name: section.name, order_index: section.orderIndex })
      .select()
      .single()

    if (sectionError || !sectionRow) {
      return NextResponse.json(
        { error: `Failed to insert section "${section.name}"`, details: sectionError?.message },
        { status: 500 }
      )
    }

    for (const item of section.items) {
      const { data: itemRow, error: itemError } = await supabase
        .from('items')
        .insert({ section_id: sectionRow.id, name: item.name, order_index: item.orderIndex })
        .select()
        .single()

      if (itemError || !itemRow) {
        return NextResponse.json(
          { error: `Failed to insert item "${item.name}"`, details: itemError?.message },
          { status: 500 }
        )
      }

      if (item.comments.length > 0) {
        const commentRows = item.comments.map((c) => ({
          item_id: itemRow.id,
          name: c.name,
          text: c.text,
          comment_type: c.commentType,
          category: c.category,
          order_index: c.orderIndex,
        }))
        const { error: commentsError } = await supabase.from('comments').insert(commentRows)
        if (commentsError) {
          return NextResponse.json(
            { error: `Failed to insert comments for item "${item.name}"`, details: commentsError.message },
            { status: 500 }
          )
        }
      }
    }
  }

  // 3. Insert import issues, linked to the template
  if (issues.length > 0) {
    const issueRows = issues.map((i) => ({
      template_id: template.id,
      row_reference: i.rowReference,
      issue_type: i.issueType,
      description: i.description,
      raw_content: i.rawContent,
    }))
    const { error: issuesError } = await supabase.from('import_issues').insert(issueRows)
    if (issuesError) {
      return NextResponse.json(
        { error: 'Failed to insert import issues', details: issuesError.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({
    templateId: template.id,
    templateName: template.name,
    summary: {
      sectionsFound: result.length,
      itemsFound: result.reduce((sum, s) => sum + s.items.length, 0),
      commentsFound: totalComments,
      issuesFound: issues.length,
    },
  })
}