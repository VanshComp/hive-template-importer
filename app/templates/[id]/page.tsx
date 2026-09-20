import { getSupabaseServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import TemplateView from '@/components/TemplateView'

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabaseServerClient()
  const { data: template } = await supabase.from('templates').select('*').eq('id', id).single()
  const { data: sections } = await supabase.from('sections').select('*').eq('template_id', id).order('order_index')
  const { data: allItems } = await supabase.from('items').select('*').in('section_id', (sections ?? []).map((s) => s.id)).order('order_index')
  const { data: allComments } = await supabase.from('comments').select('*').in('item_id', (allItems ?? []).map((i) => i.id)).order('order_index')
  const { data: issues } = await supabase.from('import_issues').select('*').eq('template_id', id)

  if (!template) return <div className="empty-state"><div className="empty-state-icon">?</div><h1 style={{ fontSize: 22 }}>Template not found.</h1><Link className="button small" href="/templates">Back to library</Link></div>

  return (
    <div>
      <Link className="back-link" href="/templates">← Back to template library</Link>
      <div className="detail-header"><div><p className="eyebrow">Template editor</p><h1 className="page-title">{template.name}</h1><p className="detail-meta">Imported from {template.source.replace('_', ' ')} · Edit any highlighted field directly.</p></div><div className="detail-actions"><Link className="button secondary" href="/import">Import another</Link><Link className="button" href="/templates">Done</Link></div></div>
      <div className="template-content"><TemplateView sections={sections ?? []} items={allItems ?? []} comments={allComments ?? []} issues={issues ?? []} /></div>
    </div>
  )
}
