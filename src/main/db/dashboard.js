import { getDb } from './connection'
import { getAllSettings } from './settings'
import { getOverdueContacts } from './contacts'

export function getDashboardMetrics() {
  const db = getDb()
  const totalConnections = db.prepare(`SELECT COUNT(*) as count FROM contacts`).get().count
  const threadsStarted   = db.prepare(`SELECT COUNT(*) as count FROM threads`).get().count
  const converted        = db.prepare(`SELECT COUNT(*) as count FROM threads WHERE status = 'closed'`).get().count
  const meetingsThisMonth = db
    .prepare(`
      SELECT COUNT(*) as count FROM thread_events
      WHERE type = 'meeting'
      AND meeting_datetime IS NOT NULL
      AND strftime('%Y-%m', meeting_datetime) = strftime('%Y-%m', 'now')
    `)
    .get().count
  const settings = getAllSettings()
  const windowDays = parseInt(settings.followup_window_days || '30')
  const overdueContacts = getOverdueContacts(windowDays)
  return { totalConnections, threadsStarted, converted, meetingsThisMonth, overdueCount: overdueContacts.length }
}

export function getRecentActivity(limit = 10) {
  return getDb()
    .prepare(`
      SELECT te.id, te.type, te.direction, te.channel, te.date, te.notes,
             t.id AS thread_id, t.intent, t.status AS thread_status,
             c.first_name, c.last_name, c.company
      FROM thread_events te
      JOIN threads t ON te.thread_id = t.id
      JOIN contacts c ON te.contact_id = c.id
      ORDER BY te.date DESC
      LIMIT ${limit}
    `)
    .all()
}

export function getActivityHeatmap() {
  return getDb()
    .prepare(`
      SELECT strftime('%Y-%W', date) as week, COUNT(*) as count
      FROM thread_events
      WHERE date >= datetime('now', '-84 days')
      GROUP BY week
      ORDER BY week
    `)
    .all()
}
