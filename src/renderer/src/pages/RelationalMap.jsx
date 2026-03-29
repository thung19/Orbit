import { useEffect, useRef, useState, useMemo } from 'react'
import cytoscape from 'cytoscape'
import { useContacts } from '../hooks/useOrbit'
import './RelationalMap.css'

const DEPT_COLORS = {
  Engineering: '#7c6af7',
  Product: '#60a5fa',
  Sales: '#4ade80',
  Marketing: '#fbbf24',
  Finance: '#f87171',
  Design: '#e879f9',
  Operations: '#fb923c',
  HR: '#34d399',
  Legal: '#94a3b8',
  Other: '#64748b'
}

function getDeptColor(dept) {
  return DEPT_COLORS[dept] || DEPT_COLORS.Other
}

export default function RelationalMap() {
  const { data: contacts } = useContacts()
  const cyRef = useRef(null)
  const cyInstance = useRef(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [showCompanies, setShowCompanies] = useState(true)
  const [showReferrals, setShowReferrals] = useState(true)
  const [filterDept, setFilterDept] = useState('')

  const departments = useMemo(() =>
    [...new Set((contacts || []).map(c => c.department).filter(Boolean))].sort(),
    [contacts]
  )

  useEffect(() => {
    if (!contacts || !cyRef.current) return

    const filtered = contacts.filter(c => !filterDept || c.department === filterDept)

    // Build elements
    const elements = []
    const companies = new Set(filtered.map(c => c.company).filter(Boolean))

    // Company nodes
    if (showCompanies) {
      for (const company of companies) {
        elements.push({
          data: { id: `company-${company}`, label: company, type: 'company' }
        })
      }
    }

    // Contact nodes
    for (const c of filtered) {
      elements.push({
        data: {
          id: `contact-${c.id}`,
          label: `${c.first_name[0]}${c.last_name[0]}`,
          fullName: `${c.first_name} ${c.last_name}`,
          company: c.company,
          dept: c.department || 'Other',
          contactId: c.id,
          type: 'contact',
          color: getDeptColor(c.department || 'Other')
        }
      })

      // Contact → Company edge
      if (showCompanies && c.company) {
        elements.push({
          data: {
            id: `edge-company-${c.id}`,
            source: `contact-${c.id}`,
            target: `company-${c.company}`,
            type: 'company'
          }
        })
      }

      // Referral edge
      if (showReferrals && c.referred_by_id && filtered.find(f => f.id === c.referred_by_id)) {
        elements.push({
          data: {
            id: `edge-ref-${c.id}`,
            source: `contact-${c.id}`,
            target: `contact-${c.referred_by_id}`,
            type: 'referral'
          }
        })
      }
    }

    if (cyInstance.current) {
      cyInstance.current.destroy()
    }

    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: 'node[type="contact"]',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '10px',
            'font-weight': 'bold',
            'width': 32,
            'height': 32,
            'border-width': 2,
            'border-color': '#0f0f13'
          }
        },
        {
          selector: 'node[type="company"]',
          style: {
            'background-color': '#17171f',
            'border-width': 2,
            'border-color': '#3a3a4a',
            'label': 'data(label)',
            'color': '#9090a8',
            'text-valign': 'center',
            'font-size': '11px',
            'font-weight': '600',
            'width': 60,
            'height': 60,
            'shape': 'round-rectangle'
          }
        },
        {
          selector: 'edge[type="company"]',
          style: {
            'width': 1,
            'line-color': '#2a2a36',
            'target-arrow-color': '#2a2a36',
            'curve-style': 'bezier',
            'opacity': 0.6
          }
        },
        {
          selector: 'edge[type="referral"]',
          style: {
            'width': 1.5,
            'line-color': '#7c6af7',
            'line-style': 'dashed',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#7c6af7',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#fff'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        nodeRepulsion: 4000,
        idealEdgeLength: 80
      },
      userZoomingEnabled: true,
      userPanningEnabled: true
    })

    cyInstance.current.on('tap', 'node[type="contact"]', (evt) => {
      const data = evt.target.data()
      const contact = contacts.find(c => c.id === data.contactId)
      setSelectedContact(contact || null)
    })

    cyInstance.current.on('tap', (evt) => {
      if (evt.target === cyInstance.current) setSelectedContact(null)
    })

    return () => {
      cyInstance.current?.destroy()
      cyInstance.current = null
    }
  }, [contacts, showCompanies, showReferrals, filterDept])

  return (
    <div className="relmap-layout">
      <div className="relmap-toolbar">
        <span className="page-title" style={{ fontSize: 16 }}>Relational Map</span>
        <div className="relmap-controls">
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label className="check-label">
            <input type="checkbox" checked={showCompanies} onChange={e => setShowCompanies(e.target.checked)} />
            Companies
          </label>
          <label className="check-label">
            <input type="checkbox" checked={showReferrals} onChange={e => setShowReferrals(e.target.checked)} />
            Referrals
          </label>
        </div>
      </div>

      <div className="relmap-body">
        <div className="cy-container" ref={cyRef} />
        {selectedContact && (
          <div className="relmap-detail">
            <div className="detail-header" style={{ marginBottom: 12 }}>
              <div className="detail-avatar"
                style={{ background: getDeptColor(selectedContact.department || 'Other') + '33',
                         color: getDeptColor(selectedContact.department || 'Other') }}>
                {selectedContact.first_name[0]}{selectedContact.last_name[0]}
              </div>
              <div className="detail-name-block">
                <div className="detail-name">{selectedContact.first_name} {selectedContact.last_name}</div>
                <div className="detail-role">
                  {[selectedContact.role, selectedContact.company].filter(Boolean).join(' @ ')}
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedContact(null)}>✕</button>
            </div>
            {selectedContact.department && (
              <div className="form-field">
                <span className="tag">{selectedContact.department}</span>
              </div>
            )}
            {selectedContact.email && <div className="relmap-detail-field">{selectedContact.email}</div>}
            {selectedContact.city && (
              <div className="relmap-detail-field">
                {[selectedContact.city, selectedContact.country].filter(Boolean).join(', ')}
              </div>
            )}
            {selectedContact.notes && (
              <p className="detail-notes" style={{ marginTop: 8 }}>{selectedContact.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="relmap-legend">
        {Object.entries(DEPT_COLORS).slice(0, 6).map(([dept, color]) => (
          <div key={dept} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            <span className="legend-label">{dept}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-line dashed" />
          <span className="legend-label">Referral</span>
        </div>
      </div>
    </div>
  )
}
