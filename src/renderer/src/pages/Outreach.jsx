import { useState, useMemo } from 'react'
import { useOutreach, useContacts } from '../hooks/useOrbit'
import { emitDataChange } from '../hooks/useOrbit'
import { formatDate, daysSince, channelLabel, channelBadgeClass } from '../utils.jsx'
import './Outreach.css'

function outreachStatusBadge(status) {
  if (!status) return null
  const map = {
    sent:      { label: 'Awaiting reply', cls: 'badge-yellow' },
    connected: { label: 'Connected',      cls: 'badge-green'  },
    declined:  { label: 'Declined',       cls: 'badge-red'    },
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge-purple' }
  return <span className={`badge ${cls}`}>{label}</span>
}

function avatarClass(status) {
  if (status === 'connected') return ' avatar-connected'
  if (status === 'sent') return ' avatar-pending'
  if (status === 'declined') return ' avatar-declined'
  return ''
}

function ConnectModal({ outreach, onConfirm, onCancel }) {
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

function AddOutreachModal({ contacts, onSave, onCancel }) {
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

function EditOutreachModal({ item, onSave, onCancel }) {
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

function OutreachCard({ item, onConnect, onDecline, onEdit, onDelete }) {
  const days = daysSince(item.sent_date)
  const isUrgent = days > 14

  return (
    <div className={`outreach-card${isUrgent ? ' urgent' : ''}`}>
      <div className="outreach-card-header">
        <div className={`outreach-avatar${avatarClass(item.status)}`}>{item.first_name[0]}{item.last_name[0]}</div>
        <div className="outreach-card-info">
          <div className="outreach-contact-name">{item.first_name} {item.last_name}</div>
          <div className="outreach-company">{item.company || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {outreachStatusBadge(item.status)}
          <span className={`badge ${channelBadgeClass(item.channel)}`}>{channelLabel(item.channel)}</span>
        </div>
      </div>
      <div className="outreach-meta">
        <span className="outreach-date">{formatDate(item.sent_date)}</span>
        <span className={`outreach-days${isUrgent ? ' urgent' : ''}`}>{days}d ago</span>
      </div>
      {item.notes && <p className="outreach-notes">{item.notes}</p>}
      <div className="outreach-card-actions">
        {onConnect && (
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => onConnect(item)}>
            Mark Connected
          </button>
        )}
        {onConnect && (
          <button className="btn-ghost" onClick={() => onDecline(item.id)}>
            Decline
          </button>
        )}
        <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => onEdit(item)}>
          Edit
        </button>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => onDelete(item.id)}>
          ✕
        </button>
      </div>
      {item.status === 'connected' && item.meeting_datetime && (
        <div className="outreach-meeting">
          <span className="meeting-icon">📅</span>
          <div>
            <div className="meeting-time">{formatDate(item.meeting_datetime)}</div>
            {item.meeting_topic && <div className="meeting-topic">{item.meeting_topic}</div>}
            {item.meeting_location && <div className="meeting-location">{item.meeting_location}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Outreach() {
  const { data: outreach, loading, reload } = useOutreach()
  const { data: contacts } = useContacts()
  const [connectTarget, setConnectTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const pending = useMemo(() => outreach?.filter(o => o.status === 'sent') || [], [outreach])
  const connected = useMemo(() => outreach?.filter(o => o.status === 'connected') || [], [outreach])
  const declined = useMemo(() => outreach?.filter(o => o.status === 'declined') || [], [outreach])

  const handleConnect = async (meetingData) => {
    await window.orbit.updateOutreachStatus(connectTarget.id, 'connected', meetingData)

    // Auto-log meeting interaction
    await window.orbit.addInteraction({
      contact_id: connectTarget.contact_id,
      type: 'meeting',
      date: meetingData.meeting_datetime.split('T')[0],
      notes: meetingData.meeting_topic || ''
    })

    // Try to create GCal event if connected
    const settings = await window.orbit.getSettings()
    if (settings.gcal_enabled === 'true') {
      const contact = contacts?.find(c => c.id === connectTarget.contact_id)
      if (contact) {
        try {
          const durationMin = parseInt(meetingData.meeting_duration) || 30
          const start = new Date(meetingData.meeting_datetime)
          const end = new Date(start.getTime() + durationMin * 60000)
          await window.orbit.createCalendarEvent({
            summary: `Meeting with ${contact.first_name} ${contact.last_name}${contact.company ? ` (${contact.company})` : ''}`,
            description: meetingData.meeting_topic || '',
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            location: meetingData.meeting_location || ''
          })
        } catch (err) {
          console.warn('GCal event creation failed:', err)
        }
      }
    }

    setConnectTarget(null)
    reload()
    emitDataChange('outreach-changed')
  }

  const handleDecline = async (id) => {
    if (!confirm('Mark this outreach as declined?')) return
    await window.orbit.updateOutreachStatus(id, 'declined')
    reload()
    emitDataChange('outreach-changed')
  }

  const handleAdd = async (data) => {
    await window.orbit.addOutreach(data)
    setShowAdd(false)
    reload()
    emitDataChange('outreach-changed')
  }

  const handleEdit = async (id, data) => {
    await window.orbit.updateOutreach(id, data)
    setEditTarget(null)
    reload()
    emitDataChange('outreach-changed')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this outreach entry?')) return
    await window.orbit.deleteOutreach(id)
    reload()
    emitDataChange('outreach-changed')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Outreach</div>
          <div className="page-subtitle">{pending.length} pending · {connected.length} connected</div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Log Outreach</button>
      </div>

      {loading ? (
        <div className="loading-text">Loading…</div>
      ) : (
        <div className="outreach-columns">
          <div className="outreach-column">
            <div className="column-header">
              <span className="column-title">Pending</span>
              <span className="column-count">{pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">↗</div>
                <div className="empty-state-title">No pending outreach</div>
              </div>
            ) : (
              pending.map(item => (
                <OutreachCard
                  key={item.id}
                  item={item}
                  onConnect={setConnectTarget}
                  onDecline={handleDecline}
                  onEdit={setEditTarget}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          <div className="outreach-column">
            <div className="column-header">
              <span className="column-title">Connected</span>
              <span className="column-count badge-green" style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '1px 8px', borderRadius: 100, fontSize: 11 }}>
                {connected.length}
              </span>
            </div>
            {connected.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">✓</div>
                <div className="empty-state-title">No meetings yet</div>
              </div>
            ) : (
              connected.map(item => (
                <OutreachCard key={item.id} item={item} onEdit={setEditTarget} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>
      )}

      {declined.length > 0 && (
        <div className="declined-section">
          <div className="section-title" style={{ marginBottom: 12 }}>
            Declined / No Response ({declined.length})
          </div>
          <div className="declined-list">
            {declined.map(item => (
              <div key={item.id} className="declined-item">
                <span>{item.first_name} {item.last_name}</span>
                <span className="text-muted">{item.company}</span>
                <span className={`badge ${channelBadgeClass(item.channel)}`}>{channelLabel(item.channel)}</span>
                <span className="text-muted">{formatDate(item.sent_date)}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setEditTarget(item)}>Edit</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => handleDelete(item.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {connectTarget && (
        <ConnectModal
          outreach={connectTarget}
          onConfirm={handleConnect}
          onCancel={() => setConnectTarget(null)}
        />
      )}

      {showAdd && (
        <AddOutreachModal
          contacts={contacts}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {editTarget && (
        <EditOutreachModal
          item={editTarget}
          onSave={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
