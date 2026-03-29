import { google } from 'googleapis'
import { shell } from 'electron'
import http from 'http'
import url from 'url'
import db from './db'

// In v1, store credentials here (personal use only)
// Replace these with your own Google Cloud OAuth2 credentials
const CLIENT_ID = process.env.GCAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.GCAL_CLIENT_SECRET || ''
const REDIRECT_URI = 'http://localhost:3737/oauth2callback'

function getOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

function getSavedTokens() {
  const settings = db.getAllSettings()
  const raw = settings.gcal_tokens
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function connect() {
  const oAuth2Client = getOAuthClient()
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events']
  })

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url, true)
      if (parsed.pathname === '/oauth2callback') {
        const code = parsed.query.code
        res.end('<html><body><h2>Orbit: Calendar connected! You can close this tab.</h2></body></html>')
        server.close()
        try {
          const { tokens } = await oAuth2Client.getToken(code)
          db.updateSetting('gcal_tokens', JSON.stringify(tokens))
          db.updateSetting('gcal_enabled', 'true')
          resolve({ success: true })
        } catch (err) {
          reject(err)
        }
      }
    })
    server.listen(3737, () => shell.openExternal(authUrl))
  })
}

async function createEvent(eventData) {
  const tokens = getSavedTokens()
  if (!tokens) throw new Error('Google Calendar not connected')

  const oAuth2Client = getOAuthClient()
  oAuth2Client.setCredentials(tokens)

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

  const result = await calendar.events.insert({
    calendarId: 'primary',
    resource: eventData
  })
  return result.data
}

export { connect, createEvent }
