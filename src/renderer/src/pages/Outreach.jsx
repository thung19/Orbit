import { useState, useMemo } from 'react'
import { useThreads, useContacts, emitDataChange } from '../hooks/useOrbit'
import { daysSince, formatDateShort, intentLabel, intentBadgeClass, eventTypeLabel, channelLabel } from '../utils.jsx'
import NewThreadModal from '../components/NewThreadModal'
import ThreadDetailModal from '../components/ThreadDetailModal'
import AddEventModal from '../components/AddEventModal'
import EditEventModal from '../components/EditEventModal'
import './Outreach.css'

export default function Outreach() {
  const { data: threads, loading, reload } = useThreads()
  const { data: contacts } = useContacts()

  const [search,         setSearch]         = useState('')
  const [filterStatus,   setFilterStatus]   = useState('open')
  const [filterIntent,   setFilterIntent]   = useState('')
  const [filterCompany,  setFilterCompany]  = useState('')
  const [showNew,        setShowNew]        = useState(false)
  const [detailThread,   setDetailThread]   = useState(null)
  const [addEventThread, setAddEventThread] = useState(null)
  const [editEventTarget, setEditEventTarget] = useState(null) // { event, thread }

  const companies = useMemo(() => {
    if (!threads) return []
    return [...new Set(threads.map(t => t.company).filter(Boolean))].sort()
  }, [threads])

  const filtered = useMemo(() => {
    if (!threads) return []
    let rows = [...threads]
    if (filterStatus)  rows = rows.filter(t => t.status === filterStatus)
    if (filterIntent)  rows = rows.filter(t => t.intent === filterIntent)
    if (filterCompany) rows = rows.filter(t => t.company === filterCompany)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(t =>
        `${t.first_name} ${t.last_name} ${t.company || ''}`.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => {
      const aLast = a.events?.at(-1)?.date || a.created_at
      const bLast = b.events?.at(-1)?.date || b.created_at
      return bLast.localeCompare(aLast)
    })
    return rows
  }, [threads, filterStatus, filterIntent, filterCompany, search])

  const openCount   = useMemo(() => threads?.filter(t => t.status === 'open').length   || 0, [threads])
  const closedCount = useMemo(() => threads?.filter(t => t.status === 'closed').length || 0, [threads])
  const activeFilters = [filterIntent, filterCompany, search].filter(Boolean).length

  const handleUpdate = () => {
    reload()
    emitDataChange('threads-changed')
    setDetailThread(null)
  }

  const handleNew = () => { setShowNew(false); reload(); emitDataChange('threads-changed') }

  const handleAddEvent = async (data) => {
    await window.orbit.addEvent(data)
    setAddEventThread(null)
    reload()
    emitDataChange('threads-changed')
  }

  const handleSaveEvent = async (id, data) => {
    await window.orbit.updateEvent(id, data)
    setEditEventTarget(null)
    reload()
    emitDataChange('threads-changed')
  }

  const handleDeleteEvent = async (id) => {
    await window.orbit.deleteEvent(id)
    setEditEventTarget(null)
    reload()
    emitDataChange('threads-changed')
  }

  const handleDeleteThread = async (id) => {
    if (!confirm('Delete this thread and all its events?')) return
    await window.orbit.deleteThread(id)
    reload()
    emitDataChange('threads-changed')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Outreach</div>
          <div className="page-subtitle">{openCount} open · {closedCount} closed</div>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>+ New Thread</button>
      </div>

      {/* Filters */}
      <div className="outreach-filters">
        <input
          className="search-input"
          placeholder="Search name or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="status-tab-group">
          {[['open', 'Open'], ['closed', 'Closed'], ['', 'All']].map(([val, label]) => (
            <button
              key={val}
              className={`status-tab${filterStatus === val ? ' active' : ''}`}
              onClick={() => setFilterStatus(val)}
            >
              {label}
            </button>
          ))}
        </div>
        <select className="col-filter-select" value={filterIntent} onChange={e => setFilterIntent(e.target.value)}>
          <option value="">All intents</option>
          <option value="networking_call">Networking Call</option>
          <option value="advice">Advice / Mentorship</option>
          <option value="referral">Referral</option>
          <option value="opportunity">Job Opportunity</option>
          <option value="maintenance">Relationship Check-in</option>
          <option value="other">Other</option>
        </select>
        {companies.length > 0 && (
          <select className="col-filter-select" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
            <option value="">All companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {activeFilters > 0 && (
          <button className="btn-ghost clear-filters" onClick={() => { setSearch(''); setFilterIntent(''); setFilterCompany('') }}>
            Clear {activeFilters} ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-text">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">↗</div>
          <div className="empty-state-title">
            {threads?.length === 0 ? 'No threads yet' : 'No matches'}
          </div>
          <p>{threads?.length === 0
            ? 'Start a thread to track an outreach campaign.'
            : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="thread-card-list">
          {filtered.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onOpen={() => setDetailThread(thread)}
              onAddEvent={() => setAddEventThread(thread)}
              onEditEvent={(ev) => setEditEventTarget({ event: ev, thread })}
              onDelete={() => handleDeleteThread(thread.id)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <NewThreadModal contacts={contacts} onSave={handleNew} onCancel={() => setShowNew(false)} />
      )}
      {detailThread && (
        <ThreadDetailModal
          thread={detailThread}
          onClose={() => setDetailThread(null)}
          onUpdate={handleUpdate}
          onAddEvent={(t) => { setDetailThread(null); setAddEventThread(t) }}
        />
      )}
      {addEventThread && (
        <AddEventModal thread={addEventThread} onSave={handleAddEvent} onCancel={() => setAddEventThread(null)} />
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

function ThreadCard({ thread, onOpen, onAddEvent, onEditEvent, onDelete }) {
  const events   = thread.events || []
  const lastEvent = events.at(-1)
  const age      = lastEvent ? daysSince(lastEvent.date) : null
  const isUrgent = age !== null && age > 14 && thread.status === 'open'

  return (
    <div className={`ot-card${thread.status === 'closed' ? ' closed' : ''}${isUrgent ? ' urgent' : ''}`}>

      {/* ── Header: avatar + contact + badges + actions ── */}
      <div className="ot-card-header" onClick={onOpen}>
        <div className={`ot-avatar avatar-${thread.status}`}>
          {thread.first_name[0]}{thread.last_name[0]}
        </div>
        <div className="ot-contact">
          <div className="ot-name">{thread.first_name} {thread.last_name}</div>
          {thread.company && <div className="ot-company">{thread.company}</div>}
        </div>
        <div className="ot-badges">
          <span className={`badge ${intentBadgeClass(thread.intent)}`}>{intentLabel(thread.intent)}</span>
          {thread.initiated_by === 'them' && <span className="thread-initiated-tag">← inbound</span>}
          <span className={`badge ${thread.status === 'closed' ? 'badge-red' : 'badge-green'}`}>
            {thread.status === 'closed' ? 'Closed' : 'Open'}
          </span>
        </div>
        <div className="ot-header-actions" onClick={e => e.stopPropagation()}>
          <button className="ot-add-btn" onClick={onAddEvent} title="Add event">+ Add</button>
        </div>
      </div>

      {/* ── Context note ── */}
      {thread.context && <p className="ot-context">{thread.context}</p>}

      {/* ── Event rows ── */}
      {events.length > 0 ? (
        <div className="ot-events">
          {events.map(e => {
            const dotCls = e.type === 'meeting' ? 'dot-meeting'
              : e.direction === 'inbound' ? 'dot-inbound' : 'dot-outbound'
            return (
              <button
                key={e.id}
                className="ot-event-row"
                onClick={() => onEditEvent(e)}
                type="button"
              >
                <div className={`event-dot ${dotCls}`} />
                <span className="ot-event-type">{eventTypeLabel(e.type)}</span>
                {e.channel && <span className="ot-event-channel"> · {channelLabel(e.channel)}</span>}
                {e.direction === 'inbound'
                  ? <span className="ot-event-dir inbound">← received</span>
                  : <span className="ot-event-dir outbound">→ sent</span>
                }
                <span className="ot-event-date">{formatDateShort(e.date)}</span>
                {e.notes && <span className="ot-event-notes">{e.notes}</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="ot-no-events">No events logged yet</div>
      )}

      {/* ── Footer: age + delete ── */}
      <div className="ot-footer">
        <span className={`ot-age${isUrgent ? ' urgent' : ''}`}>
          {age !== null ? `Last activity ${age}d ago` : 'No activity yet'}
        </span>
        <button className="ot-delete-btn" onClick={e => { e.stopPropagation(); onDelete() }} title="Delete thread">
          Delete
        </button>
      </div>
    </div>
  )
}
