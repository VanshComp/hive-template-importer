'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Template = { id: string; name: string; source: string }

export default function TemplatesListPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  async function loadTemplates() {
    const res = await fetch('/api/templates')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  async function handleDuplicate(id: string) {
    setDuplicating(id)
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Duplicate failed')
      await loadTemplates()
    } catch (e) {
      alert('Failed to duplicate template.')
    } finally {
      setDuplicating(null)
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ padding: 40 }}>
      <h1>Templates</h1>
      <Link href="/import">+ Import new template</Link>
      <ul style={{ marginTop: 20 }}>
        {templates.map((t) => (
          <li key={t.id} style={{ marginBottom: 10 }}>
            <Link href={`/templates/${t.id}`}>{t.name}</Link>
            <span style={{ color: '#888', marginLeft: 8 }}>({t.source})</span>
            <button
              onClick={() => handleDuplicate(t.id)}
              disabled={duplicating === t.id}
              style={{ marginLeft: 12, fontSize: 12 }}
            >
              {duplicating === t.id ? 'Duplicating...' : 'Duplicate'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}