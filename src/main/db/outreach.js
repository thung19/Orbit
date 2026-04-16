import { getDb } from './connection'

export function getAllOutreach() {
  return getDb()
    .prepare(
      `SELECT o.*, c.first_name, c.last_name, c.company, c.email
       FROM outreach o
       JOIN contacts c ON o.contact_id = c.id
       ORDER BY o.sent_date DESC`
    )
    .all()
}

export function getOutreachByContact(contactId) {
  return getDb()
    .prepare(`SELECT * FROM outreach WHERE contact_id = ? ORDER BY sent_date DESC`)
    .all(contactId)
}

export function addOutreach(data) {
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

export function updateOutreach(id, data) {
  const db = getDb()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE outreach SET ${fields} WHERE id = @id`).run({ ...data, id })
  return db.prepare(`SELECT * FROM outreach WHERE id = ?`).get(id)
}

export function updateOutreachStatus(id, status, meetingData = {}) {
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

export function deleteOutreach(id) {
  return getDb().prepare(`DELETE FROM outreach WHERE id = ?`).run(id)
}
