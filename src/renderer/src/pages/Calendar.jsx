import { useState, useMemo } from 'react'
import { useData } from '../hooks/useOrbit'
import { eventTypeLabel } from '../utils.jsx'
import './Calendar.css'

// Returns a Date object for an event, using meeting_datetime if present, else date (YYYY-MM-DD)
function eventDate(m) {
  if (m.meeting_datetime) return new Date(m.meeting_datetime)
  // date is YYYY-MM-DD — parse as local midnight
  const [y, mo, d] = m.date.split('-').map(Number)
  return new Date(y, mo - 1, d)
}

function CalendarGrid({ year, month, events, selectedDay, onSelectDay }) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today       = new Date()

  // Map day → events for this month
  const byDay = {}
  for (const m of events) {
    const d = eventDate(m)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(m)
    }
  }

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
      {cells.map((day, i) => {
        const hasEvents = day && byDay[day]
        const isSel = day && selectedDay === day
        const evts = hasEvents ? byDay[day] : []
        const hasMeeting = evts.some(e => e.type === 'meeting')
        const hasCall    = evts.some(e => e.type === 'call')
        return (
          <div
            key={i}
            className={[
              'cal-cell',
              !day ? 'empty' : '',
              day && isToday(day) ? 'today' : '',
              hasEvents ? 'has-meeting' : '',
              isSel ? 'selected' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => day && onSelectDay(isSel ? null : day)}
          >
            {day && <span className="cal-day-num">{day}</span>}
            {(hasMeeting || hasCall) && (
              <div className="cal-dots">
                {hasMeeting && <span className="cal-dot dot-meeting" />}
                {hasCall    && <span className="cal-dot dot-call" />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Calendar() {
  const { data: rawEvents } = useData(() => window.orbit.getMeetings())
  const now = new Date()
  const [year,       setYear]       = useState(now.getFullYear())
  const [month,      setMonth]      = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  const events = rawEvents || []

  const upcoming = useMemo(() =>
    events
      .filter(m => eventDate(m) >= now)
      .sort((a, b) => eventDate(a) - eventDate(b))
      .slice(0, 30),
    [events]
  )

  // When a day is selected, show events for that day; otherwise show upcoming
  const sidebarEvents = useMemo(() => {
    if (!selectedDay) return upcoming
    return events
      .filter(m => {
        const d = eventDate(m)
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay
      })
      .sort((a, b) => eventDate(a) - eventDate(b))
  }, [selectedDay, events, year, month, upcoming])

  const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    setSelectedDay(null)
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelectedDay(null)
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const sidebarTitle = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : 'Upcoming'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-subtitle">{upcoming.length} upcoming</div>
        </div>
      </div>

      <div className="cal-layout">
        <div className="cal-main">
          <div className="cal-nav">
            <button className="btn-ghost" onClick={prevMonth}>←</button>
            <span className="cal-month-label">{monthName}</span>
            <button className="btn-ghost" onClick={nextMonth}>→</button>
          </div>
          <CalendarGrid
            year={year}
            month={month}
            events={events}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
          <div className="cal-legend">
            <span className="cal-legend-item"><span className="cal-dot dot-meeting" /> Meeting</span>
            <span className="cal-legend-item"><span className="cal-dot dot-call" /> Call</span>
          </div>
        </div>

        <div className="cal-sidebar">
          <div className="section-title">{sidebarTitle}</div>
          {sidebarEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">
                {selectedDay ? 'Nothing on this day' : 'No upcoming events'}
              </div>
            </div>
          ) : (
            <div className="meeting-list">
              {sidebarEvents.map(m => {
                const d = eventDate(m)
                const hasTime = !!m.meeting_datetime
                return (
                  <div key={m.id} className={`meeting-card type-${m.type}`}>
                    <div className="meeting-card-date">
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {hasTime && (
                        <span className="meeting-card-time">
                          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="meeting-card-info">
                      <div className="meeting-card-header">
                        <span className="meeting-card-name">{m.first_name} {m.last_name}</span>
                        <span className="meeting-card-type-tag">{eventTypeLabel(m.type)}</span>
                      </div>
                      {m.company          && <div className="meeting-card-company">{m.company}</div>}
                      {m.meeting_topic    && <div className="meeting-card-topic">{m.meeting_topic}</div>}
                      {m.meeting_location && <div className="meeting-card-location">{m.meeting_location}</div>}
                      {m.meeting_duration && <div className="meeting-card-duration">{m.meeting_duration} min</div>}
                      {m.notes            && <div className="meeting-card-notes">{m.notes}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
