import { useState } from 'react'
import { useData, emitDataChange } from '../hooks/useOrbit'
import { formatDate, daysSince, intentLabel, intentBadgeClass, threadStatusLabel, threadStatusBadgeClass, eventTypeLabel, channelLabel } from '../utils.jsx'
import NewThreadModal from './NewThreadModal'
import ThreadDetailModal from './ThreadDetailModal'
import AddEventModal from './AddEventModal'
import EditEventModal from './EditEventModal'

export default function ContactDetail({ contact, onClose, onEdit, onRefresh }) {
  const { data: threads, reload: reloadThreads } = useData(
    () => window.orbit.getThreadsByContact(contact.id),
    [contact.id]
  )

  const [showNewThread,   setShowNewThread]   = useState(false)
  const [editThread,      setEditThread]      = useState(null)  // ThreadDetailModal
  const [addEventTarget,  setAddEventTarget]  = useState(null)  // AddEventModal
  const [editEventTarget, setEditEventTarget] = useState(null)  // EditEventModal {event, thread}

  const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  const refresh = () => {
    reloadThreads()
    emitDataChange('threads-changed')
    onRefresh()
  }

  const handleNewThread = () => { setShowNewThread(false); refresh() }

  const handleThreadUpdate = () => { setEditThread(null); refresh() }

  const handleAddEvent = async (data) => {
    await window.orbit.addEvent(data)
    setAddEventTarget(null)
    refresh()
  }

  const handleSaveEvent = async (id, data) => {
    await window.orbit.updateEvent(id, data)
    setEditEventTarget(null)
    refresh()
  }

  const handleDeleteEvent = async (id) => {
    await window.orbit.deleteEvent(id)
    setEditEventTarget(null)
    refresh()
  }

  const handleStatusChange = async (threadId, newStatus) => {
    await window.orbit.updateThread(threadId, { status: newStatus })
    refresh()
  }

  return (
    <div className="contact-detail">
      {/* ── Header ── */}
      <div className="detail-header">
        <div className="detail-avatar">{contact.first_name[0]}{contact.last_name[0]}</div>
        <div className="detail-name-block">
          <div className="detail-name">{contact.first_name} {contact.last_name}</div>
          <div className="detail-role">{[contact.role, contact.company].filter(Boolean).join(' @ ')}</div>
          {contact.email && <div className="detail-location">{contact.email}</div>}
          {contact.phone && <div className="detail-location">{contact.phone}</div>}
          {contact.city  && <div className="detail-location">{[contact.city, contact.country].filter(Boolean).join(', ')}</div>}
        </div>
        <button className="btn-ghost" onClick={onClose}>✕</button>
      </div>

      {tags.length > 0 && (
        <div className="detail-tags">
          {tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      )}

      {contact.referral_status && (
        <div className="detail-referral">
          <span className={`referral-badge referral-${contact.referral_status}`}>
            {contact.referral_status === 'asked'    ? 'Asked for referral'
           : contact.referral_status === 'received' ? 'Got a referral'
           : 'Asked & received referral'}
          </span>
        </div>
      )}

      <div className="detail-actions">
        <button className="btn-secondary" onClick={() => setShowNewThread(true)}>+ New Thread</button>
        <button className="btn-secondary" onClick={() => onEdit(contact)}>Edit Contact</button>
      </div>

      {contact.notes && (
        <div className="detail-section">
          <div className="detail-section-title">Notes</div>
          <p className="detail-notes">{contact.notes}</p>
        </div>
      )}

      {/* ── Threads ── */}
      <div className="detail-section">
        <div className="detail-section-title">Threads ({threads?.length || 0})</div>
        {threads?.length > 0 ? (
          <div className="detail-threads">
            {threads.map(thread => (
              <ThreadBlock
                key={thread.id}
                thread={thread}
                onEditThread={() => setEditThread(thread)}
                onAddEvent={() => setAddEventTarget(thread)}
                onEditEvent={(ev) => setEditEventTarget({ event: ev, thread })}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <p className="detail-empty">No threads yet.</p>
        )}
      </div>

      {/* ── Modals ── */}
      {showNewThread && (
        <NewThreadModal
          prefilledContact={contact}
          onSave={handleNewThread}
          onCancel={() => setShowNewThread(false)}
        />
      )}

      {editThread && (
        <ThreadDetailModal
          thread={editThread}
          onClose={() => setEditThread(null)}
          onUpdate={handleThreadUpdate}
          onAddEvent={(t) => { setEditThread(null); setAddEventTarget(t) }}
        />
      )}

      {addEventTarget && (
        <AddEventModal
          thread={addEventTarget}
          onSave={handleAddEvent}
          onCancel={() => setAddEventTarget(null)}
        />
      )}

      {editEventTarget && (
        <EditEventModal
          event={editEventTarget.event}
          thread={editEventTarget.thread}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onCancel={() => setEditEventTarget(null)}
        />
      )}
    </div>
  )
}

function ThreadBlock({ thread, onEditThread, onAddEvent, onEditEvent, onStatusChange }) {
  const events = thread.events || []

  return (
    <div className={`detail-thread-card status-${thread.status}`}>
      {/* Header row */}
      <div className="detail-thread-header">
        <span className={`badge ${intentBadgeClass(thread.intent)}`}>
          {intentLabel(thread.intent)}
        </span>
        <span className={`badge ${threadStatusBadgeClass(thread.status)}`}>
          {threadStatusLabel(thread.status)}
        </span>
        {thread.initiated_by === 'them' && (
          <span className="thread-initiated-tag">← inbound</span>
        )}
        <div className="detail-thread-header-actions">
          <button className="btn-icon" onClick={onEditThread} title="Edit thread">✎</button>
          <button className="btn-icon" onClick={onAddEvent}   title="Add event">+</button>
        </div>
      </div>

      {thread.context && <p className="detail-thread-context">{thread.context}</p>}

      {/* Event list */}
      {events.length > 0 && (
        <div className="detail-thread-events">
          {events.map(e => (
            <button
              key={e.id}
              className="detail-thread-event"
              onClick={() => onEditEvent(e)}
              type="button"
            >
              <div className={`event-dot ${
                e.type === 'meeting'         ? 'dot-meeting'
                : e.direction === 'inbound' ? 'dot-inbound'
                : 'dot-outbound'
              }`} />
              <div className="detail-event-body">
                <span className="detail-event-type">{eventTypeLabel(e.type)}</span>
                {e.channel && (
                  <span className="detail-event-channel"> · {channelLabel(e.channel)}</span>
                )}
                <span className="detail-event-date">{formatDate(e.date)}</span>
                {e.notes && <p className="timeline-notes">{e.notes}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="detail-thread-footer">
        {thread.status === 'open' ? (
          <button
            className="thread-action-btn btn-dark"
            onClick={() => onStatusChange(thread.id, 'closed')}
          >
            Close Thread
          </button>
        ) : (
          <button
            className="thread-action-btn btn-reopen"
            onClick={() => onStatusChange(thread.id, 'open')}
          >
            Re-open
          </button>
        )}
      </div>
    </div>
  )
}
