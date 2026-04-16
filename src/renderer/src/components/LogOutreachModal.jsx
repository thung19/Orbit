import { useState } from 'react'

export default function LogOutreachModal({ contact, onSave, onCancel }) {
  const [form, setForm] = useState({
    channel: 'linkedin', sent_date: new Date().toISOString().split('T')[0],
    status: 'sent', notes: ''
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Log Outreach — {contact.first_name} {contact.last_name}</div>
        <div className="form-row">
          <div className="form-field">
            <label>Channel</label>
            <select value={form.channel} onChange={set('channel')}>
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="in_person">In Person</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Date Sent</label>
            <input type="date" value={form.sent_date} onChange={set('sent_date')} />
          </div>
        </div>
        <div className="form-field">
          <label>Notes</label>
          <textarea rows={3} value={form.notes} onChange={set('notes')} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ ...form, contact_id: contact.id })}>
            Log Outreach
          </button>
        </div>
      </div>
    </div>
  )
}
