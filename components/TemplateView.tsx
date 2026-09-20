'use client'

type Comment = { id: string; item_id: string; name: string | null; text: string | null; comment_type: string; order_index: number }
type Item = { id: string; section_id: string; name: string; order_index: number }
type Section = { id: string; template_id: string; name: string; order_index: number }
type Issue = { id: string; row_reference: string; issue_type: string; description: string }

import EditableField from './EditableField'

async function updateSection(id: string, name: string) { const res = await fetch(`/api/sections/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); if (!res.ok) throw new Error('Failed to save section') }
async function updateItem(id: string, name: string) { const res = await fetch(`/api/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); if (!res.ok) throw new Error('Failed to save item') }
async function updateCommentText(id: string, text: string) { const res = await fetch(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); if (!res.ok) throw new Error('Failed to save comment') }
async function updateCommentName(id: string, name: string) { const res = await fetch(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); if (!res.ok) throw new Error('Failed to save comment') }

export default function TemplateView({ sections, items, comments, issues }: { sections: Section[]; items: Item[]; comments: Comment[]; issues: Issue[] }) {
  return <div>
    {issues.length > 0 && <details className="review-panel" open><summary>⚠ {issues.length} item{issues.length > 1 ? 's' : ''} need review from import</summary><ul>{issues.map((issue) => <li key={issue.id}><strong>{issue.row_reference}</strong> — {issue.issue_type}: {issue.description}</li>)}</ul></details>}
    {sections.length === 0 && <div className="empty-state"><div className="empty-state-icon">⌁</div><h2 style={{ margin: 0, fontSize: 19 }}>This template has no content yet.</h2><p className="muted" style={{ fontSize: 12 }}>Try importing the source file again.</p></div>}
    {sections.map((section) => { const sectionItems = items.filter((item) => item.section_id === section.id); return <section className="content-section" key={section.id}><h2><EditableField value={section.name} onSave={(value) => updateSection(section.id, value)} label="section name" required /></h2>{sectionItems.map((item) => { const itemComments = comments.filter((comment) => comment.item_id === item.id); return <div className="content-item" key={item.id}><h3><EditableField value={item.name} onSave={(value) => updateItem(item.id, value)} label="item name" required /></h3><ul className="comment-list">{itemComments.map((comment) => <li className="comment-row" key={comment.id}><span className={`comment-type ${comment.comment_type}`}>{comment.comment_type}</span><span className="comment-name"><EditableField value={comment.name ?? ''} onSave={(value) => updateCommentName(comment.id, value)} label="comment name" /></span><div className="comment-text"><EditableField value={comment.text ?? ''} onSave={(value) => updateCommentText(comment.id, value)} multiline label="comment text" /></div></li>)}</ul></div>})}</section> })}
  </div>
}
