import { getSupabaseServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function TemplatesListPage() {
  const supabase = getSupabaseServerClient()
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 40 }}>
      <h1>Templates</h1>
      <Link href="/import">+ Import new template</Link>
      <ul style={{ marginTop: 20 }}>
        {(templates ?? []).map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <Link href={`/templates/${t.id}`}>{t.name}</Link>
            <span style={{ color: '#888', marginLeft: 8 }}>({t.source})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}