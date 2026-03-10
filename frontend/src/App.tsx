import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import Cameras from './pages/Cameras'
import Employees from './pages/Employees'

type Shift = 'Day' | 'Night'
type EmployeeRole = 'Manager' | 'Admin' | 'Employee'

type Employee = {
  id: number
  fullName: string
  phoneNumber: string
  hourlyRate: number
  role: EmployeeRole
  position: string
  shift: Shift
  isActive: boolean
  createdAt: string
  updatedAt: string
  checkInAt: string | null
  direction: string | null
}

type CheckinEvent = {
  eventId: number
  userId: number
  fullName: string
  position: string
  shift: Shift
  checkInAt: string | null
  direction: string | null
}

type AttendanceStatus = {
  status: 'Present' | 'Absent' | 'Late' | 'Day off'
  count: number
  color: string
}

type SystemMetric = {
  label: 'Cameras' | 'Employees' | 'Admins' | 'Managers'
  count: number
}

type NotificationUser = {
  id: number
  full_name: string
  position: string
  shift: string
  role: string
}

type AttendanceNotificationPayload = {
  event_type: 'Attendance'
  data: {
    user: NotificationUser | null
    attendance_date: string | null
    direction: string
  }
}

type CameraEnrollmentNotificationPayload = {
  event_type: 'CameraEnrollment'
  data: {
    ip_address: string
    device_name: string
  }
}

type NotificationPayload = AttendanceNotificationPayload | CameraEnrollmentNotificationPayload | unknown
type CameraEnrollmentState = 'pending' | 'loading' | 'done' | 'error'

type DashboardNotification = {
  id: number
  payload: NotificationPayload
  receivedAt: string
  isRead: boolean
  cameraEnrollmentState?: CameraEnrollmentState
}

type CameraStatus = 'Online' | 'Offline'
type CameraPosition = 'CheckIn' | 'CheckOut'

type Camera = {
  id: number
  deviceName: string
  position: CameraPosition
  status: CameraStatus
  createdAt: string
  updatedAt: string
}

type PageKey = 'dashboard' | 'employees' | 'cameras'

type NavItem = {
  key: PageKey
  label: string
}

const navigationItems: NavItem[] = [
  { key: 'dashboard', label: 'Overview' },
  { key: 'employees', label: 'Employees' },
  { key: 'cameras', label: 'Cameras' },
]

const isAttendanceNotificationPayload = (payload: unknown): payload is AttendanceNotificationPayload => {
  if (!payload || typeof payload !== 'object') return false

  const candidate = payload as Record<string, unknown>
  const data = candidate.data as Record<string, unknown> | undefined
  return (
    candidate.event_type === 'Attendance' &&
    !!data &&
    typeof data.direction === 'string' &&
    ('attendance_date' in data) &&
    ('user' in data)
  )
}

const isCameraEnrollmentNotificationPayload = (data: unknown): data is CameraEnrollmentNotificationPayload => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as { ip_address?: unknown }).ip_address === 'string' &&
    typeof (data as { device_name?: unknown }).device_name === 'string'
  )
}

let sharedWebhookSocket: WebSocket | null = null
let sharedWebhookSocketUrl: string | null = null
let sharedWebhookSocketUsers = 0
let sharedWebhookCloseTimer: number | undefined
let sharedWebhookReconnectTimer: number | undefined
let sharedWebhookShouldReconnect = true

type ShiftDurationApi = {
  id: number
  shift: Shift
  start_time: string
  end_time: string
}

