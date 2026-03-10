type AttendanceStatus = {
  status: 'Present' | 'Absent' | 'Late' | 'Day off'
  count: number
  color: string
}

type AttendancePieCardProps = {
  statuses: AttendanceStatus[]
  valueMode?: 'count' | 'percentage'
}

function AttendancePieCard({ statuses, valueMode = 'count' }: AttendancePieCardProps) {
  const totalEmployees = statuses.reduce((sum, item) => sum + item.count, 0)
  let cumulative = 0

  const pieGradient =
    totalEmployees > 0
      ? statuses
          .map((item) => {
            const start =
              valueMode === 'percentage' ? cumulative : (cumulative / totalEmployees) * 100
            cumulative += item.count
            const end =
              valueMode === 'percentage' ? cumulative : (cumulative / totalEmployees) * 100
            return `${item.color} ${start}% ${end}%`
          })
          .join(', ')
      : '#e2e8f0 0% 100%'

  return (
    <article className="attendance-summary" aria-label="Attendance status chart">
      <h2>Employees Attendance</h2>
      <div className="attendance-chart-row">
        <div
          className="attendance-pie"
          style={{ background: `conic-gradient(${pieGradient})` }}
          role="img"
          aria-label="Employees attendance status distribution pie chart"
        />
        <ul className="attendance-legend">
          {statuses.map((item) => {
            const percentage =
              valueMode === 'percentage'
                ? item.count.toFixed(1)
                : totalEmployees > 0
                  ? ((item.count / totalEmployees) * 100).toFixed(1)
                  : '0.0'

            return (
              <li key={item.status}>
                <span className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: item.color }} />
                  {item.status}
                </span>
                <span className="legend-value">
                  {valueMode === 'percentage' ? `${percentage}%` : `${item.count} (${percentage}%)`}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}

export default AttendancePieCard
