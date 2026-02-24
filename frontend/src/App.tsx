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
  event_type: string
  data: {
    user: NotificationUser | null
    attendance_date: string | null
    direction: string
  }
}

type DashboardNotification = {
  id: number
  payload: unknown
  receivedAt: string
  isRead: boolean
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
    typeof candidate.event_type === 'string' &&
    !!data &&
    typeof data.direction === 'string' &&
    ('attendance_date' in data) &&
    ('user' in data)
  )
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws/webhook-events'
  const notificationPanelOpenRef = useRef(isNotificationPanelOpen)

  useEffect(() => {
    notificationPanelOpenRef.current = isNotificationPanelOpen
  }, [isNotificationPanelOpen])

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let shouldReconnect = true

    const connect = () => {
      socket = new WebSocket(wsUrl)

      socket.onmessage = (event) => {
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
          },
          ...existing,
        ])
      }

      socket.onclose = () => {
        if (shouldReconnect) {
          reconnectTimer = window.setTimeout(connect, 1500)
        }
      }
    }

    connect()

    return () => {
      shouldReconnect = false
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }
      socket?.close()
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

  const checkinsToday = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const byUser = new Map<number, Employee>()

    for (const notification of notifications) {
      if (!isAttendanceNotificationPayload(notification.payload)) continue
      if (notification.payload.event_type !== 'Attendance') continue
      if (notification.payload.data.direction !== 'CheckIn') continue
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
    { status: 'Present', count: checkinsToday.length, color: '#22c55e' },
    { status: 'Absent', count: 0, color: '#ef4444' },
    { status: 'Late', count: 0, color: '#f59e0b' },
    { status: 'Day off', count: 0, color: '#3b82f6' },
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
            employees={checkinsToday}
            metrics={systemMetrics}
            attendanceStatuses={attendanceStatuses}
            notifications={notifications}
            unreadNotifications={unreadNotifications}
            isNotificationPanelOpen={isNotificationPanelOpen}
            onToggleNotifications={handleToggleNotifications}
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
