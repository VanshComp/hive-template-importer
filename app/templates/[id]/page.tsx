import { getSupabaseServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import TemplateView from '@/components/TemplateView'

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getSupabaseServerClient()

  const { data: template } = await supabase.from('templates').select('*').eq('id', id).single()

  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('template_id', id)
    .order('order_index')

  const { data: allItems } = await supabase
    .from('items')
    .select('*')
    .in('section_id', (sections ?? []).map((s) => s.id))
    .order('order_index')

  const { data: allComments } = await supabase
    .from('comments')
    .select('*')
    .in('item_id', (allItems ?? []).map((i) => i.id))
    .order('order_index')

  const { data: issues } = await supabase
    .from('import_issues')
    .select('*')
    .eq('template_id', id)

  if (!template) {
    return <div style={{ padding: 40 }}>Template not found.</div>
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <Link href="/templates">← Back to templates</Link>
      <h1>{template.name}</h1>
      <p style={{ color: '#666' }}>Source: {template.source}</p>

      <TemplateView
        sections={sections ?? []}
        items={allItems ?? []}
        comments={allComments ?? []}
        issues={issues ?? []}
      />
    </div>
  )
}