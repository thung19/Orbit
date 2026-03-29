export function computeStrength(interactions, settings) {
  if (!interactions || interactions.length === 0) return 0
  const weightMeeting = parseInt(settings?.strength_weight_meeting || '3')
  const weightEmail = parseInt(settings?.strength_weight_email_reply || '1')
  const weightLinkedin = parseInt(settings?.strength_weight_linkedin_reply || '1')
  const decayEnabled = settings?.strength_decay_enabled === 'true'
  const decayDays = parseInt(settings?.strength_decay_days || '30')

  let score = 0
  const now = new Date()

  for (const interaction of interactions) {
    let weight = 1
    if (interaction.type === 'meeting') weight = weightMeeting
    else if (interaction.type === 'email_reply') weight = weightEmail
    else if (interaction.type === 'linkedin_reply') weight = weightLinkedin

    if (decayEnabled) {
      const daysSince = (now - new Date(interaction.date)) / 86400000
      const decayFactor = Math.max(0, 1 - daysSince / (decayDays * 10))
      weight *= decayFactor
    }
    score += weight
  }

  return Math.min(5, Math.round(score))
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

export function StrengthDots({ score }) {
  return (
    <span className="strength-dots">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`strength-dot${n <= score ? ' filled' : ''}`} />
      ))}
    </span>
  )
}

export function channelLabel(channel) {
  const map = {
    linkedin: 'LinkedIn',
    email: 'Email',
    phone: 'Phone',
    in_person: 'In Person',
    other: 'Other'
  }
  return map[channel] || channel
}

export function channelBadgeClass(channel) {
  const map = {
    linkedin: 'badge-blue',
    email: 'badge-purple',
    phone: 'badge-green',
    in_person: 'badge-yellow',
    other: 'badge-red'
  }
  return map[channel] || 'badge-purple'
}

export function statusBadgeClass(status) {
  const map = {
    sent: 'badge-yellow',
    connected: 'badge-green',
    declined: 'badge-red'
  }
  return map[status] || 'badge-purple'
}
