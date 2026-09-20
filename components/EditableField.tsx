'use client'

import { useState } from 'react'

export default function EditableField({ value, onSave, multiline = false, label, required = false }: { value: string; onSave: (newValue: string) => Promise<void>; multiline?: boolean; label?: string; required?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSave() {
    if (required && draft.trim() === '') { setValidationError(`${label ?? 'This field'} can't be empty.`); return }
    setValidationError(null)
    if (draft === currentValue) { setEditing(false); return }
    setSaving(true)
    try { await onSave(draft); setCurrentValue(draft); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500) }
    catch { setDraft(currentValue); alert('Failed to save. Please try again.') }
    finally { setSaving(false); setEditing(false) }
  }

  if (!editing) return <button className={`editable-display${savedFlash ? ' saved' : ''}`} onClick={() => { setDraft(currentValue); setEditing(true) }} title={label ? `Click to edit ${label}` : 'Click to edit'}>{currentValue || <em>(empty)</em>}<span className="edit-hint" aria-hidden="true">✎</span>{savedFlash && <small className="saved-label">Saved</small>}</button>

  const Field = multiline ? 'textarea' : 'input'
  return <span className="editable-editor"><Field autoFocus value={draft} onChange={(event) => { setDraft(event.target.value); if (validationError) setValidationError(null) }} onBlur={handleSave} onKeyDown={(event) => { if (event.key === 'Enter' && !multiline) handleSave(); if (event.key === 'Escape') { setDraft(currentValue); setValidationError(null); setEditing(false) } }} disabled={saving} rows={multiline ? 4 : undefined} aria-label={label} />{validationError && <small className="field-error">{validationError}</small>}</span>
}
