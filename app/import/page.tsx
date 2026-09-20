'use client'
import { useState } from 'react'

type ImportIssue = {
  rowReference: string
  issueType: string
  description: string
}

type ImportResult = {
  templateId: string
  templateName: string
  summary: {
    sectionsFound: number
    itemsFound: number
    commentsFound: number
    issuesFound: number
  }
  issues?: ImportIssue[]
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
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
    <div style={{ padding: 40, maxWidth: 640 }}>
      <h1>Import Spectora Template</h1>
      <p style={{ color: '#666', marginTop: -8 }}>
        Upload a Spectora HTML-text spreadsheet export (Export to spreadsheet → Export HTML Text).
      </p>

      <div style={{ marginTop: 16 }}>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: 12 }}>
          {loading ? 'Importing...' : 'Upload'}
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f8d7da',
            border: '1px solid #f5c2c7',
            borderRadius: 8,
          }}
        >
          <strong>Import failed:</strong> {errorMsg}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              padding: 20,
              background: '#f0f8f1',
              border: '1px solid #c3e6cb',
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
              ✓ Imported "{result.templateName}"
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{result.summary.sectionsFound}</div>
                <div style={{ fontSize: 12, color: '#555' }}>Sections</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{result.summary.itemsFound}</div>
                <div style={{ fontSize: 12, color: '#555' }}>Items</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{result.summary.commentsFound}</div>
                <div style={{ fontSize: 12, color: '#555' }}>Comments</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: result.summary.issuesFound > 0 ? '#856404' : '#28a745',
                  }}
                >
                  {result.summary.issuesFound}
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>Flagged for review</div>
              </div>
            </div>

            {result.summary.issuesFound === 0 ? (
              <p style={{ fontSize: 13, color: '#155724', margin: '8px 0' }}>
                Everything in this file was recognized and imported — nothing was skipped or flagged.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#856404', margin: '8px 0' }}>
                Everything else imported cleanly. The items below need a quick look — nothing was
                silently dropped, but these had content your importer couldn't fully map.
              </p>
            )}

            <a
              href={`/templates/${result.templateId}`}
              style={{ display: 'inline-block', marginTop: 8, fontWeight: 600 }}
            >
              View imported template →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}