import { useEffect, useState, type FormEvent } from 'react'
import Button from '../components/Button'
import SearchBar from '../components/SearchBar'

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
}

type EmployeeTab = 'managers' | 'admins' | 'employees'

const tabs: { id: EmployeeTab; label: string }[] = [
  { id: 'employees', label: 'Employees' },
  { id: 'managers', label: 'Managers' },
  { id: 'admins', label: 'Admins' },
]

type EditEmployeeForm = {
  fullName: string
  phoneNumber: string
  hourlyRate: number
  role: EmployeeRole
  position: string
  shift: Shift
  isActive: boolean
}

const uzbekistanPhoneRegex = /^(?:\+?998)(?:[\s-]?\d{2})(?:[\s-]?\d{3})(?:[\s-]?\d{2})(?:[\s-]?\d{2})$/
const russianPhoneRegex = /^(?:\+7|8)(?:[\s-]?\(?\d{3}\)?)(?:[\s-]?\d{3})(?:[\s-]?\d{2})(?:[\s-]?\d{2})$/

type ApiEmployee = {
  id: number
  full_name: string
  phone_number: string
  hourly_rate: number | string
  role: string
  position: string
  shift: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type ApiPage<T> = {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

type UserMutationPayload = {
  full_name: string
  phone_number: string
  hourly_rate: number
  position: string
  shift: 'Day' | 'Night'
  role: 'Manager' | 'Admin' | 'Employee'
  is_active: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const normalizeRole = (role: string): EmployeeRole => {
  if (role.toLowerCase() === 'manager') return 'Manager'
  if (role.toLowerCase() === 'admin') return 'Admin'
  return 'Employee'
}

const normalizeShift = (shift: string): Shift => (shift.toLowerCase() === 'night' ? 'Night' : 'Day')

const mapApiEmployee = (apiEmployee: ApiEmployee): Employee => ({
  id: apiEmployee.id,
  fullName: apiEmployee.full_name,
  phoneNumber: apiEmployee.phone_number,
  hourlyRate: Number(apiEmployee.hourly_rate),
  role: normalizeRole(apiEmployee.role),
  position: apiEmployee.position,
  shift: normalizeShift(apiEmployee.shift),
  isActive: apiEmployee.is_active,
  createdAt: apiEmployee.created_at,
  updatedAt: apiEmployee.updated_at,
})

const tabToRole: Record<EmployeeTab, EmployeeRole> = {
  employees: 'Employee',
  managers: 'Manager',
  admins: 'Admin',
}

function Employees() {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('employees')
  const [currentPage, setCurrentPage] = useState(1)
  const [employeeRows, setEmployeeRows] = useState<Employee[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newEmployeeForm, setNewEmployeeForm] = useState<EditEmployeeForm>({
    fullName: '',
    phoneNumber: '',
    hourlyRate: 0,
    role: 'Employee',
    position: '',
    shift: 'Day',
    isActive: true,
  })
  const [employeePendingDisable, setEmployeePendingDisable] = useState<Employee | null>(null)
  const [employeeEditing, setEmployeeEditing] = useState<Employee | null>(null)
  const [editError, setEditError] = useState('')
  const [editForm, setEditForm] = useState<EditEmployeeForm>({
    fullName: '',
    phoneNumber: '',
    hourlyRate: 0,
    role: 'Employee',
    position: '',
    shift: 'Day',
    isActive: true,
  })
  const pageSize = 5

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 350)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, debouncedSearch])

  useEffect(() => {
    const controller = new AbortController()

    const loadEmployees = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          size: String(pageSize),
          role: tabToRole[activeTab],
        })
        if (debouncedSearch) {
          params.set('search', debouncedSearch)
        }

        const response = await fetch(`${API_BASE_URL}/users/all?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load employees')
        }

        const data = (await response.json()) as ApiPage<ApiEmployee>
        const mappedRows = Array.isArray(data.items) ? data.items.map(mapApiEmployee) : []

        setEmployeeRows(mappedRows)
        setTotalItems(typeof data.total === 'number' ? data.total : mappedRows.length)
        setTotalPages(Math.max(1, typeof data.pages === 'number' ? data.pages : 1))
      } catch {
        if (controller.signal.aborted) return
        setEmployeeRows([])
        setTotalItems(0)
        setTotalPages(1)
        setLoadError('Failed to load users from API.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadEmployees()

    return () => controller.abort()
  }, [activeTab, currentPage, debouncedSearch, reloadKey])

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenEditModal = (employee: Employee) => {
    setEmployeeEditing(employee)
    setEditError('')
    setEditForm({
      fullName: employee.fullName,
      phoneNumber: employee.phoneNumber,
      hourlyRate: employee.hourlyRate,
      role: employee.role,
      position: employee.position,
      shift: employee.shift,
      isActive: employee.isActive,
    })
  }

  const isPhoneValid = (phoneNumber: string) =>
    uzbekistanPhoneRegex.test(phoneNumber.trim()) || russianPhoneRegex.test(phoneNumber.trim())

  const toUserMutationPayload = (form: EditEmployeeForm): UserMutationPayload => ({
    full_name: form.fullName.trim(),
    phone_number: form.phoneNumber.trim(),
    hourly_rate: form.hourlyRate,
    position: form.position.trim(),
    shift: form.shift,
    role: form.role,
    is_active: form.isActive,
  })

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newEmployeeForm.fullName.trim() || !newEmployeeForm.position.trim()) {
      setCreateError('Full name and position are required.')
      return
    }

    if (!isPhoneValid(newEmployeeForm.phoneNumber)) {
      setCreateError('Phone must match Uzbekistan (+998...) or Russian (+7 / 8...) formats.')
      return
    }

    if (newEmployeeForm.hourlyRate <= 0) {
      setCreateError('Hourly rate must be greater than 0.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toUserMutationPayload(newEmployeeForm)),
      })
      if (!response.ok) {
        throw new Error('Failed to create employee')
      }
      setIsCreateModalOpen(false)
      setCreateError('')
      setNewEmployeeForm({
        fullName: '',
        phoneNumber: '',
        hourlyRate: 0,
        role: 'Employee',
        position: '',
        shift: 'Day',
        isActive: true,
      })
      setReloadKey((value) => value + 1)
    } catch {
      setCreateError('Failed to create employee.')
    }
  }

  const handleEditEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editForm.fullName.trim() || !editForm.position.trim()) {
      setEditError('Full name and position are required.')
      return
    }

    if (!isPhoneValid(editForm.phoneNumber)) {
      setEditError('Phone must match Uzbekistan (+998...) or Russian (+7 / 8...) formats.')
      return
    }

    if (editForm.hourlyRate <= 0) {
      setEditError('Hourly rate must be greater than 0.')
      return
    }

    if (!employeeEditing) return

    try {
      const response = await fetch(`${API_BASE_URL}/users/${employeeEditing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toUserMutationPayload(editForm)),
      })
      if (!response.ok) {
        throw new Error('Failed to update employee')
      }
      setEmployeeEditing(null)
      setReloadKey((value) => value + 1)
    } catch {
      setEditError('Failed to update employee.')
    }
  }

  const handleConfirmDisable = async () => {
    if (!employeePendingDisable) return
    try {
      const response = await fetch(`${API_BASE_URL}/users/${employeePendingDisable.id}/disable`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to disable employee')
      }
      setEmployeePendingDisable(null)
      setReloadKey((value) => value + 1)
    } catch {
      setEmployeePendingDisable(null)
      setLoadError('Failed to disable employee.')
    }
  }

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  return (
    <section className="employees-page">
      <div className="employees-toolbar">
        <div>
          <h1>Employees</h1>
          <p>Manage employee records, shifts, and roster activity.</p>
        </div>
        <Button type="button" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          Add New Employee
        </Button>
      </div>

      <div className="employees-table-card">
        <div className="employees-tabs" role="tablist" aria-label="Employee views">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`employees-tab${activeTab === tab.id ? ' employees-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div className="employees-search-slot">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search employees by name, phone, role, or position"
              ariaLabel="Search employees"
            />
          </div>
        </div>

        <div className="employees-table-wrap">
          <table className="employees-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Shift</th>
                <th>Hourly Rate</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeeRows.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.fullName}</td>
                  <td>{employee.phoneNumber}</td>
                  <td>{employee.position}</td>
                  <td>{employee.shift}</td>
                  <td>${employee.hourlyRate.toFixed(2)}</td>
                  <td>
                    <span
                      className={`employee-status${
                        employee.isActive ? ' employee-status-active' : ' employee-status-inactive'
                      }`}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(employee.createdAt).toLocaleDateString('en-US')}</td>
                  <td>
                    <div className="employee-row-actions">
                      <button
                        type="button"
                        className="employee-action-btn employee-action-btn-edit"
                        onClick={() => handleOpenEditModal(employee)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="employee-action-btn employee-action-btn-disable"
                        onClick={() => setEmployeePendingDisable(employee)}
                        disabled={!employee.isActive}
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading ? <p className="employees-pagination-copy">Loading...</p> : null}
        {loadError ? <p className="employees-pagination-copy">{loadError}</p> : null}

        <footer className="employees-pagination">
          <p className="employees-pagination-copy">
            Showing {rangeStart}-{rangeEnd} of {totalItems}
          </p>
          <div className="employees-pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`pagination-btn${currentPage === pageNumber ? ' pagination-btn-active' : ''}`}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </footer>
      </div>

      {isCreateModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add employee">
          <div className="modal-card">
            <h2>Add New Employee</h2>
            <form className="employee-edit-form" onSubmit={handleCreateEmployee}>
              <label>
                Full Name
                <input
                  type="text"
                  value={newEmployeeForm.fullName}
                  onChange={(event) =>
                    setNewEmployeeForm((form) => ({ ...form, fullName: event.target.value }))
                  }
                />
              </label>
              <label>
                Phone Number
                <input
                  type="text"
                  value={newEmployeeForm.phoneNumber}
                  onChange={(event) =>
                    setNewEmployeeForm((form) => ({ ...form, phoneNumber: event.target.value }))
                  }
                />
              </label>
              <label>
                Hourly Rate
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newEmployeeForm.hourlyRate}
                  onChange={(event) =>
                    setNewEmployeeForm((form) => ({ ...form, hourlyRate: Number(event.target.value) || 0 }))
                  }
                />
              </label>
              <label>
                Role
                <select
                  value={newEmployeeForm.role}
                  onChange={(event) =>
                    setNewEmployeeForm((form) => ({ ...form, role: event.target.value as EmployeeRole }))
                  }
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>
              <label>
                Position
                <input
                  type="text"
                  value={newEmployeeForm.position}
                  onChange={(event) =>
                    setNewEmployeeForm((form) => ({ ...form, position: event.target.value }))
                  }
                />
              </label>
              <label>
                Shift
                <select
                  value={newEmployeeForm.shift}
                  onChange={(event) =>
                    setNewEmployeeForm((form) => ({ ...form, shift: event.target.value as Shift }))
                  }
                >
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </label>
              <label className="employee-checkbox-row">
                <input
                  type="checkbox"
                  checked={newEmployeeForm.isActive}
                  onChange={(event) =>
                    setNewEmployeeForm((form) => ({ ...form, isActive: event.target.checked }))
                  }
                />
                Active
              </label>
              {createError ? <p className="employee-form-error">{createError}</p> : null}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setCreateError('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-submit">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {employeePendingDisable ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Disable employee">
          <div className="modal-card modal-card-alert">
            <h2>Disable Employee</h2>
            <p>
              Are you sure you want to disable <strong>{employeePendingDisable.fullName}</strong>? This will mark the
              account as inactive.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setEmployeePendingDisable(null)}
              >
                Cancel
              </button>
              <button type="button" className="modal-btn modal-btn-danger" onClick={handleConfirmDisable}>
                Disable
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {employeeEditing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit employee">
          <div className="modal-card">
            <h2>Edit Employee</h2>
            <form className="employee-edit-form" onSubmit={handleEditEmployee}>
              <label>
                Full Name
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(event) => setEditForm((form) => ({ ...form, fullName: event.target.value }))}
                />
              </label>
              <label>
                Phone Number
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(event) => setEditForm((form) => ({ ...form, phoneNumber: event.target.value }))}
                />
              </label>
              <label>
                Hourly Rate
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.hourlyRate}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, hourlyRate: Number(event.target.value) || 0 }))
                  }
                />
              </label>
              <label>
                Role
                <select
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, role: event.target.value as EmployeeRole }))
                  }
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>
              <label>
                Position
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(event) => setEditForm((form) => ({ ...form, position: event.target.value }))}
                />
              </label>
              <label>
                Shift
                <select
                  value={editForm.shift}
                  onChange={(event) => setEditForm((form) => ({ ...form, shift: event.target.value as Shift }))}
                >
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </label>
              <label className="employee-checkbox-row">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(event) => setEditForm((form) => ({ ...form, isActive: event.target.checked }))}
                />
                Active
              </label>
              {editError ? <p className="employee-form-error">{editError}</p> : null}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => {
                    setEmployeeEditing(null)
                    setEditError('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Employees
