import { useState, useMemo } from 'react'
import { useContacts, useSettings } from '../hooks/useOrbit'
import ContactForm from '../components/ContactForm'
import ContactDetail from '../components/ContactDetail'
import './Contacts.css'

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

const COLUMNS = [
  { key: 'name',           label: 'Name',           sortFn: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`) },
  { key: 'company',        label: 'Company',        sortFn: (a, b) => (a.company || '').localeCompare(b.company || '') },
  { key: 'role',           label: 'Role',           sortFn: (a, b) => (a.role || '').localeCompare(b.role || '') },
  { key: 'department',     label: 'Department',     sortFn: (a, b) => (a.department || '').localeCompare(b.department || '') },
  { key: 'last_contacted', label: 'Last Contacted', sortFn: (a, b) => (b.last_contacted || '').localeCompare(a.last_contacted || '') },
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
                          <div className={`contact-avatar-sm${c.latest_thread_status === 'converted' ? ' avatar-connected' : c.latest_thread_status === 'open' ? ' avatar-outreach' : (c.latest_thread_status === 'went_dark' || c.latest_thread_status === 'closed') ? ' avatar-declined' : ''}`}>{c.first_name[0]}{c.last_name[0]}</div>
                          <div>
                            <div className="contact-full-name">
                              {c.first_name} {c.last_name}
                              {c.referral_status && (
                                <span className={`referral-indicator referral-ind-${c.referral_status}`} title={
                                  c.referral_status === 'asked' ? 'Asked for referral' :
                                  c.referral_status === 'received' ? 'Got a referral' : 'Asked & received referral'
                                }>
                                  {c.referral_status === 'asked' ? '↗' : c.referral_status === 'received' ? '↙' : '⇄'}
                                </span>
                              )}
                            </div>
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
