'use client'
import { useState } from 'react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/import', { method: 'POST', body: formData })
    const data = await res.json()
    setResult(data)
    setLoading(false)
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
      {result && (
        <pre style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}