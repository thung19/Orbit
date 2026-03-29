import { useState, useMemo } from 'react'
import { useOutreach, useContacts } from '../hooks/useOrbit'
import { formatDate } from '../utils.jsx'
import './Calendar.css'

function CalendarGrid({ year, month, meetings }) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const meetingDays = new Set(
    meetings
      .filter(m => {
        if (!m.meeting_datetime) return false
        const d = new Date(m.meeting_datetime)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .map(m => new Date(m.meeting_datetime).getDate())
  )

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="cal-grid">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
        <div key={d} className="cal-day-label">{d}</div>
      ))}
      {cells.map((day, i) => (
        <div
          key={i}
          className={`cal-cell${!day ? ' empty' : ''}${day && isToday(day) ? ' today' : ''}${day && meetingDays.has(day) ? ' has-meeting' : ''}`}
        >
          {day && <span className="cal-day-num">{day}</span>}
          {day && meetingDays.has(day) && <span className="cal-dot" />}
        </div>
      ))}
    </div>
  )
}

export default function Calendar() {
  const { data: outreach } = useOutreach()
  const { data: contacts } = useContacts()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const meetings = useMemo(() =>
    (outreach || []).filter(o => o.status === 'connected' && o.meeting_datetime),
    [outreach]
  )

  const upcoming = useMemo(() =>
    meetings
      .filter(m => new Date(m.meeting_datetime) >= now)
      .sort((a, b) => new Date(a.meeting_datetime) - new Date(b.meeting_datetime))
      .slice(0, 20),
    [meetings]
  )

  const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-subtitle">{upcoming.length} upcoming meetings</div>
        </div>
      </div>

      <div className="cal-layout">
        <div className="cal-main">
          <div className="cal-nav">
            <button className="btn-ghost" onClick={prevMonth}>←</button>
            <span className="cal-month-label">{monthName}</span>
            <button className="btn-ghost" onClick={nextMonth}>→</button>
          </div>
          <CalendarGrid year={year} month={month} meetings={meetings} />
        </div>

        <div className="cal-sidebar">
          <div className="section-title">Upcoming Meetings</div>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">No upcoming meetings</div>
            </div>
          ) : (
            <div className="meeting-list">
              {upcoming.map(m => (
                <div key={m.id} className="meeting-card">
                  <div className="meeting-card-date">
                    {new Date(m.meeting_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className="meeting-card-time">
                      {new Date(m.meeting_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="meeting-card-info">
                    <div className="meeting-card-name">{m.first_name} {m.last_name}</div>
                    {m.company && <div className="meeting-card-company">{m.company}</div>}
                    {m.meeting_topic && <div className="meeting-card-topic">{m.meeting_topic}</div>}
                    {m.meeting_location && (
                      <div className="meeting-card-location">📍 {m.meeting_location}</div>
                    )}
                    {m.meeting_duration && (
                      <div className="meeting-card-duration">⏱ {m.meeting_duration}</div>
                    )}
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
