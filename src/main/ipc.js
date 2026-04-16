import { ipcMain } from 'electron'
import db from './db'

function registerHandlers() {
  // ── Contacts ──────────────────────────────────────────────────────────────────
  ipcMain.handle('contacts:getAll',    ()         => db.getAllContacts())
  ipcMain.handle('contacts:add',       (_, data)  => db.addContact(data))
  ipcMain.handle('contacts:update',    (_, id, data) => db.updateContact(id, data))
  ipcMain.handle('contacts:delete',    (_, id)    => { db.deleteContact(id); return { success: true } })

  // ── Threads ───────────────────────────────────────────────────────────────────
  ipcMain.handle('threads:getAll',        ()           => db.getAllThreads())
  ipcMain.handle('threads:getByContact',  (_, cid)     => db.getThreadsByContact(cid))
  ipcMain.handle('threads:add',           (_, data)    => db.addThread(data))
  ipcMain.handle('threads:update',        (_, id, data) => db.updateThread(id, data))
  ipcMain.handle('threads:delete',        (_, id)      => { db.deleteThread(id); return { success: true } })

  // ── Thread Events ─────────────────────────────────────────────────────────────
  ipcMain.handle('events:add',    (_, data)     => db.addEvent(data))
  ipcMain.handle('events:update', (_, id, data) => db.updateEvent(id, data))
  ipcMain.handle('events:delete', (_, id)       => { db.deleteEvent(id); return { success: true } })

  // ── Meetings ──────────────────────────────────────────────────────────────────
  ipcMain.handle('meetings:getAll', () => db.getMeetings())

  // ── Legacy Outreach (kept for data export) ────────────────────────────────────
  ipcMain.handle('outreach:getAll',        () => db.getAllOutreach())
  ipcMain.handle('outreach:add',           (_, data) => db.addOutreach(data))
  ipcMain.handle('outreach:update',        (_, id, data) => db.updateOutreach(id, data))
  ipcMain.handle('outreach:updateStatus',  (_, id, status, meetingData) => db.updateOutreachStatus(id, status, meetingData))
  ipcMain.handle('outreach:delete',        (_, id) => db.deleteOutreach(id))

  // ── Legacy Interactions (kept for data export) ────────────────────────────────
  ipcMain.handle('interactions:getAll', (_, contactId) => db.getInteractionsByContact(contactId))
  ipcMain.handle('interactions:add',    (_, data)      => db.addInteraction(data))

  // ── Settings ──────────────────────────────────────────────────────────────────
  ipcMain.handle('settings:getAll',   ()           => db.getAllSettings())
  ipcMain.handle('settings:update',   (_, key, val) => db.updateSetting(key, val))

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  ipcMain.handle('dashboard:metrics',        () => db.getDashboardMetrics())
  ipcMain.handle('dashboard:recentActivity', (_, limit) => db.getRecentActivity(limit))
  ipcMain.handle('dashboard:heatmap',        () => db.getActivityHeatmap())

  // ── Google Auth ────────────────────────────────────────────────────────────
  ipcMain.handle('google:connect', async () => {
    const auth = await import('./services/google-auth')
    return auth.connect()
  })
  ipcMain.handle('google:disconnect', async () => {
    const auth = await import('./services/google-auth')
    return auth.disconnect()
  })
  ipcMain.handle('google:status', async () => {
    const auth = await import('./services/google-auth')
    return { connected: auth.isConnected() }
  })

  // ── Google Calendar ───────────────────────────────────────────────────────────
  ipcMain.handle('gcal:createEvent', async (_, eventData) => {
    const gcal = await import('./services/gcal')
    return gcal.createEvent(eventData)
  })

  // ── Gmail ─────────────────────────────────────────────────────────────────────
  ipcMain.handle('gmail:scan', async () => {
    const gmail = await import('./services/gmail')
    return gmail.scan()
  })

  // ── Export ────────────────────────────────────────────────────────────────────
  ipcMain.handle('data:export', () => ({
    exported_at: new Date().toISOString(),
    version: '2.0',
    contacts:     db.getAllContacts(),
    threads:      db.getAllThreads(),
    legacy_outreach:      db.getAllOutreach(),
    legacy_interactions:  db.getAllInteractions(),
    settings:     db.getAllSettings()
  }))
}

export { registerHandlers }
