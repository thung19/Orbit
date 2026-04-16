export function outreachStatusBadge(status) {
  if (!status) return null
  const map = {
    sent:      { label: 'Awaiting reply', cls: 'badge-yellow' },
    connected: { label: 'Connected',      cls: 'badge-green'  },
    declined:  { label: 'Declined',       cls: 'badge-red'    },
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge-purple' }
  return <span className={`badge ${cls}`}>{label}</span>
}

export function avatarClass(status) {
  if (status === 'connected') return ' avatar-connected'
  if (status === 'sent') return ' avatar-pending'
  if (status === 'declined') return ' avatar-declined'
  return ''
}
