import React from 'react'
import classNames from 'classnames'

import {
  CAvatar,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CProgress,
  CRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cibCcAmex,
  cibCcApplePay,
  cibCcMastercard,
  cibCcPaypal,
  cibCcStripe,
  cibCcVisa,
  cibGoogle,
  cibFacebook,
  cibLinkedin,
  cifBr,
  cifEs,
  cifFr,
  cifIn,
  cifPl,
  cifUs,
  cibTwitter,
  cilCloudDownload,
  cilPeople,
  cilUser,
  cilUserFemale,
  cilPencil,
  cilTrash,
} from '@coreui/icons'

import avatar1 from 'src/assets/images/avatars/1.jpg'
import avatar2 from 'src/assets/images/avatars/2.jpg'
import avatar3 from 'src/assets/images/avatars/3.jpg'
import avatar4 from 'src/assets/images/avatars/4.jpg'
import avatar5 from 'src/assets/images/avatars/5.jpg'
import avatar6 from 'src/assets/images/avatars/6.jpg'

import WidgetsBrand from '../widgets/WidgetsBrand'
import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'
import { getItems, updateItem, deleteItem, getCategories } from 'src/api'

const Dashboard = () => {
  const [items, setItems] = React.useState([])
  const [categories, setCategories] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [pagination, setPagination] = React.useState({
    pageIndex: 1,
    pageSize: 6,
    totalPages: 1,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  })
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState(null)
  const [formValues, setFormValues] = React.useState({
    itemName: '',
    quantity: '',
    originalQuantity: '',
    location: '',
    description: '',
    categoryId: '',
  })
  const [selectedFile, setSelectedFile] = React.useState(null)

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => Number(b.itemId ?? 0) - Number(a.itemId ?? 0))
  }, [items])

  React.useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch both items and categories
        const [itemsData, categoriesData] = await Promise.all([
          getItems({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }),
          getCategories()
        ])
        
        if (isMounted) {
          setItems(itemsData.items)
          setCategories(categoriesData.items)
          setPagination({
            pageIndex: itemsData.pageIndex,
            pageSize: itemsData.pageSize,
            totalPages: itemsData.totalPages,
            totalCount: itemsData.totalCount,
            hasPreviousPage: itemsData.hasPreviousPage,
            hasNextPage: itemsData.hasNextPage
          })
        }
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to fetch data')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.categoryId === categoryId)
    return category ? category.categoryName : categoryId
  }

  // Pagination functions
  const handlePageChange = async (newPageIndex) => {
    if (newPageIndex < 1 || newPageIndex > pagination.totalPages) return
    
    setPagination(prev => ({ ...prev, pageIndex: newPageIndex }))
    
    try {
      setIsLoading(true)
      const itemsData = await getItems({ pageIndex: newPageIndex, pageSize: pagination.pageSize })
      setItems(itemsData.items)
      setPagination({
        pageIndex: itemsData.pageIndex,
        pageSize: itemsData.pageSize,
        totalPages: itemsData.totalPages,
        totalCount: itemsData.totalCount,
        hasPreviousPage: itemsData.hasPreviousPage,
        hasNextPage: itemsData.hasNextPage
      })
    } catch (error) {
      setError('Failed to load page')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageSizeChange = async (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, pageIndex: 1 }))
    
    try {
      setIsLoading(true)
      const itemsData = await getItems({ pageIndex: 1, pageSize: newPageSize })
      setItems(itemsData.items)
      setPagination({
        pageIndex: itemsData.pageIndex,
        pageSize: itemsData.pageSize,
        totalPages: itemsData.totalPages,
        totalCount: itemsData.totalCount,
        hasPreviousPage: itemsData.hasPreviousPage,
        hasNextPage: itemsData.hasNextPage
      })
    } catch (error) {
      setError('Failed to change page size')
    } finally {
      setIsLoading(false)
    }
  }

  const openEdit = (item) => {
    setSelectedItem(item)
    setFormValues({
      itemName: item.itemName || '',
      quantity: String(item.quantity ?? ''),
      originalQuantity: String(item.originalQuantity ?? ''),
      location: item.location || '',
      description: item.description || '',
      categoryId: item.categoryId || '',
    })
    setShowEditModal(true)
  }

  const openDelete = (item) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const openAdd = () => {
    setFormValues({
      itemName: '',
      quantity: '',
      originalQuantity: '',
      location: '',
      description: '',
      categoryId: '',
    })
    setSelectedFile(null)
    setShowAddModal(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleCreate = async () => {
    try {
      setIsLoading(true)
      
      const formData = new FormData()
      formData.append('itemName', formValues.itemName)
      formData.append('quantity', formValues.quantity)
      formData.append('originalQuantity', formValues.originalQuantity)
      formData.append('location', formValues.location)
      formData.append('description', formValues.description)
      formData.append('categoryId', formValues.categoryId)
      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const response = await fetch('/api/Item', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh items list
          const itemsData = await getItems({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize })
          setItems(itemsData.items)
          setPagination({
            pageIndex: itemsData.pageIndex,
            pageSize: itemsData.pageSize,
            totalPages: itemsData.totalPages,
            totalCount: itemsData.totalCount,
            hasPreviousPage: itemsData.hasPreviousPage,
            hasNextPage: itemsData.hasNextPage
          })
          setShowAddModal(false)
          setFormValues({
            itemName: '',
            quantity: '',
            originalQuantity: '',
            location: '',
            description: '',
            categoryId: '',
          })
          setSelectedFile(null)
        } else {
          setError(result.message || 'Failed to create item')
        }
      } else {
        setError('Failed to create item. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create item:', error)
      setError('Failed to create item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedItem) return
    
    try {
      setIsLoading(true)
      
      const formData = new FormData()
      formData.append('ItemId', selectedItem.itemId)
      formData.append('ItemName', formValues.itemName)
      formData.append('Quantity', formValues.quantity)
      formData.append('OriginalQuantity', formValues.originalQuantity)
      formData.append('Location', formValues.location)
      formData.append('Description', formValues.description)
      formData.append('CategoryId', formValues.categoryId)
      formData.append('FileId', selectedItem.fileId || '')
      if (selectedFile) {
        formData.append('File', selectedFile)
      }

      const response = await fetch('/api/Item', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh items list
          const itemsData = await getItems({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize })
          setItems(itemsData.items)
          setPagination({
            pageIndex: itemsData.pageIndex,
            pageSize: itemsData.pageSize,
            totalPages: itemsData.totalPages,
            totalCount: itemsData.totalCount,
            hasPreviousPage: itemsData.hasPreviousPage,
            hasNextPage: itemsData.hasNextPage
          })
          setShowEditModal(false)
          setSelectedItem(null)
        } else {
          setError(result.message || 'Failed to update item')
        }
      } else {
        setError('Failed to update item. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update item:', error)
      setError('Failed to update item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedItem) return
    
    try {
      setIsLoading(true)
      await deleteItem(selectedItem.itemId)
      
      // Update local state
      setItems((prev) => prev.filter((it) => it.itemId !== selectedItem.itemId))
      setShowDeleteModal(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Failed to delete item:', error)
      setError('Failed to delete item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
 
  return (
    <>
      <WidgetsDropdown className="mb-4" />
      <CCard className="mb-4">
        <CCardBody>
          <CRow>
            <CCol sm={5}>
              <h4 id="traffic" className="card-title mb-0">
                Chart
              </h4>
             
            </CCol>
            
          </CRow>
          <MainChart />
        </CCardBody>
        <CCardFooter>
          <CRow
            xs={{ cols: 1, gutter: 4 }}
            sm={{ cols: 2 }}
            lg={{ cols: 4 }}
            xl={{ cols: 5 }}
            className="mb-2 text-center"
          >
           
          </CRow>
        </CCardFooter>
      </CCard>
      
      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <span>Items</span>
                <CButton color="success" onClick={openAdd}>
                  <CIcon icon={cilPencil} className="me-2" />
                  Add Item
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              {isLoading && <div>Loading items…</div>}
              {error && <div style={{ color: 'red' }}>Error: {error}</div>}
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Original Quantity</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Qty</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Place</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Description</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Category</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Action</CTableHeaderCell>
                    
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {sortedItems.map((item) => (
                    <CTableRow key={item.itemId}>
                      <CTableDataCell>
                        <div>{item.itemName}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.originalQuantity}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.quantity}</div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <div>{item.location}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.description}</div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <div>{getCategoryName(item.categoryId)}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          size="sm"
                          color="warning"
                          variant="outline"
                          className="me-2"
                          onClick={() => openEdit(item)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          size="sm"
                          color="danger"
                          variant="outline"
                          onClick={() => openDelete(item)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="d-flex align-items-center">
                <span className="me-2">Show:</span>
                <CFormSelect
                  size="sm"
                  style={{ width: '80px' }}
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </CFormSelect>
                <span className="ms-2">entries</span>
              </div>
              
              <div className="d-flex align-items-center">
                <span className="me-3">
                  Showing {((pagination.pageIndex - 1) * pagination.pageSize) + 1} to {Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} entries
                </span>
                
                <CPagination size="sm" className="mb-0">
                  <CPaginationItem
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => handlePageChange(pagination.pageIndex - 1)}
                  >
                    Previous
                  </CPaginationItem>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <CPaginationItem
                      key={page}
                      active={page === pagination.pageIndex}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </CPaginationItem>
                  ))}
                  
                  <CPaginationItem
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(pagination.pageIndex + 1)}
                  >
                    Next
                  </CPaginationItem>
                </CPagination>
              </div>
            </div>

            {/* Add Item Modal */}
            <CModal visible={showAddModal} onClose={() => setShowAddModal(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Add New Item</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <CForm>
                  <div className="mb-3">
                    <CFormLabel htmlFor="itemName">Name</CFormLabel>
                    <CFormInput
                      id="itemName"
                      name="itemName"
                      value={formValues.itemName}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="originalQuantity">Original Quantity</CFormLabel>
                    <CFormInput
                      id="originalQuantity"
                      name="originalQuantity"
                      type="number"
                      min="0"
                      value={formValues.originalQuantity}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="quantity">Quantity</CFormLabel>
                    <CFormInput
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={formValues.quantity}
                      onChange={handleFormChange}
                    />
                  </div>
              
                  <div className="mb-3">
                    <CFormLabel htmlFor="location">Place</CFormLabel>
                    <CFormInput
                      id="location"
                      name="location"
                      value={formValues.location}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="description">Description</CFormLabel>
                    <CFormTextarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formValues.description}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="categoryId">Category</CFormLabel>
                    <CFormSelect
                      id="categoryId"
                      name="categoryId"
                      value={formValues.categoryId}
                      onChange={handleFormChange}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="file">File (Optional)</CFormLabel>
                    <CFormInput
                      id="file"
                      name="file"
                      type="file"
                      onChange={handleFileChange}
                    />
                  </div>
                </CForm>
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </CButton>
                <CButton color="success" onClick={handleCreate}>
                  Create Item
                </CButton>
              </CModalFooter>
            </CModal>

            {/* Edit Modal */}
            <CModal visible={showEditModal} onClose={() => setShowEditModal(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Edit Item</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <CForm>
                  <div className="mb-3">
                    <CFormLabel htmlFor="itemName">Name</CFormLabel>
                    <CFormInput
                      id="itemName"
                      name="itemName"
                      value={formValues.itemName}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="originalQuantity">Original Quantity</CFormLabel>
                    <CFormInput
                      id="originalQuantity"
                      name="originalQuantity"
                      type="number"
                      min="0"
                      value={formValues.originalQuantity}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="quantity">Quantity</CFormLabel>
                    <CFormInput
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={formValues.quantity}
                      onChange={handleFormChange}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <CFormLabel htmlFor="location">Place</CFormLabel>
                    <CFormInput
                      id="location"
                      name="location"
                      value={formValues.location}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="description">Description</CFormLabel>
                    <CFormTextarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formValues.description}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormLabel htmlFor="categoryId">Category</CFormLabel>
                    <CFormSelect
                      id="categoryId"
                      name="categoryId"
                      value={formValues.categoryId}
                      onChange={handleFormChange}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </CForm>
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </CButton>
                <CButton color="primary" onClick={handleSave}>
                  Save
                </CButton>
              </CModalFooter>
            </CModal>

            {/* Delete Confirm Modal */}
            <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Delete Item</CModalTitle>
              </CModalHeader>
              <CModalBody>
                Are you sure you want to delete
                {selectedItem ? ` "${selectedItem.itemName}"` : ''}?
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </CButton>
                <CButton color="danger" onClick={handleConfirmDelete}>
                  Delete
                </CButton>
              </CModalFooter>
            </CModal>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
