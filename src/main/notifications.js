import { Notification } from 'electron'
import db from './db'

function scheduleFollowUpChecks() {
  const CHECK_INTERVAL = 1000 * 60 * 60 // hourly

  const check = () => {
    try {
      const settings = db.getAllSettings()
      const windowDays = parseInt(settings.followup_window_days || '30')
      const overdue = db.getOverdueContacts(windowDays)
      if (overdue.length > 0) {
        new Notification({
          title: 'Orbit — Follow-up needed',
          body: `${overdue.length} contact${overdue.length > 1 ? 's' : ''} need${overdue.length === 1 ? 's' : ''} a follow-up.`
        }).show()
      }
    } catch (err) {
      console.error('Notification check error:', err)
    }
  }

  // Run once after 5 seconds on startup, then on interval
  setTimeout(check, 5000)
  setInterval(check, CHECK_INTERVAL)
}

export { scheduleFollowUpChecks }
