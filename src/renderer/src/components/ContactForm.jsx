import { useState } from 'react'
import SearchableSelect from './SearchableSelect'
import { COUNTRIES, US_STATES } from '../constants/countries'

const EMPTY_FORM = {
  first_name: '', last_name: '', company: '', role: '', department: '',
  email: '', phone: '', linkedin_url: '', city: '', country: '', state: '', how_met: '',
  referred_by_id: '', referral_status: '', notes: '', tags: ''
}

const EMPTY_OUTREACH = {
  channel: 'linkedin',
  sent_date: new Date().toISOString().split('T')[0],
  notes: ''
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function ContactForm({ initial, contacts, onSave, onCancel, isAdd = false }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [outreach, setOutreach] = useState(null) // null = hidden, object = enabled

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setO = (k) => (e) => setOutreach((o) => ({ ...o, [k]: e.target.value }))

  const handlePhoneChange = (e) => {
    setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    if (!data.referred_by_id) data.referred_by_id = null
    onSave(data, outreach || null)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-field">
          <label>First Name *</label>
          <input value={form.first_name} onChange={set('first_name')} required />
        </div>
        <div className="form-field">
          <label>Last Name *</label>
          <input value={form.last_name} onChange={set('last_name')} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Company</label>
          <input value={form.company} onChange={set('company')} />
        </div>
        <div className="form-field">
          <label>Role / Title</label>
          <input value={form.role} onChange={set('role')} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Department</label>
          <input value={form.department} onChange={set('department')} placeholder="Engineering, Sales…" />
        </div>
        <div className="form-field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={handlePhoneChange}
            placeholder="555-000-0000"
            maxLength={12}
          />
        </div>
        <div className="form-field">
          <label>LinkedIn URL</label>
          <input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>City</label>
          <input value={form.city} onChange={set('city')} />
        </div>
        <div className="form-field">
          <label>Country</label>
          <SearchableSelect
            options={COUNTRIES}
            value={form.country}
            onChange={(v) => {
              setForm(f => ({ ...f, country: v, state: v !== 'United States' ? '' : f.state }))
            }}
            placeholder="Select a country…"
          />
        </div>
      </div>
      {form.country === 'United States' && (
        <div className="form-row">
          <div className="form-field">
            <label>State</label>
            <SearchableSelect
              options={US_STATES}
              value={form.state || ''}
              onChange={(v) => setForm(f => ({ ...f, state: v }))}
              placeholder="Select a state…"
            />
          </div>
          <div className="form-field" />
        </div>
      )}
      <div className="form-row">
        <div className="form-field">
          <label>How we met</label>
          <input value={form.how_met} onChange={set('how_met')} placeholder="Conference, mutual friend…" />
        </div>
        <div className="form-field">
          <label>Referred by</label>
          <select value={form.referred_by_id || ''} onChange={set('referred_by_id')}>
            <option value="">None</option>
            {contacts?.filter(c => !initial?.id || c.id !== initial.id).map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-field">
        <label>Referral</label>
        <div className="referral-picker">
          {[
            { value: '', label: 'None' },
            { value: 'asked', label: 'Asked for referral' },
            { value: 'received', label: 'Got a referral' },
            { value: 'both', label: 'Both' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`referral-opt${form.referral_status === opt.value ? ' active' : ''}`}
              onClick={() => setForm(f => ({ ...f, referral_status: opt.value }))}
            >{opt.label}</button>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label>Tags (comma-separated)</label>
        <input value={form.tags} onChange={set('tags')} placeholder="investor, engineering, bay-area" />
      </div>
      <div className="form-field">
        <label>Notes</label>
        <textarea rows={2} value={form.notes} onChange={set('notes')} />
      </div>

      {isAdd && (
        <div className="outreach-section">
          <div className="outreach-section-toggle">
            <span className="outreach-section-label">Log outreach at the same time?</span>
            <button
              type="button"
              className={`toggle${outreach ? ' on' : ''}`}
              onClick={() => setOutreach(outreach ? null : { ...EMPTY_OUTREACH })}
            >
              <span className="toggle-knob" />
            </button>
          </div>
          {outreach && (
            <div className="outreach-inline-fields">
              <div className="form-row">
                <div className="form-field">
                  <label>Channel</label>
                  <select value={outreach.channel} onChange={setO('channel')}>
                    <option value="linkedin">LinkedIn</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="in_person">In Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Date Sent</label>
                  <input type="date" value={outreach.sent_date} onChange={setO('sent_date')} />
                </div>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea rows={2} value={outreach.notes} onChange={setO('notes')} placeholder="What did you say?" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save Contact</button>
      </div>
    </form>
  )
}
