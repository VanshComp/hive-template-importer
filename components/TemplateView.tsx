'use client'

type Comment = { id: string; item_id: string; name: string | null; text: string | null; comment_type: string; order_index: number }
type Item = { id: string; section_id: string; name: string; order_index: number }
type Section = { id: string; template_id: string; name: string; order_index: number }
type Issue = { id: string; row_reference: string; issue_type: string; description: string }

import EditableField from './EditableField'

async function updateSection(id: string, name: string) {
  const res = await fetch(`/api/sections/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to save section')
}

async function updateItem(id: string, name: string) {
  const res = await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to save item')
}

async function updateCommentText(id: string, text: string) {
  const res = await fetch(`/api/comments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Failed to save comment')
}

async function updateCommentName(id: string, name: string) {
  const res = await fetch(`/api/comments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to save comment')
}

export default function TemplateView({
  sections,
  items,
  comments,
  issues,
}: {
  sections: Section[]
  items: Item[]
  comments: Comment[]
  issues: Issue[]
}) {
  return (
    <div>
      {issues.length > 0 && (
        <details style={{ background: '#fff3cd', padding: 16, marginBottom: 24, borderRadius: 8 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            ⚠ {issues.length} item{issues.length > 1 ? 's' : ''} need review from import
          </summary>
          <ul>
            {issues.map((issue) => (
              <li key={issue.id} style={{ marginTop: 8 }}>
                <strong>{issue.row_reference}</strong> — {issue.issue_type}: {issue.description}
              </li>
            ))}
          </ul>
        </details>
      )}

      {sections.map((section) => {
        const sectionItems = items.filter((i) => i.section_id === section.id)
        return (
          <div key={section.id} style={{ marginBottom: 32 }}>
            <h2>
              <EditableField
  value={section.name}
  onSave={(v) => updateSection(section.id, v)}
  label="section name"
  required
/>
            </h2>
            {sectionItems.map((item) => {
              const itemComments = comments.filter((c) => c.item_id === item.id)
              return (
                <div key={item.id} style={{ marginLeft: 16, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16 }}>
                    <EditableField
  value={item.name}
  onSave={(v) => updateItem(item.id, v)}
  label="item name"
  required
/>
                  </h3>
                  <ul>
                    {itemComments.map((c) => (
                      <li key={c.id} style={{ marginBottom: 10 }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            marginRight: 8,
                            background:
                              c.comment_type === 'defect'
                                ? '#f8d7da'
                                : c.comment_type === 'limit'
                                ? '#fff3cd'
                                : '#d1ecf1',
                          }}
                        >
                          {c.comment_type}
                        </span>
                        <strong>
                          <EditableField
                            value={c.name ?? ''}
                            onSave={(v) => updateCommentName(c.id, v)}
                            label="comment name"
                          />
                        </strong>
                        <div style={{ color: '#444', marginTop: 4 }}>
                          <EditableField
                            value={c.text ?? ''}
                            onSave={(v) => updateCommentText(c.id, v)}
                            multiline
                            label="comment text"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}