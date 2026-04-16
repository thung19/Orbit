import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('orbit', {
  // Contacts
  getContacts:   ()         => ipcRenderer.invoke('contacts:getAll'),
  addContact:    (data)     => ipcRenderer.invoke('contacts:add', data),
  updateContact: (id, data) => ipcRenderer.invoke('contacts:update', id, data),
  deleteContact: (id)       => ipcRenderer.invoke('contacts:delete', id),

  // Threads
  getThreads:          ()         => ipcRenderer.invoke('threads:getAll'),
  getThreadsByContact: (cid)      => ipcRenderer.invoke('threads:getByContact', cid),
  addThread:           (data)     => ipcRenderer.invoke('threads:add', data),
  updateThread:        (id, data) => ipcRenderer.invoke('threads:update', id, data),
  deleteThread:        (id)       => ipcRenderer.invoke('threads:delete', id),

  // Thread Events
  addEvent:    (data)     => ipcRenderer.invoke('events:add', data),
  updateEvent: (id, data) => ipcRenderer.invoke('events:update', id, data),
  deleteEvent: (id)       => ipcRenderer.invoke('events:delete', id),

  // Meetings
  getMeetings: () => ipcRenderer.invoke('meetings:getAll'),

  // Settings
  getSettings:   ()         => ipcRenderer.invoke('settings:getAll'),
  updateSetting: (key, val) => ipcRenderer.invoke('settings:update', key, val),

  // Dashboard
  getDashboardMetrics: ()      => ipcRenderer.invoke('dashboard:metrics'),
  getRecentActivity:   (limit) => ipcRenderer.invoke('dashboard:recentActivity', limit),
  getActivityHeatmap:  ()      => ipcRenderer.invoke('dashboard:heatmap'),

  // Google Auth
  connectGoogle:    () => ipcRenderer.invoke('google:connect'),
  disconnectGoogle: () => ipcRenderer.invoke('google:disconnect'),
  getGoogleStatus:  () => ipcRenderer.invoke('google:status'),

  // Google Calendar
  createCalendarEvent: (eventData) => ipcRenderer.invoke('gcal:createEvent', eventData),

  // Gmail
  scanGmail: () => ipcRenderer.invoke('gmail:scan'),

  // Export
  exportData: () => ipcRenderer.invoke('data:export')
})
