import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('orbit', {
  // Contacts
  getContacts: () => ipcRenderer.invoke('contacts:getAll'),
  addContact: (data) => ipcRenderer.invoke('contacts:add', data),
  updateContact: (id, data) => ipcRenderer.invoke('contacts:update', id, data),
  deleteContact: (id) => ipcRenderer.invoke('contacts:delete', id),

  // Outreach
  getOutreach: () => ipcRenderer.invoke('outreach:getAll'),
  addOutreach: (data) => ipcRenderer.invoke('outreach:add', data),
  updateOutreach: (id, data) => ipcRenderer.invoke('outreach:update', id, data),
  updateOutreachStatus: (id, status, meetingData) =>
    ipcRenderer.invoke('outreach:updateStatus', id, status, meetingData),
  deleteOutreach: (id) => ipcRenderer.invoke('outreach:delete', id),

  // Interactions
  getInteractions: (contactId) => ipcRenderer.invoke('interactions:getAll', contactId),
  addInteraction: (data) => ipcRenderer.invoke('interactions:add', data),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  updateSetting: (key, value) => ipcRenderer.invoke('settings:update', key, value),

  // Dashboard
  getDashboardMetrics: () => ipcRenderer.invoke('dashboard:metrics'),
  getRecentActivity: (limit) => ipcRenderer.invoke('dashboard:recentActivity', limit),
  getActivityHeatmap: () => ipcRenderer.invoke('dashboard:heatmap'),

  // Google Calendar
  connectGCal: () => ipcRenderer.invoke('gcal:connect'),
  createCalendarEvent: (eventData) => ipcRenderer.invoke('gcal:createEvent', eventData),

  // Gmail
  scanGmail: () => ipcRenderer.invoke('gmail:scan'),

  // Export
  exportData: () => ipcRenderer.invoke('data:export')
})
