'use client'
import { useState } from 'react'

export default function EditableField({
  value,
  onSave,
  multiline = false,
  label,
}: {
  value: string
  onSave: (newValue: string) => Promise<void>
  multiline?: boolean
  label?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  async function handleSave() {
    if (draft === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(draft)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1200)
    } catch (e) {
      alert('Failed to save. Please try again.')
      setDraft(value) // revert on failure
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        title={label ? `Click to edit ${label}` : 'Click to edit'}
        style={{
          cursor: 'pointer',
          borderBottom: '1px dashed transparent',
          background: savedFlash ? '#d4edda' : undefined,
          transition: 'background 0.3s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = '#999')}
        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
      >
        {value || <em style={{ color: '#999' }}>(empty)</em>}
      </span>
    )
  }

  const Field = multiline ? 'textarea' : 'input'
  return (
    <span style={{ display: 'inline-block' }}>
      <Field
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) handleSave()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        disabled={saving}
        rows={multiline ? 4 : undefined}
        style={{ width: multiline ? 500 : 300, padding: 4, fontFamily: 'inherit', fontSize: 'inherit' }}
      />
    </span>
  )
}