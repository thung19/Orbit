import { useState } from 'react'

export default function ConnectModal({ outreach, onConfirm, onCancel }) {
  const [form, setForm] = useState({
    meeting_datetime: '',
    meeting_duration: '30 min',
    meeting_location: '',
    meeting_topic: ''
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Mark as Connected — {outreach.first_name} {outreach.last_name}
        </div>
        <div className="form-field">
          <label>Meeting Date & Time *</label>
          <input type="datetime-local" value={form.meeting_datetime} onChange={set('meeting_datetime')} required />
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
            <input value={form.meeting_location} onChange={set('meeting_location')} placeholder="Zoom, coffee shop…" />
          </div>
        </div>
        <div className="form-field">
          <label>Topic</label>
          <input value={form.meeting_topic} onChange={set('meeting_topic')} placeholder="What will you discuss?" />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!form.meeting_datetime}
            onClick={() => onConfirm(form)}
          >
            Confirm Meeting
          </button>
        </div>
      </div>
    </div>
  )
}
