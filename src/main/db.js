import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db

function getDb() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'orbit.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Migrations for existing databases
  const columns = db.pragma('table_info(contacts)').map(c => c.name)
  if (!columns.includes('phone')) {
    db.exec(`ALTER TABLE contacts ADD COLUMN phone TEXT`)
  }
  if (!columns.includes('strength')) {
    db.exec(`ALTER TABLE contacts ADD COLUMN strength INTEGER DEFAULT 0`)
  }
}

function seedSettings() {
  const defaults = {
    followup_window_days: '30',
    gcal_enabled: 'false',
    gmail_scan_enabled: 'false',
    strength_weight_meeting: '3',
    strength_weight_email_reply: '1',
    strength_weight_linkedin_reply: '1',
    strength_decay_enabled: 'true',
    strength_decay_days: '30'
  }
  const insert = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  )
  for (const [key, value] of Object.entries(defaults)) {
    insert.run(key, value)
  }
}

// ── Contacts ──────────────────────────────────────────────────────────────────

function getAllContacts() {
  return getDb()
    .prepare(`
      SELECT c.*,
        (
          SELECT MAX(date_val) FROM (
            SELECT date AS date_val FROM interactions WHERE contact_id = c.id
            UNION ALL
            SELECT sent_date AS date_val FROM outreach WHERE contact_id = c.id
            UNION ALL
            SELECT meeting_datetime AS date_val FROM outreach
              WHERE contact_id = c.id AND status = 'connected' AND meeting_datetime IS NOT NULL
          )
        ) AS last_contacted,
        (SELECT status  FROM outreach WHERE contact_id = c.id ORDER BY sent_date DESC LIMIT 1) AS latest_outreach_status,
        (SELECT channel FROM outreach WHERE contact_id = c.id ORDER BY sent_date DESC LIMIT 1) AS latest_outreach_channel,
        (SELECT COUNT(*) FROM outreach WHERE contact_id = c.id) AS outreach_count
      FROM contacts c
      ORDER BY c.created_at DESC
    `)
    .all()
}

function getContactById(id) {
  return getDb().prepare(`SELECT * FROM contacts WHERE id = ?`).get(id)
}

function findContactByEmail(email) {
  return getDb().prepare(`SELECT * FROM contacts WHERE email = ?`).get(email)
}

function addContact(data) {
  const db = getDb()
  const defaults = {
    company: null, role: null, department: null, email: null, phone: null,
    linkedin_url: null, city: null, country: null, latitude: null, longitude: null,
    how_met: null, referred_by_id: null, notes: null, tags: null
  }
  data = { ...defaults, ...data }
  const stmt = db.prepare(`
    INSERT INTO contacts
      (first_name, last_name, company, role, department, email, phone, linkedin_url,
       city, country, latitude, longitude, how_met, referred_by_id, notes, tags)
    VALUES
      (@first_name, @last_name, @company, @role, @department, @email, @phone, @linkedin_url,
       @city, @country, @latitude, @longitude, @how_met, @referred_by_id, @notes, @tags)
  `)
  const result = stmt.run(data)
  return getContactById(result.lastInsertRowid)
}

// Columns that exist on the contacts table (excludes computed fields from SELECT)
const CONTACT_COLUMNS = new Set([
  'first_name', 'last_name', 'company', 'role', 'department', 'email', 'phone',
  'linkedin_url', 'city', 'country', 'latitude', 'longitude', 'how_met',
  'referred_by_id', 'notes', 'tags', 'strength', 'updated_at'
])

function updateContact(id, data) {
  const db = getDb()
  data.updated_at = new Date().toISOString()
  const clean = Object.fromEntries(Object.entries(data).filter(([k]) => CONTACT_COLUMNS.has(k)))
  const fields = Object.keys(clean).map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE contacts SET ${fields} WHERE id = @id`).run({ ...clean, id })
  return getContactById(id)
}

function deleteContact(id) {
  return getDb().prepare(`DELETE FROM contacts WHERE id = ?`).run(id)
}

// ── Outreach ──────────────────────────────────────────────────────────────────

function getAllOutreach() {
  return getDb()
    .prepare(
      `SELECT o.*, c.first_name, c.last_name, c.company, c.email
       FROM outreach o
       JOIN contacts c ON o.contact_id = c.id
       ORDER BY o.sent_date DESC`
    )
    .all()
}

function getOutreachByContact(contactId) {
  return getDb()
    .prepare(`SELECT * FROM outreach WHERE contact_id = ? ORDER BY sent_date DESC`)
    .all(contactId)
}

function addOutreach(data) {
  const db = getDb()
  const defaults = {
    status: 'sent', meeting_datetime: null, meeting_duration: null,
    meeting_location: null, meeting_topic: null, notes: null
  }
  data = { ...defaults, ...data }
  const stmt = db.prepare(`
    INSERT INTO outreach
      (contact_id, channel, sent_date, status, meeting_datetime, meeting_duration,
       meeting_location, meeting_topic, notes)
    VALUES
      (@contact_id, @channel, @sent_date, @status, @meeting_datetime, @meeting_duration,
       @meeting_location, @meeting_topic, @notes)
  `)
  const result = stmt.run(data)
  return db.prepare(`SELECT * FROM outreach WHERE id = ?`).get(result.lastInsertRowid)
}

function updateOutreach(id, data) {
  const db = getDb()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE outreach SET ${fields} WHERE id = @id`).run({ ...data, id })
  return db.prepare(`SELECT * FROM outreach WHERE id = ?`).get(id)
}

