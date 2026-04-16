import { google } from 'googleapis'
import { getAuthedClient } from './google-auth'

async function createEvent(eventData) {
  const auth = getAuthedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const result = await calendar.events.insert({
    calendarId: 'primary',
    resource: eventData
  })
  return result.data
}

export { createEvent }
