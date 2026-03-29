import { useState, useMemo, useRef, useEffect } from 'react'
import { useContacts, useSettings, useData, emitDataChange } from '../hooks/useOrbit'
import { StrengthDots, formatDate, daysSince, channelLabel, channelBadgeClass } from '../utils.jsx'
import './Contacts.css'

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde",
  "Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo",
  "Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland",
  "France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia",
  "Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
  "Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco",
  "Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand",
  "Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine",
  "Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo",
  "Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
]

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts",
  "Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming"
]

function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    if (!query) return options
    return options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  }, [query, options])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        if (open && query === '') onChange('')
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, query])

  return (
    <div ref={ref} className="searchable-select">
      <div
        className="searchable-select-trigger"
        onClick={() => { setOpen(true); setQuery(value || ''); setTimeout(() => inputRef.current?.focus(), 0) }}
      >
        {open ? (
          <input
            ref={inputRef}
            className="searchable-select-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <span className={value ? '' : 'placeholder'}>{value || placeholder}</span>
        )}
      </div>
      {open && (
        <div className="searchable-select-dropdown">
          {filtered.length === 0 ? (
            <div className="searchable-select-empty">No results</div>
          ) : filtered.map(o => (
            <div
              key={o}
              className={`searchable-select-option${o === value ? ' selected' : ''}`}
              onClick={() => { onChange(o); setOpen(false); setQuery('') }}
            >{o}</div>
          ))}
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  first_name: '', last_name: '', company: '', role: '', department: '',
  email: '', phone: '', linkedin_url: '', city: '', country: '', state: '', how_met: '',
  referred_by_id: '', notes: '', tags: '', strength: 0
}

function StrengthPicker({ value, onChange }) {
  const score = parseInt(value) || 0
  return (
    <div className="strength-picker">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`strength-pick-dot${n <= score ? ' filled' : ''}`}
          onClick={() => onChange(n === score ? 0 : n)}
          title={`${n} / 5`}
        />
      ))}
      {score > 0 && <span className="strength-pick-label">{score} / 5</span>}
    </div>
  )
}

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

function ContactForm({ initial, contacts, onSave, onCancel, isAdd = false }) {
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
        <label>Tags (comma-separated)</label>
        <input value={form.tags} onChange={set('tags')} placeholder="investor, engineering, bay-area" />
      </div>
      <div className="form-field">
        <label>Relationship Strength</label>
        <StrengthPicker value={form.strength} onChange={(v) => setForm(f => ({ ...f, strength: v }))} />
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

function LogInteractionModal({ contact, onSave, onCancel }) {
  const [form, setForm] = useState({ type: 'meeting', date: new Date().toISOString().split('T')[0], notes: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Log Interaction — {contact.first_name} {contact.last_name}</div>
        <div className="form-field">
          <label>Type</label>
          <select value={form.type} onChange={set('type')}>
            <option value="meeting">Meeting</option>
            <option value="email_reply">Email Reply</option>
            <option value="linkedin_reply">LinkedIn Reply</option>
            <option value="call">Call</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={set('date')} />
        </div>
        <div className="form-field">
          <label>Notes</label>
          <textarea rows={3} value={form.notes} onChange={set('notes')} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ ...form, contact_id: contact.id })}>
            Log Interaction
          </button>
        </div>
      </div>
    </div>
  )
}

