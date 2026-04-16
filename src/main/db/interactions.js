import { getDb } from './connection'

export function getAllInteractions() {
  return getDb()
    .prepare(`SELECT * FROM interactions ORDER BY date DESC`)
    .all()
}

export function getInteractionsByContact(contactId) {
  return getDb()
    .prepare(`SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC`)
    .all(contactId)
}

export function addInteraction(data) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO interactions (contact_id, type, date, notes)
    VALUES (@contact_id, @type, @date, @notes)
  `)
  const result = stmt.run(data)
  return db.prepare(`SELECT * FROM interactions WHERE id = ?`).get(result.lastInsertRowid)
}