type AttendancePiePercentagesApi = {
  day_off_percentage: number
  present_percentage: number
  absent_percentage: number
  late_percentage: number
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const [currentShifts, setCurrentShifts] = useState<ShiftDurationApi[] | null>(null)
  const [attendancePie, setAttendancePie] = useState<AttendancePiePercentagesApi | null>(null)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  const wsUrl =
    import.meta.env.VITE_WS_URL ??
    (() => {
      const api = new URL(apiBaseUrl)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${wsProtocol}//${api.host}/ws/webhook-events`
    })()
  const notificationPanelOpenRef = useRef(isNotificationPanelOpen)

  useEffect(() => {
    notificationPanelOpenRef.current = isNotificationPanelOpen
  }, [isNotificationPanelOpen])

  useEffect(() => {
    let cancelled = false

    const loadShifts = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/attendance/current-shifts`)
        if (!response.ok) return
        const data = (await response.json()) as unknown
        if (!Array.isArray(data)) return
        if (cancelled) return
        setCurrentShifts(data as ShiftDurationApi[])
      } catch {
        // Keep last known value if backend is unreachable.
      }
    }

    loadShifts()
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl])

  useEffect(() => {
    let cancelled = false

    const loadAttendancePie = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/attendance/pie-chart-percentages`)
        if (!response.ok) return
        const data = (await response.json()) as AttendancePiePercentagesApi
        if (cancelled) return
        setAttendancePie(data)
      } catch {
        // Keep last known value if backend is unreachable.
      }
    }

    loadAttendancePie()
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl])

  const dayShift = useMemo(
    () => currentShifts?.find((item) => item.shift === 'Day') ?? null,
    [currentShifts],
  )

  const nightShift = useMemo(
    () => currentShifts?.find((item) => item.shift === 'Night') ?? null,
    [currentShifts],
  )

  useEffect(() => {
    sharedWebhookSocketUsers += 1
    sharedWebhookShouldReconnect = true

    if (sharedWebhookCloseTimer) {
      window.clearTimeout(sharedWebhookCloseTimer)
      sharedWebhookCloseTimer = undefined
    }

    const scheduleReconnect = () => {
      if (!sharedWebhookShouldReconnect || sharedWebhookSocketUsers <= 0) return
      if (sharedWebhookReconnectTimer) return
      sharedWebhookReconnectTimer = window.setTimeout(() => {
        sharedWebhookReconnectTimer = undefined
        connect()
      }, 1500)
    }

    const connect = () => {
      if (sharedWebhookSocket && sharedWebhookSocketUrl === wsUrl) {
        if (sharedWebhookSocket.readyState === WebSocket.OPEN || sharedWebhookSocket.readyState === WebSocket.CONNECTING) {
          return
        }
      }

      if (sharedWebhookSocket) {
        try {
          sharedWebhookSocket.close()
        } catch {
          // Ignore.
        }
      }

      sharedWebhookSocketUrl = wsUrl
      sharedWebhookSocket = new WebSocket(wsUrl)

      sharedWebhookSocket.onmessage = (event) => {
        let payload: unknown = event.data
        try {
          payload = JSON.parse(event.data)
        } catch {
          // Keep raw text if backend ever sends non-JSON.
        }

        setNotifications((existing) => [
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            payload,
            receivedAt: new Date().toISOString(),
            isRead: notificationPanelOpenRef.current,
            cameraEnrollmentState: isCameraEnrollmentNotificationPayload(payload) ? 'pending' : undefined,
          },
          ...existing,
        ])
      }

      sharedWebhookSocket.onclose = () => {
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      sharedWebhookSocketUsers = Math.max(0, sharedWebhookSocketUsers - 1)
      if (sharedWebhookSocketUsers > 0) return

      sharedWebhookShouldReconnect = false
      if (sharedWebhookReconnectTimer) {
        window.clearTimeout(sharedWebhookReconnectTimer)
        sharedWebhookReconnectTimer = undefined
      }

      sharedWebhookCloseTimer = window.setTimeout(() => {
        sharedWebhookCloseTimer = undefined
        if (sharedWebhookSocketUsers > 0) return
        try {
          sharedWebhookSocket?.close()
        } catch {
          // Ignore.
        }
        sharedWebhookSocket = null
        sharedWebhookSocketUrl = null
      }, 500)
    }
  }, [wsUrl])

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )

  const handleToggleNotifications = () => {
    setIsNotificationPanelOpen((isOpen) => {
      const next = !isOpen
      if (next) {
        setNotifications((existing) =>
          existing.map((notification) =>
            notification.isRead ? notification : { ...notification, isRead: true },
          ),
        )
      }
      return next
    })
  }

  const handleRegisterCamera = async (notificationId: number) => {
    const notification = notifications.find((item) => item.id === notificationId)
    if (!notification || !isCameraEnrollmentNotificationPayload(notification.payload)) return

    setNotifications((existing) =>
      existing.map((item) =>
        item.id === notificationId ? { ...item, cameraEnrollmentState: 'loading' } : item,
      ),
    )

    try {
      const response = await fetch(`${apiBaseUrl}/cameras/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: notification.payload.data.ip_address,
          device_name: notification.payload.data.device_name,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to register camera')
      }

      setNotifications((existing) =>
        existing.map((item) =>
          item.id === notificationId
            ? { ...item, cameraEnrollmentState: 'done', isRead: true }
            : item,
        ),
      )
    } catch {
      setNotifications((existing) =>
        existing.map((item) =>
          item.id === notificationId ? { ...item, cameraEnrollmentState: 'error' } : item,
        ),
      )
    }
  }

  const checkinsToday = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const byUser = new Map<number, Employee>()

    for (const notification of notifications) {
      if (!isAttendanceNotificationPayload(notification.payload)) continue
      if (notification.payload.event_type !== 'Attendance') continue
      if (!notification.payload.data.user) continue

      const attendanceDate = notification.payload.data.attendance_date
      if (!attendanceDate) continue
      const attendance = new Date(attendanceDate)
      if (Number.isNaN(attendance.getTime())) continue
      if (attendance < startOfToday || attendance >= endOfToday) continue

      const user = notification.payload.data.user
      const normalizedShift: Shift = user.shift === 'Night' ? 'Night' : 'Day'
      const mapped: Employee = {
        id: user.id,
        fullName: user.full_name,
        phoneNumber: '',
        hourlyRate: 0,
        role:
          user.role === 'Manager' || user.role === 'Admin' || user.role === 'Employee'
            ? user.role
            : 'Employee',
        position: user.position,
        shift: normalizedShift,
        isActive: true,
        createdAt: '',
        updatedAt: '',
        checkInAt: attendanceDate,
        direction: notification.payload.data.direction,
      }

      const existing = byUser.get(user.id)
      if (!existing) {
        byUser.set(user.id, mapped)
        continue
      }

      const existingTime = existing.checkInAt ? new Date(existing.checkInAt).getTime() : 0
      if (attendance.getTime() > existingTime) {
        byUser.set(user.id, mapped)
      }
    }

    return Array.from(byUser.values()).sort((a, b) => {
      const aTime = a.checkInAt ? new Date(a.checkInAt).getTime() : 0
      const bTime = b.checkInAt ? new Date(b.checkInAt).getTime() : 0
      return bTime - aTime
    })
  }, [notifications])

  const todayEvents = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const events: CheckinEvent[] = []

    for (const notification of notifications) {
      if (!isAttendanceNotificationPayload(notification.payload)) continue
      if (notification.payload.event_type !== 'Attendance') continue
      if (!notification.payload.data.user) continue

      const attendanceDate = notification.payload.data.attendance_date
      if (!attendanceDate) continue
      const attendance = new Date(attendanceDate)
      if (Number.isNaN(attendance.getTime())) continue
      if (attendance < startOfToday || attendance >= endOfToday) continue

      const user = notification.payload.data.user
      const normalizedShift: Shift = user.shift === 'Night' ? 'Night' : 'Day'

      events.push({
        eventId: notification.id,
        userId: user.id,
        fullName: user.full_name,
        position: user.position,
        shift: normalizedShift,
        checkInAt: attendanceDate,
        direction: notification.payload.data.direction,
      })
    }

    return events.sort((a, b) => {
      const aTime = a.checkInAt ? new Date(a.checkInAt).getTime() : 0
      const bTime = b.checkInAt ? new Date(b.checkInAt).getTime() : 0
      return bTime - aTime
    })
  }, [notifications])

  const cameras: Camera[] = [
    {
      id: 3001,
      deviceName: 'Gate A - North Entrance',
      position: 'CheckIn',
      status: 'Online',
      createdAt: '2025-03-21T09:00:00',
      updatedAt: '2026-02-24T08:50:00',
    },
    {
      id: 3002,
      deviceName: 'Gate B - South Entrance',
      position: 'CheckIn',
      status: 'Online',
      createdAt: '2025-03-21T09:00:00',
      updatedAt: '2026-02-24T08:47:00',
    },
    {
      id: 3003,
      deviceName: 'Warehouse Exit',
      position: 'CheckOut',
      status: 'Offline',
      createdAt: '2025-04-02T13:20:00',
      updatedAt: '2026-02-24T07:14:00',
    },
    {
      id: 3004,
      deviceName: 'Admin Floor Lobby',
      position: 'CheckIn',
      status: 'Online',
      createdAt: '2025-05-06T11:40:00',
      updatedAt: '2026-02-24T08:53:00',
    },
    {
      id: 3005,
      deviceName: 'Production Line Exit',
      position: 'CheckOut',
      status: 'Offline',
      createdAt: '2025-06-14T10:05:00',
      updatedAt: '2026-02-24T06:38:00',
    },
    {
      id: 3006,
      deviceName: 'Visitor Reception',
      position: 'CheckIn',
      status: 'Online',
      createdAt: '2025-08-09T14:12:00',
      updatedAt: '2026-02-24T08:58:00',
    },
  ]

  const systemMetrics: SystemMetric[] = [
    { label: 'Cameras', count: 0 },
    { label: 'Employees', count: checkinsToday.filter((employee) => employee.role === 'Employee').length },
    { label: 'Admins', count: checkinsToday.filter((employee) => employee.role === 'Admin').length },
    { label: 'Managers', count: checkinsToday.filter((employee) => employee.role === 'Manager').length },
  ]

  const attendanceStatuses: AttendanceStatus[] = [
    {
      status: 'Present',
      count: Math.max(
        0,
        (attendancePie?.present_percentage ?? 0) - (attendancePie?.late_percentage ?? 0),
      ),
      color: '#22c55e',
    },
    { status: 'Absent', count: attendancePie?.absent_percentage ?? 0, color: '#ef4444' },
    { status: 'Late', count: attendancePie?.late_percentage ?? 0, color: '#f59e0b' },
    { status: 'Day off', count: attendancePie?.day_off_percentage ?? 0, color: '#3b82f6' },
  ]

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            FI
          </span>
          <div>
            <p className="brand-name">FaceID Attendance</p>
            <p className="brand-subtitle">Operations Console</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item${activePage === item.key ? ' nav-item-active' : ''}`}
              onClick={() => setActivePage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="compliance-box">
          <p className="compliance-title">Privacy Compliance</p>
          <p className="compliance-copy">
            Biometric templates encrypted at rest. Access audit is enabled.
          </p>
        </div>
      </aside>

      <main className="content">
        {activePage === 'dashboard' ? (
          <Dashboard
            events={todayEvents}
            metrics={systemMetrics}
            attendanceStatuses={attendanceStatuses}
            dayShift={dayShift}
            nightShift={nightShift}
            notifications={notifications}
            unreadNotifications={unreadNotifications}
            isNotificationPanelOpen={isNotificationPanelOpen}
            onToggleNotifications={handleToggleNotifications}
            onRegisterCamera={handleRegisterCamera}
          />
        ) : activePage === 'employees' ? (
          <Employees />
        ) : (
          <Cameras cameras={cameras} />
        )}
      </main>
    </div>
  )
}

export default App
