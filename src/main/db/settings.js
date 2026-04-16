import { getDb } from './connection'

export function getAllSettings() {
  const rows = getDb().prepare(`SELECT key, value FROM settings`).all()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export function updateSetting(key, value) {
  getDb()
    .prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
    .run(key, value)
  return { key, value }
}
