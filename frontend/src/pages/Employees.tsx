import { useEffect, useMemo, useState } from 'react'

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

function Employees({ employees }: EmployeesProps) {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('employees')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const filteredEmployees = useMemo(() => {
    if (activeTab === 'managers') return employees.filter((employee) => employee.role === 'Manager')
    if (activeTab === 'admins') return employees.filter((employee) => employee.role === 'Admin')
    return employees.filter((employee) => employee.role === 'Employee')
  }, [activeTab, employees])

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="employees-pagination">
          <p className="employees-pagination-copy">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length}
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
    </section>
  )
}

export default Employees
