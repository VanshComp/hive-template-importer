import { getSupabaseServerClient } from '@/lib/supabaseServer'

export default async function TestPage() {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('templates').select('*')
  return <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
}