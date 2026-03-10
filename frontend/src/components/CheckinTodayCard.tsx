type Shift = 'Day' | 'Night'

type CheckinEvent = {
  eventId: number
  userId: number
  fullName: string
  position: string
  shift: Shift
  checkInAt: string | null
  direction: string | null
}

type CheckinTodayCardProps = {
  events: CheckinEvent[]
}

function CheckinTodayCard({ events }: CheckinTodayCardProps) {
  return (
    <article className="checkin-summary">
      <h2>Today&apos;s Check-in Status (real-time)</h2>

      <div className="employee-checkin-cards">
        {events.map((event) => (
          <article key={event.eventId} className="employee-checkin-card">
            <div>
              <p className="employee-name">{event.fullName}</p>
              <p className="employee-meta">
                {event.position} • {event.shift} Shift
              </p>
            </div>
            <p className="employee-checkin-time">
              {event.checkInAt
                ? new Date(event.checkInAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Not checked in yet'}
              {event.direction ? ` • ${event.direction}` : ''}
            </p>
          </article>
        ))}
      </div>
    </article>
  )
}

export default CheckinTodayCard
