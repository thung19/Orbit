import { useState } from 'react'

export default function LogInteractionModal({ contact, onSave, onCancel }) {
  const [form, setForm] = useState({ type: 'meeting', date: new Date().toISOString().split('T')[0], notes: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Log Interaction — {contact.first_name} {contact.last_name}</div>
        <div className="form-field">
          <label>Type</label>
          <select value={form.type} onChange={set('type')}>
            <option value="meeting">Meeting</option>
            <option value="email_reply">Email Reply</option>
            <option value="linkedin_reply">LinkedIn Reply</option>
            <option value="call">Call</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={set('date')} />
        </div>
        <div className="form-field">
          <label>Notes</label>
          <textarea rows={3} value={form.notes} onChange={set('notes')} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ ...form, contact_id: contact.id })}>
            Log Interaction
          </button>
        </div>
      </div>
    </div>
  )
}
