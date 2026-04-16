import { getDb } from './connection'

function attachEvents(threads) {
  if (!threads.length) return threads
  const db = getDb()
  const ids = threads.map(t => t.id)
  const placeholders = ids.map(() => '?').join(',')
  const events = db
    .prepare(`SELECT * FROM thread_events WHERE thread_id IN (${placeholders}) ORDER BY date ASC, created_at ASC`)
    .all(...ids)
  const byThread = {}
  for (const e of events) {
    if (!byThread[e.thread_id]) byThread[e.thread_id] = []
    byThread[e.thread_id].push(e)
  }
  return threads.map(t => ({ ...t, events: byThread[t.id] || [] }))
}

export function getAllThreads() {
  const threads = getDb()
    .prepare(`
      SELECT t.*, c.first_name, c.last_name, c.company, c.email
      FROM threads t
      JOIN contacts c ON t.contact_id = c.id
      ORDER BY t.updated_at DESC
    `)
    .all()
  return attachEvents(threads)
}

export function getThreadsByContact(contactId) {
  const threads = getDb()
    .prepare(`
      SELECT t.*, c.first_name, c.last_name, c.company, c.email
      FROM threads t
      JOIN contacts c ON t.contact_id = c.id
      WHERE t.contact_id = ?
      ORDER BY t.updated_at DESC
    `)
    .all(contactId)
  return attachEvents(threads)
}

export function addThread(data) {
  const db = getDb()
  const defaults = { intent: 'other', initiated_by: 'me', status: 'open', context: null }
  data = { ...defaults, ...data }
  const now = new Date().toISOString()
  const result = db
    .prepare(`
      INSERT INTO threads (contact_id, intent, initiated_by, status, context, created_at, updated_at)
      VALUES (@contact_id, @intent, @initiated_by, @status, @context, @now, @now)
    `)
    .run({ ...data, now })
  const thread = db.prepare(`SELECT * FROM threads WHERE id = ?`).get(result.lastInsertRowid)
  return { ...thread, events: [] }
}

export function updateThread(id, data) {
  const db = getDb()
  const ALLOWED = new Set(['intent', 'initiated_by', 'status', 'context'])
  const clean = Object.fromEntries(Object.entries(data).filter(([k]) => ALLOWED.has(k)))
  clean.updated_at = new Date().toISOString()
  const fields = Object.keys(clean).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE threads SET ${fields} WHERE id = @id`).run({ ...clean, id })
  return db.prepare(`SELECT * FROM threads WHERE id = ?`).get(id)
}

export function deleteThread(id) {
  return getDb().prepare(`DELETE FROM threads WHERE id = ?`).run(id)
}

export function addEvent(data) {
  const db = getDb()
  const defaults = {
    direction: 'outbound', channel: null,
    meeting_datetime: null, meeting_location: null, meeting_duration: null,
    meeting_topic: null, gcal_event_id: null, notes: null
  }
  data = { ...defaults, ...data }
  const result = db
    .prepare(`
      INSERT INTO thread_events
        (thread_id, contact_id, type, direction, channel, date, meeting_datetime,
         meeting_location, meeting_duration, meeting_topic, gcal_event_id, notes)
      VALUES
        (@thread_id, @contact_id, @type, @direction, @channel, @date, @meeting_datetime,
         @meeting_location, @meeting_duration, @meeting_topic, @gcal_event_id, @notes)
    `)
    .run(data)
  db.prepare(`UPDATE threads SET updated_at = datetime('now') WHERE id = ?`).run(data.thread_id)
  return db.prepare(`SELECT * FROM thread_events WHERE id = ?`).get(result.lastInsertRowid)
}

export function updateEvent(id, data) {
  const db = getDb()
  const ALLOWED = new Set([
    'type', 'direction', 'channel', 'date', 'notes',
    'meeting_datetime', 'meeting_location', 'meeting_duration', 'meeting_topic'
  ])
  const clean = Object.fromEntries(Object.entries(data).filter(([k]) => ALLOWED.has(k)))
  const fields = Object.keys(clean).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE thread_events SET ${fields} WHERE id = @id`).run({ ...clean, id })
  const ev = db.prepare(`SELECT * FROM thread_events WHERE id = ?`).get(id)
  if (ev) db.prepare(`UPDATE threads SET updated_at = datetime('now') WHERE id = ?`).run(ev.thread_id)
  return ev
}

export function deleteEvent(id) {
  const db = getDb()
  const ev = db.prepare(`SELECT thread_id FROM thread_events WHERE id = ?`).get(id)
  db.prepare(`DELETE FROM thread_events WHERE id = ?`).run(id)
  if (ev) db.prepare(`UPDATE threads SET updated_at = datetime('now') WHERE id = ?`).run(ev.thread_id)
}

export function getMeetings() {
  return getDb()
    .prepare(`
      SELECT te.*, t.intent, t.initiated_by, t.status AS thread_status,
             c.first_name, c.last_name, c.company, c.email,
             COALESCE(te.meeting_datetime, te.date) AS event_datetime
      FROM thread_events te
      JOIN threads t ON te.thread_id = t.id
      JOIN contacts c ON te.contact_id = c.id
      WHERE te.type IN ('meeting', 'call')
      ORDER BY event_datetime ASC
    `)
    .all()
}
