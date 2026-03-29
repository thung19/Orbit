import { ipcMain } from 'electron'
import db from './db'

function registerHandlers() {
  // ── Contacts ────────────────────────────────────────────────────────────────
  ipcMain.handle('contacts:getAll', () => db.getAllContacts())

  ipcMain.handle('contacts:add', (_, data) => db.addContact(data))

  ipcMain.handle('contacts:update', (_, id, data) => db.updateContact(id, data))

  ipcMain.handle('contacts:delete', (_, id) => {
    db.deleteContact(id)
    return { success: true }
  })

  // ── Outreach ─────────────────────────────────────────────────────────────────
  ipcMain.handle('outreach:getAll', () => db.getAllOutreach())

  ipcMain.handle('outreach:add', (_, data) => db.addOutreach(data))

  ipcMain.handle('outreach:update', (_, id, data) => db.updateOutreach(id, data))

  ipcMain.handle('outreach:updateStatus', (_, id, status, meetingData) =>
    db.updateOutreachStatus(id, status, meetingData)
  )

  ipcMain.handle('outreach:delete', (_, id) => db.deleteOutreach(id))

  // ── Interactions ──────────────────────────────────────────────────────────────
  ipcMain.handle('interactions:getAll', (_, contactId) =>
    db.getInteractionsByContact(contactId)
  )

  ipcMain.handle('interactions:add', (_, data) => db.addInteraction(data))

  // ── Settings ──────────────────────────────────────────────────────────────────
  ipcMain.handle('settings:getAll', () => db.getAllSettings())

  ipcMain.handle('settings:update', (_, key, value) => db.updateSetting(key, value))

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  ipcMain.handle('dashboard:metrics', () => db.getDashboardMetrics())

  ipcMain.handle('dashboard:recentActivity', (_, limit) => db.getRecentActivity(limit))

  ipcMain.handle('dashboard:heatmap', () => db.getActivityHeatmap())

  // ── Google Calendar (stub — wired in gcal.js) ─────────────────────────────────
  ipcMain.handle('gcal:connect', async () => {
    const gcal = await import('./gcal')
    return gcal.connect()
  })

  ipcMain.handle('gcal:createEvent', async (_, eventData) => {
    const gcal = await import('./gcal')
    return gcal.createEvent(eventData)
  })

  // ── Gmail ─────────────────────────────────────────────────────────────────────
  ipcMain.handle('gmail:scan', async () => {
    const gmail = await import('./gmail')
    return gmail.scan()
  })

  // ── Export ────────────────────────────────────────────────────────────────────
  ipcMain.handle('data:export', () => {
    return {
      exported_at: new Date().toISOString(),
      version: '1.0',
      contacts: db.getAllContacts(),
      outreach: db.getAllOutreach(),
      interactions: db.getAllSettings(),
      settings: db.getAllSettings()
    }
  })
}

export { registerHandlers }
