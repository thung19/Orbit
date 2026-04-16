import { getDb } from './connection'
import {
  getAllContacts, getContactById, findContactByEmail,
  addContact, updateContact, deleteContact, getOverdueContacts
} from './contacts'
import {
  getAllOutreach, getOutreachByContact, addOutreach,
  updateOutreach, updateOutreachStatus, deleteOutreach
} from './outreach'
import { getAllInteractions, getInteractionsByContact, addInteraction } from './interactions'
import { getAllSettings, updateSetting } from './settings'
import { getDashboardMetrics, getRecentActivity, getActivityHeatmap } from './dashboard'
import {
  getAllThreads, getThreadsByContact, addThread, updateThread, deleteThread,
  addEvent, updateEvent, deleteEvent, getMeetings
} from './threads'

export default {
  getDb,
  // Contacts
  getAllContacts, getContactById, findContactByEmail,
  addContact, updateContact, deleteContact, getOverdueContacts,
  // Legacy outreach (kept for backward compat / export)
  getAllOutreach, getOutreachByContact, addOutreach,
  updateOutreach, updateOutreachStatus, deleteOutreach,
  // Legacy interactions (kept for backward compat / export)
  getAllInteractions, getInteractionsByContact, addInteraction,
  // Settings
  getAllSettings, updateSetting,
  // Dashboard
  getDashboardMetrics, getRecentActivity, getActivityHeatmap,
  // Threads
  getAllThreads, getThreadsByContact, addThread, updateThread, deleteThread,
  // Thread events
  addEvent, updateEvent, deleteEvent, getMeetings
}
