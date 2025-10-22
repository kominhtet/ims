import React, { useEffect, useMemo, useState } from 'react'
import { getEmployeesPaged, addEmployeeRole, removeEmployeeRole } from 'src/api'

const Settings = () => {
    const [employees, setEmployees] = useState([])
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(6)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [roleInputs, setRoleInputs] = useState({}) // employeeId -> roleId string
    const disablePrev = useMemo(() => pageIndex <= 1, [pageIndex])
    const disableNext = useMemo(() => pageIndex >= totalPages, [pageIndex, totalPages])

    const loadEmployees = async (index = pageIndex, size = pageSize) => {
        try {
            setIsLoading(true)
            setError('')
            const res = await getEmployeesPaged({ pageIndex: index, pageSize: size })
            setEmployees(res?.items || [])
            setPageIndex(res?.pageIndex || index)
            setPageSize(res?.pageSize || size)
            setTotalPages(res?.totalPages || 1)
            setTotalCount(res?.totalCount || 0)
        } catch (e) {
            if (e && e.status === 403) {
                setError('You do not have permission to view employees. Please log in as an admin.')
            } else {
                setError(e?.message || 'Failed to load employees')
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadEmployees(1, pageSize)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onChangeRoleInput = (employeeId, value) => {
        setRoleInputs((prev) => ({ ...prev, [employeeId]: value }))
    }

    const onAddRole = async (employeeId) => {
        const roleId = (roleInputs[employeeId] || '').trim()
        if (!roleId) {
            setError('Role ID is required')
            return
        }
        try {
            setIsLoading(true)
            setError('')
            await addEmployeeRole(employeeId, roleId)
            await loadEmployees()
        } catch (e) {
            if (e && e.status === 403) {
                setError('You do not have permission to manage roles. Please log in as an admin.')
            } else {
                setError(e?.message || 'Failed to add role')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const onRemoveRole = async (employeeId, roleId) => {
        try {
            setIsLoading(true)
            setError('')
            await removeEmployeeRole(employeeId, roleId)
            await loadEmployees()
        } catch (e) {
            if (e && e.status === 403) {
                setError('You do not have permission to manage roles. Please log in as an admin.')
            } else {
                setError(e?.message || 'Failed to remove role')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <h1>Admin Settings</h1>
            <p>Manage employees and their roles</p>

            {error ? (
                <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <button disabled={isLoading || disablePrev} onClick={() => loadEmployees(pageIndex - 1, pageSize)}>Prev</button>
                <span>
                    Page {pageIndex} / {totalPages} ({totalCount} employees)
                </span>
                <button disabled={isLoading || disableNext} onClick={() => loadEmployees(pageIndex + 1, pageSize)}>Next</button>
            </div>

            {isLoading && <div>Loading...</div>}

            <div style={{ display: 'grid', gap: 12 }}>
                {employees.map((emp) => (
                    <div key={emp.employeeId} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{emp.employeeName || emp.email}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>{emp.email}</div>
                                <div style={{ fontSize: 12, color: '#999' }}>ID: {emp.employeeId}</div>
                                <div style={{ marginTop: 8 }}>
                                    <span style={{ fontWeight: 600 }}>Roles:</span>{' '}
                                    {(emp.permissions && emp.permissions.length > 0) ? (
                                        emp.permissions.map((role) => (
                                            <span key={role} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8, padding: '2px 6px', background: '#f3f3f3', borderRadius: 4 }}>
                                                <span>{role}</span>
                                                <button disabled={isLoading} onClick={() => onRemoveRole(emp.employeeId, role)} style={{ cursor: 'pointer' }}>x</button>
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ color: '#999' }}>No roles</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="text"
                                        placeholder="Role ID"
                                        value={roleInputs[emp.employeeId] || ''}
                                        onChange={(e) => onChangeRoleInput(emp.employeeId, e.target.value)}
                                        disabled={isLoading}
                                        style={{ padding: '6px 8px' }}
                                    />
                                    <button disabled={isLoading || !!error} onClick={() => onAddRole(emp.employeeId)}>Add Role</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Settings