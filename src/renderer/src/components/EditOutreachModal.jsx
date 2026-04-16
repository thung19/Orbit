import { useState } from 'react'

export default function EditOutreachModal({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    channel: item.channel,
    sent_date: item.sent_date?.split('T')[0] || '',
    status: item.status || 'sent',
    notes: item.notes || '',
    meeting_datetime: item.meeting_datetime || '',
    meeting_duration: item.meeting_duration || '30 min',
    meeting_location: item.meeting_location || '',
    meeting_topic: item.meeting_topic || ''
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Edit Outreach — {item.first_name} {item.last_name}</div>
        <div className="form-field">
          <label>Status</label>
          <div className="status-picker">
            {[
              { value: 'sent', label: 'Awaiting Reply', cls: 'status-opt-yellow' },
              { value: 'connected', label: 'Connected', cls: 'status-opt-green' },
              { value: 'declined', label: 'Declined', cls: 'status-opt-red' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`status-opt ${opt.cls}${form.status === opt.value ? ' active' : ''}`}
                onClick={() => setForm(f => ({ ...f, status: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
          <textarea rows={3} value={form.notes} onChange={set('notes')} />
        </div>
        {form.status === 'connected' && (
          <>
            <div className="form-field">
              <label>Meeting Date & Time</label>
              <input type="datetime-local" value={form.meeting_datetime} onChange={set('meeting_datetime')} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Duration</label>
                <select value={form.meeting_duration} onChange={set('meeting_duration')}>
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="60 min">60 min</option>
                  <option value="90 min">90 min</option>
                </select>
              </div>
              <div className="form-field">
                <label>Location / Link</label>
                <input value={form.meeting_location} onChange={set('meeting_location')} />
              </div>
            </div>
            <div className="form-field">
              <label>Topic</label>
              <input value={form.meeting_topic} onChange={set('meeting_topic')} />
            </div>
          </>
        )}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(item.id, form)}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
