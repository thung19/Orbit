import { useMemo } from 'react'
import { useContacts, useThreads } from '../hooks/useOrbit'
import { intentLabel, channelLabel } from '../utils.jsx'
import BarChart from '../components/BarChart'
import './Insights.css'

export default function Insights() {
  const { data: contacts } = useContacts()
  const { data: threads }  = useThreads()

  // All events flattened
  const allEvents = useMemo(() => threads?.flatMap(t => t.events || []) || [], [threads])

  // Conversion rate by intent
  const convByIntent = useMemo(() => {
    if (!threads) return []
    const intents = ['networking_call', 'advice', 'referral', 'opportunity', 'maintenance', 'other']
    return intents.map(intent => {
      const group     = threads.filter(t => t.intent === intent)
      const converted = group.filter(t => t.status === 'closed')
      const rate      = group.length ? Math.round((converted.length / group.length) * 100) : 0
      return { label: intentLabel(intent), total: group.length, converted: converted.length, rate }
    }).filter(d => d.total > 0)
  }, [threads])

  // Event volume by channel
  const eventsByChannel = useMemo(() => {
    if (!allEvents.length) return []
    const map = {}
    for (const e of allEvents) {
      if (e.channel) map[e.channel] = (map[e.channel] || 0) + 1
    }
    return Object.entries(map)
      .map(([ch, value]) => ({ label: channelLabel(ch), value }))
      .sort((a, b) => b.value - a.value)
  }, [allEvents])

  // Network growth by month
  const growthByMonth = useMemo(() => {
    if (!contacts) return []
    const map = {}
    for (const c of contacts) {
      const m = c.created_at?.slice(0, 7)
      if (m) map[m] = (map[m] || 0) + 1
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, value]) => ({
        label: new Date(month + '-01').toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        value
      }))
  }, [contacts])

  // Threads started per month
  const threadsByMonth = useMemo(() => {
    if (!threads) return []
    const map = {}
    for (const t of threads) {
      const m = t.created_at?.slice(0, 7)
      if (m) map[m] = (map[m] || 0) + 1
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, value]) => ({
        label: new Date(month + '-01').toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        value
      }))
  }, [threads])

  // Connected contacts (threads with converted status)
  const connectedContacts = useMemo(() => {
    if (!contacts || !threads) return []
    const convertedIds = new Set(threads.filter(t => t.status === 'closed').map(t => t.contact_id))
    return contacts.filter(c => convertedIds.has(c.id)).slice(0, 5)
  }, [contacts, threads])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Insights</div>
          <div className="page-subtitle">Patterns across your network activity</div>
        </div>
      </div>

      <div className="insights-grid">
        <div className="card">
          <div className="section-title">Conversion Rate by Intent</div>
          {convByIntent.length === 0 ? (
            <div className="detail-empty">No thread data yet.</div>
          ) : (
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Intent</th>
                  <th>Threads</th>
                  <th>Converted</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {convByIntent.map(d => (
                  <tr key={d.label}>
                    <td>{d.label}</td>
                    <td>{d.total}</td>
                    <td>{d.converted}</td>
                    <td>
                      <div className="rate-bar">
                        <div className="rate-fill" style={{ width: `${d.rate}%` }} />
                        <span>{d.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="section-title">Events by Channel</div>
          {eventsByChannel.length === 0 ? (
            <div className="detail-empty">No event data yet.</div>
          ) : (
            <BarChart data={eventsByChannel} color="var(--blue)" />
          )}
        </div>

        <div className="card">
          <div className="section-title">Network Growth (last 12 months)</div>
          {growthByMonth.length === 0 ? (
            <div className="detail-empty">No data yet.</div>
          ) : (
            <BarChart data={growthByMonth} />
          )}
        </div>

        <div className="card">
          <div className="section-title">Threads Started (last 12 months)</div>
          {threadsByMonth.length === 0 ? (
            <div className="detail-empty">No thread data yet.</div>
          ) : (
            <BarChart data={threadsByMonth} color="var(--green)" />
          )}
        </div>

        <div className="card">
          <div className="section-title">Connected Contacts</div>
          {connectedContacts.length === 0 ? (
            <div className="detail-empty">No connected contacts yet.</div>
          ) : (
            <div className="contact-mini-list">
              {connectedContacts.map(c => (
                <div key={c.id} className="contact-mini-row">
                  <div className="contact-avatar-sm avatar-connected">{c.first_name[0]}{c.last_name[0]}</div>
                  <div>
                    <div className="contact-mini-name">{c.first_name} {c.last_name}</div>
                    <div className="contact-mini-sub">{c.company || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
