import { useState } from 'react'

export default function AddOutreachModal({ contacts, onSave, onCancel }) {
  const [form, setForm] = useState({
    contact_id: '',
    channel: 'linkedin',
    sent_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Log Outreach</div>
        <div className="form-field">
          <label>Contact *</label>
          <select value={form.contact_id} onChange={set('contact_id')} required>
            <option value="">Select contact…</option>
            {contacts?.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.company ? `— ${c.company}` : ''}</option>
            ))}
          </select>
        </div>
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
          <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="What did you say?" />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!form.contact_id}
            onClick={() => onSave({ ...form, contact_id: parseInt(form.contact_id), status: 'sent' })}
          >
            Log Outreach
          </button>
        </div>
      </div>
    </div>
  )
}
