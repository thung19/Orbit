import { useState } from 'react'
import { formatDate, daysSince, intentLabel, intentBadgeClass, eventTypeLabel, channelLabel } from '../utils.jsx'
import AddEventModal from './AddEventModal'

function EventDot({ event }) {
  const cls = event.type === 'meeting' ? 'dot-meeting'
    : event.direction === 'inbound'   ? 'dot-inbound'
    : 'dot-outbound'
  const tip = [
    eventTypeLabel(event.type),
    event.direction,
    event.channel ? channelLabel(event.channel) : null,
    formatDate(event.date)
  ].filter(Boolean).join(' · ')
  return <div className={`event-dot ${cls}`} title={tip} />
}

export default function ThreadCard({ thread, onUpdate, onDelete }) {
  const [showAddEvent, setShowAddEvent] = useState(false)

  const events       = thread.events || []
  const lastEvent    = events[events.length - 1]
  const age          = lastEvent ? daysSince(lastEvent.date) : null
  const isUrgent     = age !== null && age > 14 && thread.status === 'open'

  const handleStatus = async (status) => {
    await window.orbit.updateThread(thread.id, { status })
    onUpdate()
  }

  const handleAddEvent = async (data) => {
    await window.orbit.addEvent(data)
    setShowAddEvent(false)
    onUpdate()
  }

  const handleDelete = () => {
    if (!confirm(`Delete thread with ${thread.first_name} ${thread.last_name}?`)) return
    onDelete(thread.id)
  }

  return (
    <div className={`thread-card${isUrgent ? ' urgent' : ''}`}>
      {/* Top row */}
      <div className="thread-card-top">
        <div className={`thread-avatar avatar-${thread.status}`}>
          {thread.first_name[0]}{thread.last_name[0]}
        </div>
        <div className="thread-info">
          <div className="thread-contact-name">{thread.first_name} {thread.last_name}</div>
          {thread.company && <div className="thread-company">{thread.company}</div>}
        </div>
        <div className="thread-card-secondary">
          <button className="btn-icon" onClick={() => setShowAddEvent(true)} title="Add event">+</button>
          <button className="btn-icon btn-icon-danger" onClick={handleDelete} title="Delete">✕</button>
        </div>
      </div>

      {/* Intent + initiated-by */}
      <div className="thread-meta">
        <span className={`badge ${intentBadgeClass(thread.intent)}`}>{intentLabel(thread.intent)}</span>
        {thread.initiated_by === 'them' && (
          <span className="thread-initiated-tag">← inbound</span>
        )}
      </div>

      {/* Event timeline dots */}
      {events.length > 0 && (
        <div className="thread-timeline-dots">
          {events.slice(-8).map(e => <EventDot key={e.id} event={e} />)}
          {events.length > 8 && (
            <span className="event-dots-overflow">+{events.length - 8}</span>
          )}
        </div>
      )}

      {/* Context */}
      {thread.context && <p className="thread-context">{thread.context}</p>}

      {/* Footer */}
      <div className="thread-footer">
        <span className={`thread-last-touch${isUrgent ? ' urgent' : ''}`}>
          {age !== null ? `${age}d ago` : 'no events yet'}
        </span>
        <div className="thread-footer-actions">
          {thread.status === 'open' ? (
            <button className="thread-action-btn btn-dark" onClick={() => handleStatus('closed')}>
              Close
            </button>
          ) : (
            <button className="thread-action-btn btn-reopen" onClick={() => handleStatus('open')}>
              Re-open
            </button>
          )}
        </div>
      </div>

      {showAddEvent && (
        <AddEventModal
          thread={thread}
          onSave={handleAddEvent}
          onCancel={() => setShowAddEvent(false)}
        />
      )}
    </div>
  )
}
