import { useEffect, useState } from 'react'
import { useData } from '../hooks/useOrbit'
import { formatDateShort, daysSince } from '../utils.jsx'
import './Dashboard.css'

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className={`metric-card${accent ? ' accent' : ''}`}>
      <div className="metric-value">{value ?? '—'}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

function ActivityHeatmap({ data }) {
  // Build a 12-week grid
  const weeks = []
  const now = new Date()
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - w * 7)
    const year = weekStart.getFullYear()
    const week = String(getWeekNumber(weekStart)).padStart(2, '0')
    const key = `${year}-${week}`
    const found = data?.find((d) => d.week === key)
    weeks.push({ key, count: found?.count || 0 })
  }

  const max = Math.max(1, ...weeks.map((w) => w.count))

  return (
    <div className="heatmap-section">
      <div className="section-title">12-Week Activity</div>
      <div className="heatmap-grid">
        {weeks.map((week) => {
          const intensity = week.count / max
          return (
            <div
              key={week.key}
              className="heatmap-cell"
              title={`${week.key}: ${week.count} interactions`}
              style={{ opacity: week.count === 0 ? 0.15 : 0.2 + intensity * 0.8 }}
            />
          )
        })}
      </div>
    </div>
  )
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

function ActivityItem({ item }) {
  const name = `${item.first_name} ${item.last_name}`
  const isOutreach = item.event_type === 'outreach'
  return (
    <div className="activity-item">
      <div className={`activity-dot ${isOutreach ? 'outreach' : 'interaction'}`} />
      <div className="activity-body">
        <span className="activity-name">{name}</span>
        <span className="activity-text">
          {isOutreach
            ? ` — outreach via ${item.channel}`
            : ` — ${item.channel}`}
        </span>
      </div>
      <span className="activity-date">{formatDateShort(item.date)}</span>
    </div>
  )
}

export default function Dashboard() {
  const { data: metrics, loading: mLoading } = useData(() => window.orbit.getDashboardMetrics())
  const { data: activity, loading: aLoading } = useData(() => window.orbit.getRecentActivity(10))
  const { data: heatmap } = useData(() => window.orbit.getActivityHeatmap())
  const { data: contacts } = useData(() => window.orbit.getContacts())
  const { data: settings } = useData(() => window.orbit.getSettings())

  const connectRate = metrics && metrics.outreachSent > 0
    ? Math.round((metrics.connected / metrics.outreachSent) * 100)
    : 0

  // Build overdue list from contacts data
  const overdueContacts = contacts && settings
    ? contacts.filter((c) => {
        // simplified: just show contacts with no recent interaction
        return false // will be computed server-side via metrics.overdueCount
      })
    : []

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Your networking overview</div>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Total Contacts" value={mLoading ? '…' : metrics?.totalConnections} />
        <MetricCard
          label="Outreach Sent"
          value={mLoading ? '…' : metrics?.outreachSent}
          sub={`${connectRate}% connect rate`}
        />
        <MetricCard label="Meetings This Month" value={mLoading ? '…' : metrics?.meetingsThisMonth} accent />
        <MetricCard
          label="Follow-ups Overdue"
          value={mLoading ? '…' : metrics?.overdueCount}
          sub={metrics?.overdueCount > 0 ? 'needs attention' : 'all good'}
        />
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-col">
          <div className="section-title">Recent Activity</div>
          {aLoading ? (
            <div className="loading-text">Loading…</div>
          ) : activity?.length > 0 ? (
            <div className="activity-list">
              {activity.map((item, i) => (
                <ActivityItem key={`${item.event_type}-${item.id}-${i}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">↗</div>
              <div className="empty-state-title">No activity yet</div>
              <p>Add contacts and log outreach to see activity here.</p>
            </div>
          )}
        </div>

        <div className="dashboard-col">
          <ActivityHeatmap data={heatmap} />
        </div>
      </div>
    </div>
  )
}
