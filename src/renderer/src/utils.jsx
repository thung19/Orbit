export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

export function channelLabel(channel) {
  const map = { linkedin: 'LinkedIn', email: 'Email', phone: 'Phone', in_person: 'In Person', other: 'Other' }
  return map[channel] || channel
}

export function channelBadgeClass(channel) {
  const map = { linkedin: 'badge-blue', email: 'badge-purple', phone: 'badge-green', in_person: 'badge-yellow', other: 'badge-red' }
  return map[channel] || 'badge-purple'
}

// ── Thread / Event helpers ────────────────────────────────────────────────────

export function intentLabel(intent) {
  const map = {
    networking_call: 'Networking',
    advice:          'Advice',
    referral:        'Referral',
    opportunity:     'Opportunity',
    maintenance:     'Check-in',
    other:           'Other'
  }
  return map[intent] || intent
}

export function intentBadgeClass(intent) {
  const map = {
    networking_call: 'badge-blue',
    advice:          'badge-purple',
    referral:        'badge-green',
    opportunity:     'badge-yellow',
    maintenance:     'badge-purple',
    other:           'badge-purple'
  }
  return map[intent] || 'badge-purple'
}

export function threadStatusLabel(status) {
  return status === 'closed' ? 'Closed' : 'Open'
}

export function threadStatusBadgeClass(status) {
  return status === 'closed' ? 'badge-red' : 'badge-green'
}

export function eventTypeLabel(type) {
  const map = { message: 'Message', reply: 'Reply', meeting: 'Meeting', call: 'Call', note: 'Note' }
  return map[type] || type
}
