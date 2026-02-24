import { useEffect, useMemo, useState, type FormEvent } from 'react'

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

type EmployeesProps = {
  employees: Employee[]
}

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

function Employees({ employees }: EmployeesProps) {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('employees')
  const [currentPage, setCurrentPage] = useState(1)
  const [employeeRows, setEmployeeRows] = useState<Employee[]>(employees)
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
    setEmployeeRows(employees)
  }, [employees])

  const filteredEmployees = useMemo(() => {
    if (activeTab === 'managers') return employeeRows.filter((employee) => employee.role === 'Manager')
    if (activeTab === 'admins') return employeeRows.filter((employee) => employee.role === 'Admin')
    return employeeRows.filter((employee) => employee.role === 'Employee')
  }, [activeTab, employeeRows])

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize))
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

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

  const handleEditEmployee = (event: FormEvent<HTMLFormElement>) => {
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

    setEmployeeRows((existingRows) =>
      existingRows.map((employee) =>
        employee.id === employeeEditing.id
          ? {
              ...employee,
              fullName: editForm.fullName.trim(),
              phoneNumber: editForm.phoneNumber.trim(),
              hourlyRate: editForm.hourlyRate,
              role: editForm.role,
              position: editForm.position.trim(),
              shift: editForm.shift,
              isActive: editForm.isActive,
            }
          : employee,
      ),
    )

    setEmployeeEditing(null)
  }

  const handleConfirmDisable = () => {
    if (!employeePendingDisable) return
    setEmployeeRows((existingRows) =>
      existingRows.map((employee) =>
        employee.id === employeePendingDisable.id ? { ...employee, isActive: false } : employee,
      ),
    )
    setEmployeePendingDisable(null)
  }

  const rangeStart = filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, filteredEmployees.length)

  return (
    <section className="employees-page">
      <div className="employees-toolbar">
        <div>
          <h1>Employees</h1>
          <p>Manage employee records, shifts, and roster activity.</p>
        </div>
        <button type="button" className="primary-btn">
          Add New Employee
        </button>
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
              {paginatedEmployees.map((employee) => (
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

        <footer className="employees-pagination">
          <p className="employees-pagination-copy">
            Showing {rangeStart}-{rangeEnd} of {filteredEmployees.length}
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
