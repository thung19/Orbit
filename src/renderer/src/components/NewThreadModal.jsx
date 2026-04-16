import { useState } from 'react'

const INTENTS = [
  { id: 'networking_call', label: 'Networking Call' },
  { id: 'advice',          label: 'Advice / Mentorship' },
  { id: 'referral',        label: 'Referral' },
  { id: 'opportunity',     label: 'Job Opportunity' },
  { id: 'maintenance',     label: 'Relationship Check-in' },
  { id: 'other',           label: 'Other' },
]

const CHANNELS = [
  { value: 'email',      label: 'Email' },
  { value: 'linkedin',   label: 'LinkedIn' },
  { value: 'phone',      label: 'Phone' },
  { value: 'in_person',  label: 'In Person' },
  { value: 'other',      label: 'Other' },
]

export default function NewThreadModal({ contacts, prefilledContact, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0]

  const [contactId,    setContactId]    = useState(prefilledContact?.id ? String(prefilledContact.id) : '')
  const [intent,       setIntent]       = useState('networking_call')
  const [initiatedBy,  setInitiatedBy]  = useState('me')
  const [context,      setContext]      = useState('')

  const [hasFirstEvent, setHasFirstEvent] = useState(true)
  const [evType,        setEvType]        = useState('message')
  const [evDirection,   setEvDirection]   = useState('outbound')
  const [evChannel,     setEvChannel]     = useState('email')
  const [evDate,        setEvDate]        = useState(today)
  const [evNotes,       setEvNotes]       = useState('')

  const handleSave = async () => {
    const cid = parseInt(contactId)
    if (!cid) return
    const thread = await window.orbit.addThread({
      contact_id: cid,
      intent,
      initiated_by: initiatedBy,
      context: context.trim() || null
    })
    if (hasFirstEvent) {
      await window.orbit.addEvent({
        thread_id:  thread.id,
        contact_id: cid,
        type:       evType,
        direction:  evDirection,
        channel:    evChannel,
        date:       evDate,
        notes:      evNotes.trim() || null
      })
    }
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">New Thread</div>

        {prefilledContact ? (
          <div className="form-field">
            <label>Contact</label>
            <div className="prefilled-contact-display">
              {prefilledContact.first_name} {prefilledContact.last_name}
              {prefilledContact.company && <span className="text-muted"> · {prefilledContact.company}</span>}
            </div>
          </div>
        ) : (
          <div className="form-field">
            <label>Contact *</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)}>
              <option value="">Select contact…</option>
              {contacts?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}{c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
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
            placeholder="What are you hoping for with this thread?"
          />
        </div>

        <div className="form-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hasFirstEvent}
              onChange={e => setHasFirstEvent(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            Log first touchpoint now
          </label>
        </div>

        {hasFirstEvent && (
          <>
            <div className="form-row">
              <div className="form-field">
                <label>Type</label>
                <select value={evType} onChange={e => setEvType(e.target.value)}>
                  <option value="message">Message / Email</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div className="form-field">
                <label>Direction</label>
                <select value={evDirection} onChange={e => setEvDirection(e.target.value)}>
                  <option value="outbound">Outbound (I sent)</option>
                  <option value="inbound">Inbound (They sent)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Channel</label>
                <select value={evChannel} onChange={e => setEvChannel(e.target.value)}>
                  {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Date</label>
                <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} />
              </div>
            </div>

            <div className="form-field">
              <label>Notes</label>
              <textarea
                rows={2}
                value={evNotes}
                onChange={e => setEvNotes(e.target.value)}
                placeholder="Any details…"
              />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!contactId}
          >
            Start Thread
          </button>
        </div>
      </div>
    </div>
  )
}
