type MetricLabel = 'Cameras' | 'Employees' | 'Admins' | 'Managers'

type SystemMetric = {
  label: MetricLabel
  count: number
}

type CountCardsProps = {
  metrics: SystemMetric[]
}

const renderMetricIcon = (label: MetricLabel) => {
  if (label === 'Employees') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="6.5" cy="6.2" r="2.3" />
        <circle cx="13.8" cy="7.2" r="1.9" />
        <path d="M2.8 14.8c0-2.3 1.9-4.2 4.2-4.2h0.8c2.3 0 4.2 1.9 4.2 4.2" />
        <path d="M11.3 14.8c0-1.7 1.4-3 3-3h0.6c1.7 0 3 1.3 3 3" />
      </svg>
    )
  }

  if (label === 'Cameras') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="5" width="14" height="10" rx="2" />
        <circle cx="10" cy="10" r="2.8" />
        <path d="M6.2 5 7.4 3.5h5.2L13.8 5" />
      </svg>
    )
  }

  if (label === 'Managers') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="5.6" r="2.4" />
        <path d="M5.4 14.4c0-2.5 2.1-4.6 4.6-4.6s4.6 2.1 4.6 4.6" />
        <path d="M10 2.2v2.1M7.6 3.1l1.1 1.7M12.4 3.1l-1.1 1.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4.2" y="2.8" width="11.6" height="14.4" rx="2" />
      <path d="M7 7h6M7 10h6M7 13h4" />
    </svg>
  )
}

function CountCards({ metrics }: CountCardsProps) {
  return (
    <article className="metric-summary" aria-label="System counts">
      <ul className="metric-grid">
        {metrics.map((item) => (
          <li key={item.label}>
            <span className="metric-label">
              <span className="metric-icon">{renderMetricIcon(item.label)}</span>
              {item.label}
            </span>
            <strong>{item.count}</strong>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default CountCards
