import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: originalTemplateId } = await params
  const supabase = getSupabaseServerClient()

  const { data: original, error: originalError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', originalTemplateId)
    .single()

  if (originalError || !original) {
    return NextResponse.json({ error: 'Original template not found' }, { status: 404 })
  }

  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('template_id', originalTemplateId)
    .order('order_index')

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .in('section_id', (sections ?? []).map((s) => s.id))
    .order('order_index')

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .in('item_id', (items ?? []).map((i) => i.id))
    .order('order_index')

  const { data: newTemplate, error: newTemplateError } = await supabase
    .from('templates')
    .insert({
      name: `${original.name} (Copy)`,
      source: 'copy',
      original_template_id: original.id,
    })
    .select()
    .single()

  if (newTemplateError || !newTemplate) {
    return NextResponse.json(
      { error: 'Failed to create copy', details: newTemplateError?.message },
      { status: 500 }
    )
  }

  const sectionIdMap = new Map<string, string>()
  for (const section of sections ?? []) {
    const { data: newSection, error } = await supabase
      .from('sections')
      .insert({ template_id: newTemplate.id, name: section.name, order_index: section.order_index })
      .select()
      .single()

    if (error || !newSection) {
      return NextResponse.json({ error: `Failed to copy section "${section.name}"` }, { status: 500 })
    }
    sectionIdMap.set(section.id, newSection.id)
  }

  const itemIdMap = new Map<string, string>()
  for (const item of items ?? []) {
    const newSectionId = sectionIdMap.get(item.section_id)
    if (!newSectionId) continue

    const { data: newItem, error } = await supabase
      .from('items')
      .insert({ section_id: newSectionId, name: item.name, order_index: item.order_index })
      .select()
      .single()

    if (error || !newItem) {
      return NextResponse.json({ error: `Failed to copy item "${item.name}"` }, { status: 500 })
    }
    itemIdMap.set(item.id, newItem.id)
  }

  const newCommentRows = (comments ?? [])
    .map((c) => {
      const newItemId = itemIdMap.get(c.item_id)
      if (!newItemId) return null
      return {
        item_id: newItemId,
        name: c.name,
        text: c.text,
        comment_type: c.comment_type,
        category: c.category,
        order_index: c.order_index,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  if (newCommentRows.length > 0) {
    const { error } = await supabase.from('comments').insert(newCommentRows)
    if (error) {
      return NextResponse.json({ error: 'Failed to copy comments', details: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    newTemplateId: newTemplate.id,
    newTemplateName: newTemplate.name,
    sectionsCopied: sectionIdMap.size,
    itemsCopied: itemIdMap.size,
    commentsCopied: newCommentRows.length,
  })
}