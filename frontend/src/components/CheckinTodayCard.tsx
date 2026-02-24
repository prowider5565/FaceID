type Shift = 'Day' | 'Night'

type CheckinEmployee = {
  id: number
  fullName: string
  position: string
  shift: Shift
  checkInAt: string | null
}

type CheckinTodayCardProps = {
  employees: CheckinEmployee[]
}

function CheckinTodayCard({ employees }: CheckinTodayCardProps) {
  return (
    <article className="checkin-summary">
      <h2>Today&apos;s Check-in Status (real-time)</h2>

      <div className="employee-checkin-cards">
        {employees.map((employee) => (
          <article key={employee.id} className="employee-checkin-card">
            <div>
              <p className="employee-name">{employee.fullName}</p>
              <p className="employee-meta">
                {employee.position} • {employee.shift} Shift
              </p>
            </div>
            <p className="employee-checkin-time">
              {employee.checkInAt
                ? new Date(employee.checkInAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Not checked in yet'}
            </p>
          </article>
        ))}
      </div>
    </article>
  )
}

export default CheckinTodayCard
