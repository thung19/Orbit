import { formatDate, daysSince, channelLabel, channelBadgeClass } from '../utils.jsx'
import { avatarClass } from './StatusBadge'

export default function OutreachCard({ item, onConnect, onDecline, onEdit, onDelete }) {
  const days = daysSince(item.sent_date)
  const isUrgent = days > 14

  return (
    <div className={`outreach-card${isUrgent ? ' urgent' : ''}`}>
      <div className="outreach-card-top">
        <div className={`outreach-avatar${avatarClass(item.status)}`}>
          {item.first_name[0]}{item.last_name[0]}
        </div>
        <div className="outreach-card-info">
          <div className="outreach-contact-name">{item.first_name} {item.last_name}</div>
          {item.company && <div className="outreach-company">{item.company}</div>}
        </div>
        <div className="outreach-card-secondary">
          <button className="btn-icon" onClick={() => onEdit(item)} title="Edit">✎</button>
          <button className="btn-icon btn-icon-danger" onClick={() => onDelete(item.id)} title="Delete">✕</button>
        </div>
      </div>

      <div className="outreach-card-detail">
        <span className={`badge ${channelBadgeClass(item.channel)}`}>{channelLabel(item.channel)}</span>
        <span className="outreach-date">{formatDate(item.sent_date)}</span>
        <span className={`outreach-days${isUrgent ? ' urgent' : ''}`}>{days}d</span>
      </div>

      {item.notes && <p className="outreach-notes">{item.notes}</p>}

      {item.status === 'connected' && item.meeting_datetime && (
        <div className="outreach-meeting">
          <div className="meeting-time">{formatDate(item.meeting_datetime)}</div>
          {item.meeting_topic && <div className="meeting-topic">{item.meeting_topic}</div>}
          {item.meeting_location && <div className="meeting-location">{item.meeting_location}</div>}
        </div>
      )}

      {onConnect && (
        <div className="outreach-card-actions">
          <button className="btn-primary" onClick={() => onConnect(item)}>Mark Connected</button>
          <button className="btn-ghost" onClick={() => onDecline(item.id)}>Cancel</button>
        </div>
      )}
    </div>
  )
}
