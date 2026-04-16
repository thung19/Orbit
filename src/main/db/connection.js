import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db

export function getDb() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'orbit.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
    runMigrations()
    seedSettings()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      department TEXT,
      email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      city TEXT,
      country TEXT,
      latitude REAL,
      longitude REAL,
      how_met TEXT,
      referred_by_id INTEGER REFERENCES contacts(id),
      notes TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS outreach (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      sent_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      meeting_datetime TEXT,
      meeting_duration TEXT,
      meeting_location TEXT,
      meeting_topic TEXT,
      gcal_event_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      intent TEXT NOT NULL DEFAULT 'other',
      initiated_by TEXT NOT NULL DEFAULT 'me',
      status TEXT NOT NULL DEFAULT 'open',
      context TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS thread_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'outbound',
      channel TEXT,
      date TEXT NOT NULL,
      meeting_datetime TEXT,
      meeting_location TEXT,
      meeting_duration TEXT,
      meeting_topic TEXT,
      gcal_event_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Column migrations for existing databases
  const contactCols = db.pragma('table_info(contacts)').map(c => c.name)
  if (!contactCols.includes('phone'))           db.exec(`ALTER TABLE contacts ADD COLUMN phone TEXT`)
  if (!contactCols.includes('strength'))        db.exec(`ALTER TABLE contacts ADD COLUMN strength INTEGER DEFAULT 0`)
  if (!contactCols.includes('referral_status')) db.exec(`ALTER TABLE contacts ADD COLUMN referral_status TEXT`)
}

function runMigrations() {
  // Normalize legacy status values to the simplified open/closed model
  db.exec(`
    UPDATE threads SET status = 'open'   WHERE status IN ('converted');
    UPDATE threads SET status = 'closed' WHERE status IN ('went_dark');
  `)

  // Migrate outreach + interactions → threads + thread_events (idempotent)
  const threadCount = db.prepare(`SELECT COUNT(*) as n FROM threads`).get().n
  if (threadCount > 0) return // already migrated

  const outreachCount     = db.prepare(`SELECT COUNT(*) as n FROM outreach`).get().n
  const interactionCount  = db.prepare(`SELECT COUNT(*) as n FROM interactions`).get().n
  if (outreachCount === 0 && interactionCount === 0) return // nothing to migrate

  const statusMap = { sent: 'open', connected: 'open', declined: 'closed' }
  const interactionTypeMap = {
    meeting: 'meeting', follow_up: 'message', call: 'call',
    email_reply: 'reply', linkedin_reply: 'reply', other: 'note'
  }

  const insertThread = db.prepare(`
    INSERT INTO threads (contact_id, intent, initiated_by, status, context, created_at, updated_at)
    VALUES (@contact_id, @intent, @initiated_by, @status, @context, @ts, @ts)
  `)
  const insertEvent = db.prepare(`
    INSERT INTO thread_events
      (thread_id, contact_id, type, direction, channel, date,
       meeting_datetime, meeting_location, meeting_duration, meeting_topic, gcal_event_id, notes, created_at)
    VALUES
      (@thread_id, @contact_id, @type, @direction, @channel, @date,
       @meeting_datetime, @meeting_location, @meeting_duration, @meeting_topic, @gcal_event_id, @notes, @ts)
  `)

  db.transaction(() => {
    if (outreachCount > 0) {
      const rows = db.prepare(`SELECT * FROM outreach ORDER BY sent_date ASC`).all()
      for (const o of rows) {
        const ts = o.created_at || new Date().toISOString()
        const thread = insertThread.run({
          contact_id: o.contact_id,
          intent: 'networking_call',
          initiated_by: 'me',
          status: statusMap[o.status] || 'open',
          context: o.notes || null,
          ts
        })
        insertEvent.run({
          thread_id: thread.lastInsertRowid,
          contact_id: o.contact_id,
          type: 'message',
          direction: 'outbound',
          channel: o.channel,
          date: o.sent_date,
          meeting_datetime: null,
          meeting_location: null,
          meeting_duration: null,
          meeting_topic: null,
          gcal_event_id: null,
          notes: o.notes || null,
          ts
        })
        if (o.meeting_datetime) {
          insertEvent.run({
            thread_id: thread.lastInsertRowid,
            contact_id: o.contact_id,
            type: 'meeting',
            direction: 'inbound',
            channel: o.channel,
            date: o.meeting_datetime.split('T')[0],
            meeting_datetime: o.meeting_datetime,
            meeting_location: o.meeting_location || null,
            meeting_duration: o.meeting_duration || null,
            meeting_topic: o.meeting_topic || null,
            gcal_event_id: o.gcal_event_id || null,
            notes: null,
            ts
          })
        }
      }
    }

    if (interactionCount > 0) {
      const rows = db.prepare(`SELECT * FROM interactions ORDER BY date ASC`).all()
      for (const i of rows) {
        const ts = i.created_at || new Date().toISOString()
        const thread = insertThread.run({
          contact_id: i.contact_id,
          intent: 'maintenance',
          initiated_by: 'me',
          status: 'converted',
          context: null,
          ts
        })
        insertEvent.run({
          thread_id: thread.lastInsertRowid,
          contact_id: i.contact_id,
          type: interactionTypeMap[i.type] || 'note',
          direction: 'outbound',
          channel: null,
          date: i.date,
          meeting_datetime: null,
          meeting_location: null,
          meeting_duration: null,
          meeting_topic: null,
          gcal_event_id: null,
          notes: i.notes || null,
          ts
        })
      }
    }
  })()
}

function seedSettings() {
  const defaults = {
    followup_window_days: '30',
    gcal_enabled: 'false',
    gmail_scan_enabled: 'false',

  }
  const insert = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
  for (const [key, value] of Object.entries(defaults)) {
    insert.run(key, value)
  }
}
