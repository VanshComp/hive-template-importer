'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Template = { id: string; name: string; source: string }

export default function TemplatesListPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function loadTemplates() {
    try {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Could not load templates')
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch { setError('We could not load your templates. Refresh and try again.') } finally { setLoading(false) }
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/templates').then(async (res) => {
      if (!res.ok) throw new Error('Could not load templates')
      return res.json()
    }).then((data) => { if (!cancelled) setTemplates(data.templates ?? []) }).catch(() => { if (!cancelled) setError('We could not load your templates. Refresh and try again.') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleDuplicate(id: string) {
    setDuplicating(id); setError(null); setNotice(null)
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Duplicate failed')
      await loadTemplates()
      setNotice('Template duplicated and added to your library.')
    } catch { setError('That template could not be duplicated. Please try again.') } finally { setDuplicating(null) }
  }

  const visibleTemplates = templates.filter((template) => template.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="library-header"><div><p className="eyebrow">Your workspace</p><h1 className="page-title">Template library.</h1><p className="page-subtitle">A home for every imported template. Open one to review and edit its content in place.</p></div><Link className="button" href="/import">+ Import template</Link></div>
      {!loading && templates.length > 0 && <div className="library-tools"><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." aria-label="Search templates" /><span className="muted" style={{ fontSize: 11 }}>{visibleTemplates.length} template{visibleTemplates.length === 1 ? '' : 's'}</span></div>}
      {error && <div className="alert-error">{error}</div>}
      {notice && <div className="success-notice" role="status">✓ {notice}</div>}
      {loading && <div className="loading-state"><span className="loading-pulse" /> Loading your library...</div>}
      {!loading && templates.length === 0 && <div className="empty-state" style={{ marginTop: 38 }}><div className="empty-state-icon">▦</div><h2 style={{ margin: 0, fontSize: 19 }}>Your library is empty.</h2><p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>Import your first Spectora template and it will appear here.</p><Link className="button small" href="/import" style={{ marginTop: 8 }}>Import first template  →</Link></div>}
      {!loading && templates.length > 0 && visibleTemplates.length === 0 && <div className="empty-state" style={{ marginTop: 20 }}><div className="empty-state-icon">⌕</div><h2 style={{ margin: 0, fontSize: 19 }}>No matches found.</h2><p className="muted" style={{ fontSize: 12 }}>Try a different name.</p></div>}
      {!loading && visibleTemplates.length > 0 && <div className="template-grid">{visibleTemplates.map((template) => <article className="template-card" key={template.id}><div><div className="template-card-top"><span className="template-icon">H</span><span className="template-source">{template.source.replace('_', ' ')}</span></div><h2>{template.name}</h2></div><div className="card-footer"><Link className="card-link" href={`/templates/${template.id}`}>Open template  →</Link><button className="text-button" onClick={() => handleDuplicate(template.id)} disabled={duplicating === template.id}>{duplicating === template.id ? 'Copying...' : 'Duplicate'}</button></div></article>)}</div>}
    </div>
  )
}
