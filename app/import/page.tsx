'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

type ImportIssue = { rowReference: string; issueType: string; description: string }
type ImportResult = { templateId: string; templateName: string; summary: { sectionsFound: number; itemsFound: number; commentsFound: number; issuesFound: number }; issues?: ImportIssue[] }

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function selectFile(nextFile: File | undefined) {
    if (!nextFile) return
    const isSpreadsheet = /\.(xls|xlsx)$/i.test(nextFile.name)
    if (!isSpreadsheet) {
      setFile(null)
      setErrorMsg('Please choose an XLS or XLSX spreadsheet export.')
      return
    }
    setFile(nextFile)
    setErrorMsg(null)
    setResult(null)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true); setResult(null); setErrorMsg(null)
    const formData = new FormData(); formData.append('file', file)
    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) setErrorMsg(data.error ?? 'Something went wrong during import.')
      else setResult(data)
    } catch {
      setErrorMsg('Could not reach the server. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="import-header">
        <div><p className="eyebrow">Bring it in</p><h1 className="page-title">Import a template.</h1><p className="page-subtitle">Start with a Spectora HTML-text spreadsheet export. Hive will preserve your structure and flag anything that needs a second look.</p></div>
        <Link className="button secondary" href="/templates">View library</Link>
      </div>
      <div className="import-layout">
        <div>
          <section className="upload-panel panel">
            <div
              className={`upload-drop${isDragging ? ' is-dragging' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="Choose or drop a spreadsheet file"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                selectFile(event.dataTransfer.files[0])
              }}
            >
              <div className="upload-icon">↥</div>
              <strong>{isDragging ? 'Drop your spreadsheet here' : 'Choose or drop your spreadsheet'}</strong>
              <span className="muted" style={{ fontSize: 12, marginTop: 7 }}>XLS or XLSX · HTML Text export</span>
              <span className="upload-hint">Click anywhere here to browse files</span>
              <input
                ref={fileInputRef}
                className="file-input"
                type="file"
                accept=".xls,.xlsx"
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => selectFile(event.target.files?.[0])}
              />
            </div>
            <div className="upload-footer"><span className="file-name">{file ? file.name : 'No file selected yet'}</span><button className="button" onClick={handleUpload} disabled={!file || loading}>{loading ? 'Importing...' : 'Import file  →'}</button></div>
          </section>
          {errorMsg && <div className="alert-error"><strong>Import couldn’t finish.</strong><br />{errorMsg}</div>}
          {result && <section className="import-result">
            <h2 className="result-title">Import complete: “{result.templateName}”</h2>
            <div className="stats-grid"><div className="stat"><strong>{result.summary.sectionsFound}</strong><span>Sections</span></div><div className="stat"><strong>{result.summary.itemsFound}</strong><span>Items</span></div><div className="stat"><strong>{result.summary.commentsFound}</strong><span>Comments</span></div><div className="stat"><strong>{result.summary.issuesFound}</strong><span>Needs review</span></div></div>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>{result.summary.issuesFound === 0 ? 'Everything was recognized and imported cleanly.' : 'Your content is safe. A few rows were flagged so you can review them in context.'}</p>
            <Link className="button small" href={`/templates/${result.templateId}`} style={{ marginTop: 15 }}>Open imported template  →</Link>
          </section>}
        </div>
        <aside className="help-panel panel"><h3>Before you begin</h3><ol><li>Open your template in Spectora.</li><li>Choose Export to spreadsheet.</li><li>Select Export HTML Text.</li><li>Upload the downloaded file here.</li></ol><p className="muted" style={{ margin: '17px 0 0', fontSize: 10, lineHeight: 1.5 }}>Your sections, items, comments, and their order will stay connected.</p></aside>
      </div>
    </div>
  )
}
