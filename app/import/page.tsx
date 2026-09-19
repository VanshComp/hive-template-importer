'use client'
import { useState } from 'react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setResult(null)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong during import.')
      } else {
        setResult(data)
      }
    } catch (e) {
      setErrorMsg('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Import Spectora Template</h1>
      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: 12 }}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      {errorMsg && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: '#f8d7da',
            border: '1px solid #f5c2c7',
            borderRadius: 8,
            maxWidth: 500,
          }}
        >
          <strong>Import failed:</strong> {errorMsg}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              padding: 16,
              background: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: 8,
              maxWidth: 500,
              marginBottom: 16,
            }}
          >
            ✓ Imported <strong>{result.templateName}</strong> — {result.summary.sectionsFound} sections,{' '}
            {result.summary.itemsFound} items, {result.summary.commentsFound} comments
            {result.summary.issuesFound > 0 && `, ${result.summary.issuesFound} flagged for review`}.
          </div>
          <a href={`/templates/${result.templateId}`}>View imported template →</a>
        </div>
      )}
    </div>
  )
}