import { useMemo, useState } from 'react'

type Shift = 'Day' | 'Night'

type Employee = {
  id: number
  fullName: string
  phoneNumber: string
  hourlyRate: number
  position: string
  shift: Shift
  isActive: boolean
  createdAt: string
}

type EmployeeTab = 'all' | 'day' | 'night' | 'inactive'

type EmployeesProps = {
  employees: Employee[]
}

const tabs: { id: EmployeeTab; label: string }[] = [
  { id: 'all', label: 'All Employees' },
  { id: 'day', label: 'Day Shift' },
  { id: 'night', label: 'Night Shift' },
  { id: 'inactive', label: 'Inactive' },
]

function Employees({ employees }: EmployeesProps) {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('all')

  const filteredEmployees = useMemo(() => {
    if (activeTab === 'day') return employees.filter((employee) => employee.shift === 'Day' && employee.isActive)
    if (activeTab === 'night')
      return employees.filter((employee) => employee.shift === 'Night' && employee.isActive)
    if (activeTab === 'inactive') return employees.filter((employee) => !employee.isActive)
    return employees
  }, [activeTab, employees])

  return (
    <section className="employees-page">
      <header className="employees-header">
        <div>
          <h1>Employees</h1>
          <p>Manage employee records, shifts, and roster activity.</p>
        </div>
        <button type="button" className="primary-btn">
          Add New Employee
        </button>
      </header>

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
              {filteredEmployees.map((employee) => (
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
      </div>
    </section>
  )
}

export default Employees
