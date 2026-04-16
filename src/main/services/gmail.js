import { google } from 'googleapis'
import db from '../db'
import { getAuthedClient } from './google-auth'

async function scan() {
  const auth = getAuthedClient()
  const gmail = google.gmail({ version: 'v1', auth })
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const afterDate = `${cutoff.getFullYear()}/${String(cutoff.getMonth() + 1).padStart(2, '0')}/${String(cutoff.getDate()).padStart(2, '0')}`

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `in:sent after:${afterDate}`,
    maxResults: 200
  })

  const messages = listRes.data.messages || []
  const contacts = db.getAllContacts()
  const emailMap = Object.fromEntries(
    contacts.filter((c) => c.email).map((c) => [c.email.toLowerCase(), c])
  )

  let found = 0
  let withReplies = 0

  for (const msg of messages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['To', 'Date']
      })
      const headers = detail.data.payload.headers
      const toHeader = headers.find((h) => h.name === 'To')?.value || ''
      const dateHeader = headers.find((h) => h.name === 'Date')?.value
      const sentDate = dateHeader ? new Date(dateHeader).toISOString().split('T')[0] : null

      // Extract email addresses from To header
      const toEmails = toHeader.match(/[\w.+-]+@[\w.-]+\.\w+/g) || []

      for (const toEmail of toEmails) {
        const contact = emailMap[toEmail.toLowerCase()]
        if (!contact) continue

        const existing = db.getAllOutreach().find(
          (o) => o.contact_id === contact.id && Math.abs(new Date(o.sent_date) - new Date(sentDate)) < 7 * 86400000
        )
        if (existing) continue

        db.addOutreach({
          contact_id: contact.id,
          channel: 'email',
          sent_date: sentDate,
          status: 'sent',
          notes: 'Imported from Gmail scan'
        })
        found++

        // Check if thread has replies
        try {
          const threadRes = await gmail.users.threads.get({ userId: 'me', id: detail.data.threadId, format: 'minimal' })
          if (threadRes.data.messages.length > 1) withReplies++
        } catch (_) { /* thread fetch failed, skip reply check */ }
      }
    } catch (err) {
      console.warn('Failed to fetch Gmail message:', msg.id, err.message)
      continue
    }
  }

  return { found, withReplies, message: `Found ${found} outreach emails, ${withReplies} have replies` }
}

export { scan }
