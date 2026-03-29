import { useMemo } from 'react'
import { useContacts, useOutreach, useSettings, useData } from '../hooks/useOrbit'
import { computeStrength, channelLabel } from '../utils.jsx'
import './Insights.css'

function BarChart({ data, maxVal, color = 'var(--accent)' }) {
  const max = maxVal || Math.max(1, ...data.map(d => d.value))
  return (
    <div className="bar-chart">
      {data.map(d => (
        <div key={d.label} className="bar-chart-row">
          <span className="bar-chart-label">{d.label}</span>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
            <span className="bar-chart-val">{d.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Insights() {
  const { data: contacts } = useContacts()
  const { data: outreach } = useOutreach()
  const { data: settings } = useSettings()

  // Connect rate by channel
  const connectByChannel = useMemo(() => {
    if (!outreach) return []
    const channels = ['linkedin', 'email', 'phone', 'in_person', 'other']
    return channels.map(ch => {
      const sent = outreach.filter(o => o.channel === ch)
      const connected = sent.filter(o => o.status === 'connected')
      const rate = sent.length ? Math.round((connected.length / sent.length) * 100) : 0
      return { label: channelLabel(ch), sent: sent.length, connected: connected.length, rate }
    }).filter(d => d.sent > 0)
  }, [outreach])

  // Avg days to response per channel
  const avgDaysByChannel = useMemo(() => {
    if (!outreach) return []
    const channels = {}
    for (const o of outreach) {
      if (o.status === 'connected' && o.meeting_datetime && o.sent_date) {
        const days = Math.round((new Date(o.meeting_datetime) - new Date(o.sent_date)) / 86400000)
        if (!channels[o.channel]) channels[o.channel] = []
        channels[o.channel].push(days)
      }
    }
    return Object.entries(channels).map(([ch, days]) => ({
      label: channelLabel(ch),
      value: Math.round(days.reduce((a, b) => a + b, 0) / days.length)
    }))
  }, [outreach])

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

  // Outreach volume by month
  const outreachByMonth = useMemo(() => {
    if (!outreach) return []
    const map = {}
    for (const o of outreach) {
      const m = o.sent_date?.slice(0, 7)
      if (m) map[m] = (map[m] || 0) + 1
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, value]) => ({
        label: new Date(month + '-01').toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        value
      }))
  }, [outreach])

  // Strongest relationships (need interaction data per contact)
  // Simplified: use contact list, no per-contact interaction fetch
  const atRisk = useMemo(() => {
    if (!contacts || !outreach) return []
    const connectedIds = new Set(outreach.filter(o => o.status === 'connected').map(o => o.contact_id))
    return contacts
      .filter(c => connectedIds.has(c.id))
      .slice(0, 5)
  }, [contacts, outreach])

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
          <div className="section-title">Connect Rate by Channel</div>
          {connectByChannel.length === 0 ? (
            <div className="detail-empty">No outreach data yet.</div>
          ) : (
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Sent</th>
                  <th>Connected</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {connectByChannel.map(d => (
                  <tr key={d.label}>
                    <td>{d.label}</td>
                    <td>{d.sent}</td>
                    <td>{d.connected}</td>
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
          <div className="section-title">Avg Days to Response</div>
          {avgDaysByChannel.length === 0 ? (
            <div className="detail-empty">No response data yet.</div>
          ) : (
            <BarChart data={avgDaysByChannel} color="var(--blue)" />
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
          <div className="section-title">Outreach Volume (last 12 months)</div>
          {outreachByMonth.length === 0 ? (
            <div className="detail-empty">No outreach data yet.</div>
          ) : (
            <BarChart data={outreachByMonth} color="var(--green)" />
          )}
        </div>

        <div className="card">
          <div className="section-title">Connected Contacts</div>
          {atRisk.length === 0 ? (
            <div className="detail-empty">No connected contacts yet.</div>
          ) : (
            <div className="contact-mini-list">
              {atRisk.map(c => (
                <div key={c.id} className="contact-mini-row">
                  <div className="contact-avatar-sm">{c.first_name[0]}{c.last_name[0]}</div>
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
