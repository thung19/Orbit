import { google } from 'googleapis'
import { shell } from 'electron'
import http from 'http'
import url from 'url'
import db from '../db'

const REDIRECT_URI = 'http://localhost:3737/oauth2callback'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly'
]

// Build-time credentials (injected via electron.vite.config.js define)
const BUILT_IN_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const BUILT_IN_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

function getCredentials() {
  const clientId = BUILT_IN_CLIENT_ID || ''
  const clientSecret = BUILT_IN_CLIENT_SECRET || ''
  if (clientId && clientSecret) return { clientId, clientSecret }

  // Fallback to DB-stored credentials (dev/manual override)
  const settings = db.getAllSettings()
  return {
    clientId: settings.google_client_id || '',
    clientSecret: settings.google_client_secret || ''
  }
}

function createOAuthClient() {
  const { clientId, clientSecret } = getCredentials()
  if (!clientId || !clientSecret) {
    throw new Error('Google API credentials not configured. Add them in Settings → Google API Credentials.')
  }
  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)
}

function getSavedTokens() {
  const settings = db.getAllSettings()
  const raw = settings.google_tokens
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function getAuthedClient() {
  const tokens = getSavedTokens()
  if (!tokens) throw new Error('Google account not connected. Sign in via Settings.')
  const client = createOAuthClient()
  client.setCredentials(tokens)
  return client
}

async function connect() {
  const oAuth2Client = createOAuthClient()
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  })

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url, true)
      if (parsed.pathname === '/oauth2callback') {
        const code = parsed.query.code
        res.end('<html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0"><h2>Orbit: Google account connected! You can close this tab.</h2></body></html>')
        server.close()
        try {
          const { tokens } = await oAuth2Client.getToken(code)
          db.updateSetting('google_tokens', JSON.stringify(tokens))
          db.updateSetting('google_connected', 'true')
          resolve({ success: true })
        } catch (err) {
          reject(err)
        }
      }
    })
    server.listen(3737, () => shell.openExternal(authUrl))
  })
}

function disconnect() {
  db.updateSetting('google_tokens', '')
  db.updateSetting('google_connected', 'false')
  return { success: true }
}

function isConnected() {
  const settings = db.getAllSettings()
  return settings.google_connected === 'true' && !!getSavedTokens()
}

export { connect, disconnect, isConnected, getAuthedClient, createOAuthClient }
