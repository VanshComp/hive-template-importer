import Link from 'next/link'

const steps = [
  ['01', 'Import', 'Bring in a Spectora spreadsheet export.'],
  ['02', 'Review', 'Scan structure and resolve anything flagged.'],
  ['03', 'Refine', 'Edit names and comments directly in context.'],
]

export default function Home() {
  return (
    <div className="dashboard-page">
      <section className="hero-grid">
        <div>
          <p className="eyebrow">Template workspace</p>
          <h1 className="page-title">A clearer way to shape your inspection templates.</h1>
          <p className="page-subtitle">Bring your Spectora exports into one calm, editable workspace. Review every section, keep your content tidy, and move from import to ready-to-use faster.</p>
          <div className="hero-actions">
            <Link className="button" href="/import">Import a template <span aria-hidden="true">↗</span></Link>
            <Link className="button secondary" href="/templates">Browse library</Link>
          </div>
        </div>
        <div className="hero-note panel">
          <div className="hero-note-top"><span className="mini-badge">H</span><span>HIVE WORKFLOW</span></div>
          <div className="hero-quote">“Make the useful version of your template easy to find.”</div>
          <div className="hero-note-line"><span /> <small>Everything stays connected</small></div>
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading"><div><p className="eyebrow">Simple by design</p><h2>From spreadsheet to clarity.</h2></div><span className="section-count">03 steps</span></div>
        <div className="steps-grid">
          {steps.map(([number, title, copy]) => <div className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></div>)}
        </div>
      </section>

      <section className="callout panel">
        <div><p className="eyebrow">Ready when you are</p><h2>Keep your best templates in motion.</h2><p className="muted">Your workspace is waiting for its first import.</p></div>
        <Link className="button" href="/import">Start importing <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  )
}
