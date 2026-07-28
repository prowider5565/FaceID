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

type DirectionMeta = {
  key: 'in' | 'out'
  label: string
}

const getDirectionMeta = (direction: string | null): DirectionMeta | null => {
  if (!direction) return null
  const normalized = direction.trim().toLowerCase()

  if (normalized === 'checkin' || normalized === 'check_in' || normalized === 'in' || normalized === 'check-in') {
    return { key: 'in', label: 'Check-in' }
  }

  if (normalized === 'checkout' || normalized === 'check_out' || normalized === 'out' || normalized === 'check-out') {
    return { key: 'out', label: 'Check-out' }
  }

  return null
}

function CheckinTodayCard({ events }: CheckinTodayCardProps) {
  return (
    <article className="checkin-summary">
      <h2>Today&apos;s Check-in Status (real-time)</h2>

      <div className="employee-checkin-body">
        {events.length === 0 ? (
          <div className="employee-checkin-empty" role="status" aria-live="polite">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="employee-checkin-empty-icon">
              <path d="M8 3v3M16 3v3" />
              <path d="M3.5 9h17" />
              <path d="M6.5 6h11A3 3 0 0 1 20.5 9v10A3 3 0 0 1 17.5 22h-11A3 3 0 0 1 3.5 19V9a3 3 0 0 1 3-3Z" />
              <path d="M9 14h6" />
              <path d="M9 18h4" />
            </svg>
            <p>No attendance record for now</p>
          </div>
        ) : (
          <div className="employee-checkin-list">
            {events.map((event) => {
              const directionMeta = getDirectionMeta(event.direction)

              return (
                <article key={event.eventId} className="employee-checkin-card">
                  <div>
                    <p className="employee-name">{event.fullName}</p>
                    <p className="employee-meta">
                      {event.position} • {event.shift} Shift
                    </p>
                  </div>
                  <div className="employee-checkin-time">
                    <p className="employee-checkin-time-value">
                      {event.checkInAt
                        ? new Date(event.checkInAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Not checked in yet'}
                    </p>
                    {directionMeta ? (
                      <p className={`employee-checkin-direction employee-checkin-direction-${directionMeta.key}`}>
                        {directionMeta.key === 'in' ? (
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M3.5 10h12" />
                            <path d="M11 5.5 15.5 10 11 14.5" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M16.5 10h-12" />
                            <path d="M9 5.5 4.5 10 9 14.5" />
                          </svg>
                        )}
                        {directionMeta.label}
                      </p>
                    ) : event.direction ? (
                      <p className="employee-checkin-direction">{event.direction}</p>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}

export default CheckinTodayCard
