import { useState } from 'react'

const TYPES = [
  { id: 'outreach',       label: 'Initial Outreach', isOutreach: true  },
  { id: 'meeting',        label: 'Meeting',           isOutreach: false },
  { id: 'follow_up',      label: 'Follow-up',         isOutreach: false },
  { id: 'call',           label: 'Call',              isOutreach: false },
  { id: 'email_reply',    label: 'Email Reply',       isOutreach: false },
  { id: 'linkedin_reply', label: 'LinkedIn Reply',    isOutreach: false },
  { id: 'other',          label: 'Other',             isOutreach: false },
]

export default function LogActivityModal({ contact, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0]
  const [activityId, setActivityId] = useState('meeting')
  const [channel, setChannel] = useState('linkedin')
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')

  const selected = TYPES.find(t => t.id === activityId)

  const handleSave = () => {
    if (selected.isOutreach) {
      onSave('outreach', {
        contact_id: contact.id,
        channel,
        sent_date: date,
        status: 'sent',
        notes
      })
    } else {
      onSave('interaction', {
        contact_id: contact.id,
        type: activityId,
        date,
        notes
      })
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Log Activity — {contact.first_name} {contact.last_name}
        </div>

        <div className="form-field">
          <label>What happened?</label>
          <div className="activity-type-grid">
            {TYPES.map(t => (
              <button
                key={t.id}
                className={`activity-type-pill${activityId === t.id ? ' active' : ''}`}
                onClick={() => setActivityId(t.id)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {selected.isOutreach && (
          <div className="form-field">
            <label>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)}>
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="in_person">In Person</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        <div className="form-field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="form-field">
          <label>Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any details worth noting…"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
