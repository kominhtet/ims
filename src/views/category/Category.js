import React from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CForm,
    CFormInput,
    CFormLabel,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CRow,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilPlus } from '@coreui/icons'
import { getCategories, createCategory, updateCategory, deleteCategory } from 'src/api'
import { useAuth } from 'src/contexts/AuthContext'

const Category = () => {
    const { hasPermission, claims } = useAuth()
    const canAdd = hasPermission('CanAdd')
    const canEdit = hasPermission('CanEdit')
    const canDelete = hasPermission('CanDelete')
    
    // Debug: log permissions
    console.log('Category permissions:', { canAdd, canEdit, canDelete, claims })
    const [categories, setCategories] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState('')
    const [searchTerm, setSearchTerm] = React.useState('')
    const [pagination, setPagination] = React.useState({ pageIndex: 1, pageSize: 6, totalPages: 1, totalCount: 0 })

    const [showAdd, setShowAdd] = React.useState(false)
    const [showEdit, setShowEdit] = React.useState(false)
    const [showDelete, setShowDelete] = React.useState(false)
    const [selected, setSelected] = React.useState(null)
    const [formValues, setFormValues] = React.useState({ categoryName: '' })

    const load = async (overrides = {}) => {
        try {
            setIsLoading(true)
            setError('')
            const pageIndex = overrides.pageIndex || pagination.pageIndex
            const pageSize = overrides.pageSize || pagination.pageSize
            const res = await getCategories({ pageIndex, pageSize, searchTerm })
            setCategories(res?.items || [])
            setPagination({
                pageIndex: res?.pageIndex || pageIndex,
                pageSize: res?.pageSize || pageSize,
                totalPages: res?.totalPages || 1,
                totalCount: res?.totalCount || (res?.items?.length || 0)
            })
        } catch (e) {
            setError(e?.message || 'Failed to load categories')
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        load()
    }, [])

    const openAdd = () => {
        setFormValues({ categoryName: '', description: '' })
        setShowAdd(true)
    }

    const openEdit = (cat) => {
        setSelected(cat)
        setFormValues({ categoryName: cat.categoryName || '', description: cat.description || '' })
        setShowEdit(true)
    }

    const openDelete = (cat) => {
        setSelected(cat)
        setShowDelete(true)
    }

    const onChange = (e) => {
        const { name, value } = e.target
        setFormValues((prev) => ({ ...prev, [name]: value }))
    }

    const handleCreate = async () => {
        try {
            setIsLoading(true)
            setError('')
            await createCategory({ categoryName: formValues.categoryName, description: formValues.description || '' })
            setShowAdd(false)
            await load()
        } catch (e) {
            setError(e?.message || 'Failed to create category')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!selected) return
        try {
            setIsLoading(true)
            setError('')
            await updateCategory({
                categoryId: selected.categoryId,
                categoryName: formValues.categoryName,
                description: formValues.description || ''
            })
            setShowEdit(false)
            setSelected(null)
            await load()
        } catch (e) {
            setError(e?.message || 'Failed to update category')
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selected) return
        try {
            setIsLoading(true)
            setError('')
            await deleteCategory(selected.categoryId)
            setShowDelete(false)
            setSelected(null)
            setCategories((prev) => prev.filter((c) => c.categoryId !== selected.categoryId))
        } catch (e) {
            setError(e?.message || 'Failed to delete category')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <CCard className="mb-4">
                <CCardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <span>Categories</span>
                        <CButton color="success" onClick={openAdd} disabled={!canAdd}>
                            <CIcon icon={cilPlus} className="me-2" />
                            Add Category
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div className="d-flex mb-3">
                        <CFormInput
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && load({ pageIndex: 1 })}
                        />
                        <CButton className="ms-2" onClick={() => load({ pageIndex: 1 })}>Search</CButton>
                    </div>
                    {isLoading && <div>Loading…</div>}
                    {error && <div style={{ color: 'red' }}>Error: {error}</div>}
                    
                    {/* Debug panel - remove this in production */}
                    <div style={{ background: '#f8f9fa', padding: '10px', marginBottom: '10px', borderRadius: '4px', fontSize: '12px' }}>
                        <strong>Debug - Permissions:</strong><br/>
                        CanAdd: {canAdd ? '✅' : '❌'}, CanEdit: {canEdit ? '✅' : '❌'}, CanDelete: {canDelete ? '✅' : '❌'}<br/>
                        <strong>Claims:</strong> {JSON.stringify(claims, null, 2)}
                    </div>
                    <CTable align="middle" className="mb-0 border" hover responsive>
                        <CTableHead className="text-nowrap">
                            <CTableRow>
                                <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
                                <CTableHeaderCell className="bg-body-tertiary">Description</CTableHeaderCell>
                                <CTableHeaderCell className="bg-body-tertiary text-center">Items</CTableHeaderCell>
                                <CTableHeaderCell className="bg-body-tertiary">Action</CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {categories.map((cat) => (
                                <CTableRow key={cat.categoryId}>
                                    <CTableDataCell>
                                        <div>{cat.categoryName}</div>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <div>{cat.description}</div>
                                    </CTableDataCell>
                                    <CTableDataCell className="text-center">
                                        <div>{cat.itemCount}</div>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CButton size="sm" color="warning" variant="outline" className="me-2" onClick={() => openEdit(cat)} disabled={!canEdit}>
                                            <CIcon icon={cilPencil} />
                                        </CButton>
                                        <CButton size="sm" color="danger" variant="outline" onClick={() => openDelete(cat)} disabled={!canDelete}>
                                            <CIcon icon={cilTrash} />
                                        </CButton>
                                    </CTableDataCell>
                                </CTableRow>
                            ))}
                        </CTableBody>
                    </CTable>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            Showing {((pagination.pageIndex - 1) * pagination.pageSize) + 1} to {Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount}
                        </div>
                        <div className="d-flex align-items-center">
                            <CButton size="sm" variant="outline" disabled={pagination.pageIndex <= 1} onClick={() => load({ pageIndex: pagination.pageIndex - 1 })}>Prev</CButton>
                            <span className="mx-2">Page {pagination.pageIndex} / {pagination.totalPages}</span>
                            <CButton size="sm" variant="outline" disabled={pagination.pageIndex >= pagination.totalPages} onClick={() => load({ pageIndex: pagination.pageIndex + 1 })}>Next</CButton>
                        </div>
                    </div>

                    {/* Add Modal */}
                    <CModal visible={showAdd} onClose={() => setShowAdd(false)} alignment="center">
                        <CModalHeader>
                            <CModalTitle>Add Category</CModalTitle>
                        </CModalHeader>
                        <CModalBody>
                            <CForm>
                                <div className="mb-3">
                                    <CFormLabel htmlFor="categoryName">Name</CFormLabel>
                                    <CFormInput id="categoryName" name="categoryName" value={formValues.categoryName} onChange={onChange} />
                                </div>
                                <div className="mb-3">
                                    <CFormLabel htmlFor="categoryDescription">Description</CFormLabel>
                                    <CFormInput id="categoryDescription" name="description" value={formValues.description || ''} onChange={onChange} />
                                </div>
                            </CForm>
                        </CModalBody>
                        <CModalFooter>
                            <CButton color="secondary" variant="outline" onClick={() => setShowAdd(false)}>
                                Cancel
                            </CButton>
                            <CButton color="success" onClick={handleCreate} disabled={!formValues.categoryName.trim()}>
                                Create
                            </CButton>
                        </CModalFooter>
                    </CModal>

                    {/* Edit Modal */}
                    <CModal visible={showEdit} onClose={() => setShowEdit(false)} alignment="center">
                        <CModalHeader>
                            <CModalTitle>Edit Category</CModalTitle>
                        </CModalHeader>
                        <CModalBody>
                            <CForm>
                                <div className="mb-3">
                                    <CFormLabel htmlFor="editCategoryName">Name</CFormLabel>
                                    <CFormInput id="editCategoryName" name="categoryName" value={formValues.categoryName} onChange={onChange} />
                                </div>
                                <div className="mb-3">
                                    <CFormLabel htmlFor="editCategoryDescription">Description</CFormLabel>
                                    <CFormInput id="editCategoryDescription" name="description" value={formValues.description || ''} onChange={onChange} />
                                </div>
                            </CForm>
                        </CModalBody>
                        <CModalFooter>
                            <CButton color="secondary" variant="outline" onClick={() => setShowEdit(false)}>
                                Cancel
                            </CButton>
                            <CButton color="primary" onClick={handleSave} disabled={!formValues.categoryName.trim()}>
                                Save
                            </CButton>
                        </CModalFooter>
                    </CModal>

                    {/* Delete Modal */}
                    <CModal visible={showDelete} onClose={() => setShowDelete(false)} alignment="center">
                        <CModalHeader>
                            <CModalTitle>Delete Category</CModalTitle>
                        </CModalHeader>
                        <CModalBody>
                            Are you sure you want to delete{selected ? ` "${selected.categoryName}"` : ''}?
                        </CModalBody>
                        <CModalFooter>
                            <CButton color="secondary" variant="outline" onClick={() => setShowDelete(false)}>
                                Cancel
                            </CButton>
                            <CButton color="danger" onClick={handleConfirmDelete}>
                                Delete
                            </CButton>
                        </CModalFooter>
                    </CModal>
                </CCardBody>
            </CCard>
        </>
    )
}

export default Category