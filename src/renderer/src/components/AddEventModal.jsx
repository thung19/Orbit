import { useState } from 'react'

const TYPES = [
  { id: 'message', label: 'Message' },
  { id: 'reply',   label: 'Reply' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'call',    label: 'Call' },
  { id: 'note',    label: 'Note' },
]

const CHANNELS = [
  { value: 'email',     label: 'Email' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'phone',     label: 'Phone' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other',     label: 'Other' },
]

export default function AddEventModal({ thread, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0]

  const [type,             setType]             = useState('reply')
  const [direction,        setDirection]        = useState('inbound')
  const [channel,          setChannel]          = useState('email')
  const [date,             setDate]             = useState(today)
  const [notes,            setNotes]            = useState('')
  const [meetingDatetime,  setMeetingDatetime]  = useState('')
  const [meetingLocation,  setMeetingLocation]  = useState('')
  const [meetingDuration,  setMeetingDuration]  = useState('30')
  const [meetingTopic,     setMeetingTopic]     = useState('')

  const handleSave = () => {
    const data = {
      thread_id:  thread.id,
      contact_id: thread.contact_id,
      type,
      direction,
      channel,
      date,
      notes: notes.trim() || null
    }
    if (type === 'meeting') {
      data.meeting_datetime = meetingDatetime || null
      data.meeting_location = meetingLocation.trim() || null
      data.meeting_duration = meetingDuration || null
      data.meeting_topic    = meetingTopic.trim() || null
    }
    onSave(data)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Add Event — {thread.first_name} {thread.last_name}
        </div>

        <div className="form-field">
          <label>What happened?</label>
          <div className="activity-type-grid">
            {TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                className={`activity-type-pill${type === t.id ? ' active' : ''}`}
                onClick={() => setType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Direction</label>
            <select value={direction} onChange={e => setDirection(e.target.value)}>
              <option value="outbound">Outbound (I initiated)</option>
              <option value="inbound">Inbound (They initiated)</option>
            </select>
          </div>
          <div className="form-field">
            <label>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)}>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {type === 'meeting' && (
          <>
            <div className="form-row">
              <div className="form-field">
                <label>Meeting date & time</label>
                <input
                  type="datetime-local"
                  value={meetingDatetime}
                  onChange={e => setMeetingDatetime(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Duration (min)</label>
                <input
                  type="number"
                  value={meetingDuration}
                  onChange={e => setMeetingDuration(e.target.value)}
                  min="5" max="480"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Topic</label>
                <input
                  type="text"
                  value={meetingTopic}
                  onChange={e => setMeetingTopic(e.target.value)}
                  placeholder="What's this meeting about?"
                />
              </div>
              <div className="form-field">
                <label>Location</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={e => setMeetingLocation(e.target.value)}
                  placeholder="Where?"
                />
              </div>
            </div>
          </>
        )}

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
          <button className="btn-primary" onClick={handleSave}>Save Event</button>
        </div>
      </div>
    </div>
  )
}
