import { useState } from 'react'
import { formatDate, intentLabel, intentBadgeClass, eventTypeLabel, channelLabel } from '../utils.jsx'

const INTENTS = [
  { id: 'networking_call', label: 'Networking Call' },
  { id: 'advice',          label: 'Advice / Mentorship' },
  { id: 'referral',        label: 'Referral' },
  { id: 'opportunity',     label: 'Job Opportunity' },
  { id: 'maintenance',     label: 'Relationship Check-in' },
  { id: 'other',           label: 'Other' },
]

export default function ThreadDetailModal({ thread, onClose, onUpdate, onAddEvent }) {
  const [intent,      setIntent]      = useState(thread.intent)
  const [initiatedBy, setInitiatedBy] = useState(thread.initiated_by)
  const [context,     setContext]     = useState(thread.context || '')
  const [saving,      setSaving]      = useState(false)

  const isDirty = intent !== thread.intent
    || initiatedBy !== thread.initiated_by
    || context.trim() !== (thread.context || '')

  const handleSave = async () => {
    setSaving(true)
    await window.orbit.updateThread(thread.id, {
      intent,
      initiated_by: initiatedBy,
      context: context.trim() || null
    })
    setSaving(false)
    onUpdate()
    onClose()
  }

  const handleToggleStatus = async () => {
    const newStatus = thread.status === 'closed' ? 'open' : 'closed'
    await window.orbit.updateThread(thread.id, { status: newStatus })
    onUpdate()
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete this thread with ${thread.first_name} ${thread.last_name}? All events will be lost.`)) return
    await window.orbit.deleteThread(thread.id)
    onUpdate()
    onClose()
  }

  const events = thread.events || []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal thread-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="thread-detail-header">
          <div className="thread-detail-avatar">
            {thread.first_name[0]}{thread.last_name[0]}
          </div>
          <div className="thread-detail-contact">
            <div className="thread-detail-name">{thread.first_name} {thread.last_name}</div>
            {thread.company && <div className="thread-detail-company">{thread.company}</div>}
          </div>
          <span className={`badge ${thread.status === 'closed' ? 'badge-red' : 'badge-green'}`}>
            {thread.status === 'closed' ? 'Closed' : 'Open'}
          </span>
          <button className="btn-ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>✕</button>
        </div>

        {/* Edit fields */}
        <div className="form-field" style={{ marginTop: 20 }}>
          <label>Intent</label>
          <div className="activity-type-grid">
            {INTENTS.map(t => (
              <button
                key={t.id}
                type="button"
                className={`activity-type-pill${intent === t.id ? ' active' : ''}`}
                onClick={() => setIntent(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Who initiated?</label>
          <div className="activity-type-grid">
            <button
              type="button"
              className={`activity-type-pill${initiatedBy === 'me' ? ' active' : ''}`}
              onClick={() => setInitiatedBy('me')}
            >
              I reached out
            </button>
            <button
              type="button"
              className={`activity-type-pill${initiatedBy === 'them' ? ' active' : ''}`}
              onClick={() => setInitiatedBy('them')}
            >
              They reached out
            </button>
          </div>
        </div>

        <div className="form-field">
          <label>Context <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
          <textarea
            rows={2}
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Goal or notes for this thread…"
          />
        </div>

        {/* Events */}
        <div className="thread-detail-events-section">
          <div className="thread-detail-events-header">
            <span className="section-title" style={{ margin: 0 }}>Events ({events.length})</span>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onAddEvent(thread)}>
              + Add Event
            </button>
          </div>

          {events.length === 0 ? (
            <p className="detail-empty">No events logged yet.</p>
          ) : (
            <div className="thread-detail-timeline">
              {events.map(e => (
                <div key={e.id} className="thread-detail-event-row">
                  <div className={`event-dot ${
                    e.type === 'meeting' ? 'dot-meeting'
                    : e.direction === 'inbound' ? 'dot-inbound'
                    : 'dot-outbound'
                  }`} style={{ marginTop: 3 }} />
                  <div className="thread-detail-event-body">
                    <div className="thread-detail-event-meta">
                      <span className="thread-detail-event-type">{eventTypeLabel(e.type)}</span>
                      {e.channel && <span className="thread-detail-event-channel">· {channelLabel(e.channel)}</span>}
                      <span className="thread-detail-event-dir">{e.direction === 'inbound' ? '←' : '→'}</span>
                      <span className="thread-detail-event-date">{formatDate(e.date)}</span>
                    </div>
                    {e.meeting_topic    && <div className="thread-detail-event-detail">{e.meeting_topic}</div>}
                    {e.meeting_location && <div className="thread-detail-event-detail">{e.meeting_location}</div>}
                    {e.notes            && <p className="timeline-notes">{e.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button className="btn-danger" onClick={handleDelete} style={{ marginRight: 'auto' }}>
            Delete
          </button>
          <button
            className={`btn-secondary ${thread.status === 'closed' ? '' : 'btn-ghost'}`}
            onClick={handleToggleStatus}
          >
            {thread.status === 'closed' ? 'Re-open' : 'Close Thread'}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
