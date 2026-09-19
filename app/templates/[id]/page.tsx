import { getSupabaseServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'

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

      {issues && issues.length > 0 && (
        <details style={{ background: '#fff3cd', padding: 16, marginBottom: 24, borderRadius: 8 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            ⚠ {issues.length} item{issues.length > 1 ? 's' : ''} need review from import
          </summary>
          <ul>
            {issues.map((issue) => (
              <li key={issue.id} style={{ marginTop: 8 }}>
                <strong>{issue.row_reference}</strong> — {issue.issue_type}: {issue.description}
              </li>
            ))}
          </ul>
        </details>
      )}

      {(sections ?? []).map((section) => {
        const items = (allItems ?? []).filter((i) => i.section_id === section.id)
        return (
          <div key={section.id} style={{ marginBottom: 32 }}>
            <h2>{section.name}</h2>
            {items.map((item) => {
              const comments = (allComments ?? []).filter((c) => c.item_id === item.id)
              return (
                <div key={item.id} style={{ marginLeft: 16, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16 }}>{item.name}</h3>
                  <ul>
                    {comments.map((c) => (
                      <li key={c.id} style={{ marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            marginRight: 8,
                            background:
                              c.comment_type === 'defect'
                                ? '#f8d7da'
                                : c.comment_type === 'limit'
                                ? '#fff3cd'
                                : '#d1ecf1',
                          }}
                        >
                          {c.comment_type}
                        </span>
                        <strong>{c.name}</strong>
                        {c.text && (
  <div
    style={{ color: '#444', marginTop: 2 }}
    dangerouslySetInnerHTML={{ __html: c.text }}
  />
)}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}