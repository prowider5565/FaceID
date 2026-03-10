type Shift = 'Day' | 'Night'

type ShiftIndicatorCardProps = {
  shift: Shift
  startTime?: string | null
  endTime?: string | null
}

const formatClockTime = (value?: string | null) => {
  if (!value) return '--'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 3v2.1M12 18.9V21M4.2 12H3M21 12h-1.2M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5" />
    <circle cx="12" cy="12" r="4.2" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M20.7 14.7a7.8 7.8 0 0 1-10.3-10.3 8.5 8.5 0 1 0 10.3 10.3Z" />
    <path d="M6.2 11.2l.35.85.85.35-.85.35-.35.85-.35-.85-.85-.35.85-.35.35-.85Z" />
    <path d="M14.4 6.1l.35.85.85.35-.85.35-.35.85-.35-.85-.85-.35.85-.35.35-.85Z" />
  </svg>
)

function ShiftIndicatorCard({ shift, startTime, endTime }: ShiftIndicatorCardProps) {
  const isNight = shift === 'Night'

  return (
    <article className={`shift-indicator-card${isNight ? ' shift-indicator-night' : ' shift-indicator-day'}`}>
      <header className="shift-indicator-header">
        <span className="shift-indicator-icon" aria-hidden="true">
          {isNight ? <MoonIcon /> : <SunIcon />}
        </span>
        <div className="shift-indicator-title">
          <p className="shift-indicator-label">{shift} shift</p>
          <p className="shift-indicator-subtitle">
            {formatClockTime(startTime)} to {formatClockTime(endTime)}
          </p>
        </div>
      </header>

      <dl className="shift-indicator-details">
        <div className="shift-indicator-detail">
          <dt>Start</dt>
          <dd>{formatClockTime(startTime)}</dd>
        </div>
        <div className="shift-indicator-detail">
          <dt>End</dt>
          <dd>{formatClockTime(endTime)}</dd>
        </div>
      </dl>
    </article>
  )
}

export default ShiftIndicatorCard