function updateOutreachStatus(id, status, meetingData = {}) {
  const db = getDb()
  const update = {
    status,
    meeting_datetime: meetingData.meeting_datetime || null,
    meeting_duration: meetingData.meeting_duration || null,
    meeting_location: meetingData.meeting_location || null,
    meeting_topic: meetingData.meeting_topic || null,
    gcal_event_id: meetingData.gcal_event_id || null,
    id
  }
  db.prepare(`
    UPDATE outreach SET
      status = @status,
      meeting_datetime = @meeting_datetime,
      meeting_duration = @meeting_duration,
      meeting_location = @meeting_location,
      meeting_topic = @meeting_topic,
      gcal_event_id = @gcal_event_id
    WHERE id = @id
  `).run(update)
  return db.prepare(`SELECT * FROM outreach WHERE id = ?`).get(id)
}

function deleteOutreach(id) {
  return getDb().prepare(`DELETE FROM outreach WHERE id = ?`).run(id)
}

// ── Interactions ──────────────────────────────────────────────────────────────

function getInteractionsByContact(contactId) {
  return getDb()
    .prepare(`SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC`)
    .all(contactId)
}

function addInteraction(data) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO interactions (contact_id, type, date, notes)
    VALUES (@contact_id, @type, @date, @notes)
  `)
  const result = stmt.run(data)
  return db.prepare(`SELECT * FROM interactions WHERE id = ?`).get(result.lastInsertRowid)
}

// ── Settings ──────────────────────────────────────────────────────────────────

function getAllSettings() {
  const rows = getDb().prepare(`SELECT key, value FROM settings`).all()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

function updateSetting(key, value) {
  getDb()
    .prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
    .run(key, value)
  return { key, value }
}

// ── Queries used by notifications / dashboard ─────────────────────────────────

function getOverdueContacts(windowDays) {
  return getDb()
    .prepare(
      `SELECT c.* FROM contacts c
       WHERE c.id IN (
         SELECT DISTINCT contact_id FROM outreach WHERE status = 'connected'
       )
       AND (
         SELECT MAX(date) FROM interactions WHERE contact_id = c.id
       ) < datetime('now', '-${windowDays} days')
       OR (
         c.id IN (SELECT DISTINCT contact_id FROM outreach WHERE status = 'connected')
         AND NOT EXISTS (SELECT 1 FROM interactions WHERE contact_id = c.id)
         AND (SELECT MIN(sent_date) FROM outreach WHERE contact_id = c.id) < datetime('now', '-${windowDays} days')
       )`
    )
    .all()
}

function getDashboardMetrics() {
  const db = getDb()
  const totalConnections = db
    .prepare(`SELECT COUNT(*) as count FROM contacts`)
    .get().count
  const outreachSent = db
    .prepare(`SELECT COUNT(*) as count FROM outreach`)
    .get().count
  const connected = db
    .prepare(`SELECT COUNT(*) as count FROM outreach WHERE status = 'connected'`)
    .get().count
  const meetingsThisMonth = db
    .prepare(
      `SELECT COUNT(*) as count FROM outreach
       WHERE status = 'connected'
       AND strftime('%Y-%m', meeting_datetime) = strftime('%Y-%m', 'now')`
    )
    .get().count
  const settings = getAllSettings()
  const windowDays = parseInt(settings.followup_window_days || '30')
  const overdueContacts = getOverdueContacts(windowDays)
  return { totalConnections, outreachSent, connected, meetingsThisMonth, overdueCount: overdueContacts.length }
}

function getRecentActivity(limit = 10) {
  return getDb()
    .prepare(
      `SELECT 'outreach' as event_type, o.id, o.sent_date as date, o.channel, o.status, o.notes,
              c.first_name, c.last_name, c.company
       FROM outreach o JOIN contacts c ON o.contact_id = c.id
       UNION ALL
       SELECT 'interaction' as event_type, i.id, i.date, i.type as channel, '' as status, i.notes,
              c.first_name, c.last_name, c.company
       FROM interactions i JOIN contacts c ON i.contact_id = c.id
       ORDER BY date DESC
       LIMIT ${limit}`
    )
    .all()
}

function getActivityHeatmap() {
  return getDb()
    .prepare(
      `SELECT strftime('%Y-%W', date) as week, COUNT(*) as count
       FROM interactions
       WHERE date >= datetime('now', '-84 days')
       GROUP BY week
       ORDER BY week`
    )
    .all()
}

export default {
  getDb,
  getAllContacts,
  getContactById,
  findContactByEmail,
  addContact,
  updateContact,
  deleteContact,
  getAllOutreach,
  getOutreachByContact,
  addOutreach,
  updateOutreach,
  updateOutreachStatus,
  deleteOutreach,
  getInteractionsByContact,
  addInteraction,
  getAllSettings,
  updateSetting,
  getOverdueContacts,
  getDashboardMetrics,
  getRecentActivity,
  getActivityHeatmap
}
