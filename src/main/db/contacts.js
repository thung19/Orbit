import { getDb } from './connection'

export function getAllContacts() {
  return getDb()
    .prepare(`
      SELECT c.*,
        (
          SELECT MAX(te.date) FROM thread_events te
          JOIN threads t ON te.thread_id = t.id
          WHERE t.contact_id = c.id
        ) AS last_contacted,
        (SELECT status FROM threads WHERE contact_id = c.id ORDER BY updated_at DESC LIMIT 1) AS latest_thread_status,
        (
          SELECT te.channel FROM thread_events te
          JOIN threads t ON te.thread_id = t.id
          WHERE t.contact_id = c.id AND te.channel IS NOT NULL
          ORDER BY te.date DESC LIMIT 1
        ) AS latest_channel,
        (SELECT COUNT(*) FROM threads WHERE contact_id = c.id) AS thread_count
      FROM contacts c
      ORDER BY c.created_at DESC
    `)
    .all()
}

export function getContactById(id) {
  return getDb().prepare(`SELECT * FROM contacts WHERE id = ?`).get(id)
}

export function findContactByEmail(email) {
  return getDb().prepare(`SELECT * FROM contacts WHERE email = ?`).get(email)
}

export function addContact(data) {
  const db = getDb()
  const defaults = {
    company: null, role: null, department: null, email: null, phone: null,
    linkedin_url: null, city: null, country: null, latitude: null, longitude: null,
    how_met: null, referred_by_id: null, referral_status: null, notes: null, tags: null
  }
  data = { ...defaults, ...data }
  const stmt = db.prepare(`
    INSERT INTO contacts
      (first_name, last_name, company, role, department, email, phone, linkedin_url,
       city, country, latitude, longitude, how_met, referred_by_id, referral_status, notes, tags)
    VALUES
      (@first_name, @last_name, @company, @role, @department, @email, @phone, @linkedin_url,
       @city, @country, @latitude, @longitude, @how_met, @referred_by_id, @referral_status, @notes, @tags)
  `)
  const result = stmt.run(data)
  return getContactById(result.lastInsertRowid)
}

// Columns that exist on the contacts table (excludes computed fields from SELECT)
const CONTACT_COLUMNS = new Set([
  'first_name', 'last_name', 'company', 'role', 'department', 'email', 'phone',
  'linkedin_url', 'city', 'country', 'latitude', 'longitude', 'how_met',
  'referred_by_id', 'referral_status', 'notes', 'tags', 'strength', 'updated_at'
])

export function updateContact(id, data) {
  const db = getDb()
  data.updated_at = new Date().toISOString()
  const clean = Object.fromEntries(Object.entries(data).filter(([k]) => CONTACT_COLUMNS.has(k)))
  const fields = Object.keys(clean).map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE contacts SET ${fields} WHERE id = @id`).run({ ...clean, id })
  return getContactById(id)
}

export function deleteContact(id) {
  return getDb().prepare(`DELETE FROM contacts WHERE id = ?`).run(id)
}

export function getOverdueContacts(windowDays) {
  return getDb()
    .prepare(`
      SELECT c.* FROM contacts c
      WHERE c.id IN (
        SELECT DISTINCT contact_id FROM threads WHERE status = 'open'
      )
      AND COALESCE(
        (
          SELECT MAX(te.date) FROM thread_events te
          JOIN threads t ON te.thread_id = t.id
          WHERE t.contact_id = c.id
        ),
        datetime('now', '-999 days')
      ) < datetime('now', '-' || ? || ' days')
    `)
    .all(windowDays)
}