function LogOutreachModal({ contact, onSave, onCancel }) {
  const [form, setForm] = useState({
    channel: 'linkedin', sent_date: new Date().toISOString().split('T')[0],
    status: 'sent', notes: ''
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Log Outreach — {contact.first_name} {contact.last_name}</div>
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
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ ...form, contact_id: contact.id })}>
            Log Outreach
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactDetail({ contact, onClose, onEdit, settings, onRefresh }) {
  const { data: interactions, reload: reloadInteractions } = useData(
    () => window.orbit.getInteractions(contact.id),
    [contact.id]
  )
  const { data: outreachList, reload: reloadOutreach } = useData(
    () => window.orbit.getOutreach().then(all => all.filter(o => o.contact_id === contact.id)),
    [contact.id]
  )
  const [showLogInteraction, setShowLogInteraction] = useState(false)
  const [showLogOutreach, setShowLogOutreach] = useState(false)

  const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const lastInteraction = interactions?.[0]

  const handleStrengthChange = async (val) => {
    await window.orbit.updateContact(contact.id, { strength: val })
    onRefresh()
  }

  const handleLogInteraction = async (data) => {
    await window.orbit.addInteraction(data)
    setShowLogInteraction(false)
    reloadInteractions()
    onRefresh()
  }

  const handleLogOutreach = async (data) => {
    await window.orbit.addOutreach(data)
    setShowLogOutreach(false)
    reloadOutreach()
    onRefresh()
    emitDataChange('outreach-changed')
  }

  return (
    <div className="contact-detail">
      <div className="detail-header">
        <div className="detail-avatar">{contact.first_name[0]}{contact.last_name[0]}</div>
        <div className="detail-name-block">
          <div className="detail-name">{contact.first_name} {contact.last_name}</div>
          <div className="detail-role">{[contact.role, contact.company].filter(Boolean).join(' @ ')}</div>
          {contact.email && <div className="detail-location">{contact.email}</div>}
          {contact.phone && <div className="detail-location">📞 {contact.phone}</div>}
          {contact.city && <div className="detail-location">📍 {[contact.city, contact.country].filter(Boolean).join(', ')}</div>}
        </div>
        <button className="btn-ghost" onClick={onClose}>✕</button>
      </div>

      <div className="detail-strength">
        <div className="detail-strength-row">
          <span className="detail-strength-label">Relationship strength</span>
          {lastInteraction && (
            <span className="detail-last-contact">
              {daysSince(lastInteraction.date)}d ago
            </span>
          )}
        </div>
        <StrengthPicker value={contact.strength || 0} onChange={handleStrengthChange} />
      </div>

      {tags.length > 0 && (
        <div className="detail-tags">
          {tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      )}

      <div className="detail-actions">
        <button className="btn-secondary" onClick={() => setShowLogInteraction(true)}>Log Interaction</button>
        <button className="btn-secondary" onClick={() => setShowLogOutreach(true)}>Log Outreach</button>
        <button className="btn-secondary" onClick={() => onEdit(contact)}>Edit</button>
      </div>

      {contact.notes && (
        <div className="detail-section">
          <div className="detail-section-title">Notes</div>
          <p className="detail-notes">{contact.notes}</p>
        </div>
      )}

      <div className="detail-section">
        <div className="detail-section-title">Outreach ({outreachList?.length || 0})</div>
        {outreachList?.length > 0 ? (
          <div className="outreach-cards-list">
            {outreachList.map(o => (
              <div key={o.id} className={`outreach-detail-card status-${o.status}`}>
                <div className="outreach-detail-top">
                  <span className="outreach-detail-channel">{channelLabel(o.channel)}</span>
                  <span className={`badge ${o.status === 'connected' ? 'badge-green' : o.status === 'declined' ? 'badge-red' : 'badge-yellow'}`}>
                    {o.status === 'sent' ? 'Awaiting reply' : o.status === 'connected' ? 'Connected' : 'Declined'}
                  </span>
                </div>
                <div className="outreach-detail-date">{formatDate(o.sent_date)}</div>
                {o.meeting_datetime && (
                  <div className="outreach-detail-meeting">
                    📅 {formatDate(o.meeting_datetime)}{o.meeting_topic ? ` · ${o.meeting_topic}` : ''}
                  </div>
                )}
                {o.notes && <p className="timeline-notes">{o.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="detail-empty">No outreach logged yet.</p>
        )}
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Interactions ({interactions?.length || 0})</div>
        {interactions?.length > 0 ? (
          <div className="detail-timeline">
            {interactions.map(i => (
              <div key={i.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-type">{i.type.replace('_', ' ')}</span>
                  <span className="timeline-date">{formatDate(i.date)}</span>
                  {i.notes && <p className="timeline-notes">{i.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="detail-empty">No interactions logged yet.</p>
        )}
      </div>

      {showLogInteraction && (
        <LogInteractionModal
          contact={contact}
          onSave={handleLogInteraction}
          onCancel={() => setShowLogInteraction(false)}
        />
      )}
      {showLogOutreach && (
        <LogOutreachModal
          contact={contact}
          onSave={handleLogOutreach}
          onCancel={() => setShowLogOutreach(false)}
        />
      )}
    </div>
  )
}

// Column definitions for sortable headers
const COLUMNS = [
  { key: 'name',           label: 'Name',           sortFn: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`) },
  { key: 'company',        label: 'Company',        sortFn: (a, b) => (a.company || '').localeCompare(b.company || '') },
  { key: 'role',           label: 'Role',           sortFn: (a, b) => (a.role || '').localeCompare(b.role || '') },
  { key: 'department',     label: 'Department',     sortFn: (a, b) => (a.department || '').localeCompare(b.department || '') },
  { key: 'last_contacted',        label: 'Last Contacted', sortFn: (a, b) => (b.last_contacted || '').localeCompare(a.last_contacted || '') },
  { key: 'strength',               label: 'Strength',      sortFn: (a, b) => (b.strength || 0) - (a.strength || 0) },
]

function SortableHeader({ col, sortKey, sortDir, onSort }) {
  const active = sortKey === col.key
  const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  return (
    <th
      className={`sortable-th${active ? ' active' : ''}${col.sortFn ? ' clickable' : ''}`}
      onClick={() => col.sortFn && onSort(col.key)}
    >
      {col.label}{arrow}
    </th>
  )
}

function ColumnFilterDropdown({ options, value, onChange, placeholder }) {
  return (
    <select
      className="col-filter-select"
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function Contacts() {
  const { data: contacts, loading, reload } = useContacts()
  const { data: settings } = useSettings()
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [selected, setSelected] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editContact, setEditContact] = useState(null)

  const departments = useMemo(() => {
    if (!contacts) return []
    return [...new Set(contacts.map(c => c.department).filter(Boolean))].sort()
  }, [contacts])

  const companies = useMemo(() => {
    if (!contacts) return []
    return [...new Set(contacts.map(c => c.company).filter(Boolean))].sort()
  }, [contacts])

  const allTags = useMemo(() => {
    if (!contacts) return []
    const tags = contacts.flatMap(c => c.tags ? c.tags.split(',').map(t => t.trim()) : [])
    return [...new Set(tags)].filter(Boolean).sort()
  }, [contacts])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    if (!contacts) return []
    let rows = contacts.filter(c => {
      const haystack = `${c.first_name} ${c.last_name} ${c.company || ''} ${c.email || ''} ${c.role || ''}`.toLowerCase()
      if (search && !haystack.includes(search.toLowerCase())) return false
      if (filterCompany && c.company !== filterCompany) return false
      if (filterDept && c.department !== filterDept) return false
      if (filterTag && (!c.tags || !c.tags.split(',').map(t => t.trim()).includes(filterTag))) return false
      return true
    })

    const col = COLUMNS.find(c => c.key === sortKey)
    if (col?.sortFn) {
      rows = [...rows].sort((a, b) => sortDir === 'asc' ? col.sortFn(a, b) : col.sortFn(b, a))
    }
    return rows
  }, [contacts, search, filterCompany, filterDept, filterTag, sortKey, sortDir])

  const handleAdd = async (data, outreach) => {
    const contact = await window.orbit.addContact(data)
    if (outreach && contact?.id) {
      await window.orbit.addOutreach({ ...outreach, contact_id: contact.id })
    }
    setShowAddModal(false)
    reload()
  }

  const handleEdit = async (data, _outreach) => {
    await window.orbit.updateContact(editContact.id, data)
    setEditContact(null)
    reload()
    if (selected?.id === editContact.id) {
      setSelected({ ...selected, ...data })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    await window.orbit.deleteContact(id)
    if (selected?.id === id) setSelected(null)
    reload()
  }

  const activeFilters = [filterCompany, filterDept, filterTag].filter(Boolean).length

  return (
    <div className="contacts-layout">
      <div className={`contacts-main${selected ? ' with-detail' : ''}`}>
        <div className="page-header">
          <div>
            <div className="page-title">Contacts</div>
            <div className="page-subtitle">
              {filtered.length}{contacts?.length !== filtered.length ? ` of ${contacts?.length}` : ''} contacts
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Contact</button>
        </div>

        <div className="contacts-filters">
          <input
            className="search-input"
            placeholder="Search name, company, role, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ColumnFilterDropdown options={companies} value={filterCompany} onChange={setFilterCompany} placeholder="All companies" />
          <ColumnFilterDropdown options={departments} value={filterDept} onChange={setFilterDept} placeholder="All departments" />
          <ColumnFilterDropdown options={allTags} value={filterTag} onChange={setFilterTag} placeholder="All tags" />
          {activeFilters > 0 && (
            <button className="btn-ghost clear-filters" onClick={() => { setFilterCompany(''); setFilterDept(''); setFilterTag('') }}>
              Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''} ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-text" style={{ padding: '40px 0' }}>Loading contacts…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◎</div>
            <div className="empty-state-title">{contacts?.length === 0 ? 'No contacts yet' : 'No matches'}</div>
            <p>{contacts?.length === 0 ? 'Add your first contact to get started.' : 'Try adjusting your search or filters.'}</p>
          </div>
        ) : (
          <div className="contacts-table-wrap">
            <table className="contacts-table">
              <thead>
                <tr>
                  {COLUMNS.map(col => (
                    <SortableHeader key={col.key} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const tags = c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : []
                  const lastContactedDays = c.last_contacted
                    ? Math.floor((Date.now() - new Date(c.last_contacted)) / 86400000)
                    : null
                  return (
                    <tr
                      key={c.id}
                      className={selected?.id === c.id ? 'selected' : ''}
                      onClick={() => setSelected(c)}
                    >
                      <td>
                        <div className="contact-name-cell">
                          <div className={`contact-avatar-sm${c.latest_outreach_status === 'connected' ? ' avatar-connected' : c.latest_outreach_status === 'sent' ? ' avatar-outreach' : c.latest_outreach_status === 'declined' ? ' avatar-declined' : ''}`}>{c.first_name[0]}{c.last_name[0]}</div>
                          <div>
                            <div className="contact-full-name">{c.first_name} {c.last_name}</div>
                            {c.email && <div className="contact-email">{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="text-secondary">{c.company || '—'}</td>
                      <td className="text-secondary">{c.role || '—'}</td>
                      <td className="text-secondary">{c.department || '—'}</td>
                      <td>
                        {lastContactedDays === null ? (
                          <span className="text-muted">Never</span>
                        ) : lastContactedDays === 0 ? (
                          <span className="last-contact-today">Today</span>
                        ) : (
                          <span className={`last-contact-days${lastContactedDays > 60 ? ' stale' : lastContactedDays > 30 ? ' aging' : ''}`}>
                            {lastContactedDays}d ago
                          </span>
                        )}
                      </td>
                      <td><StrengthDots score={c.strength || 0} /></td>
                      <td>
                        <button
                          className="btn-ghost row-delete-btn"
                          onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ContactDetail
          contact={selected}
          settings={settings}
          onClose={() => setSelected(null)}
          onEdit={(c) => setEditContact(c)}
          onRefresh={reload}
        />
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Contact</div>
            <ContactForm isAdd contacts={contacts} onSave={handleAdd} onCancel={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {editContact && (
        <div className="modal-overlay" onClick={() => setEditContact(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Edit Contact</div>
            <ContactForm initial={editContact} contacts={contacts} onSave={handleEdit} onCancel={() => setEditContact(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
