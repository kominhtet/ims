// frontend/src/api.js
// API configuration
const BASE_URL = 'http://192.168.11.253:5000' // Using Vite proxy, so we can use relative URLs

let isRefreshing = false
let refreshPromise = null

async function performRefresh() {
  const storedUser = localStorage.getItem('user')
  const storedRefreshToken = localStorage.getItem('refreshToken')

  const email = storedUser ? JSON.parse(storedUser)?.email : null
  const refreshToken = storedRefreshToken

  if (!email || !refreshToken) {
    throw new Error('No refresh credentials available')
  }

  const response = await fetch(`${BASE_URL}/api/Auth/Refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, refreshToken }),
  })

  if (!response.ok) {
    throw new Error('Refresh failed')
  }

  const data = await response.json()

  // Expecting { success: true, accessToken, refreshToken? }
  if (!data || !data.accessToken || data.success === false) {
    throw new Error(data?.message || 'Invalid refresh response')
  }

  localStorage.setItem('token', data.accessToken)
  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken)
  }

  return data
}

async function getRefreshPromise() {
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = performRefresh()
      .catch((e) => {
        // Bubble up after cleanup by caller
        throw e
      })
      .finally(() => {
        isRefreshing = false
      })
  }
  return refreshPromise
}

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const token = localStorage.getItem('token')

  // Get bypass headers from context if available
  let bypassHeaders = {}
  try {
    const authContext = window.__authContext
    if (authContext && authContext.getBypassHeaders) {
      bypassHeaders = authContext.getBypassHeaders()
    }
  } catch (e) {
    // Ignore if not in React context
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...bypassHeaders,
      ...options.headers,
    },
    ...options,
  }

  try {
    console.log('Making API call to:', url)
    console.log('Request config:', config)
    console.log('Bypass headers being sent:', bypassHeaders)

    const response = await fetch(url, config)

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)

    if (!response.ok) {
      if (response.status === 401) {
        // Try one refresh, then retry the original request
        try {
          await getRefreshPromise()

          const newToken = localStorage.getItem('token')
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: newToken ? `Bearer ${newToken}` : undefined,
            },
          }
          const retryResponse = await fetch(url, retryConfig)
          if (!retryResponse.ok) {
            throw new Error(`Retry failed with status ${retryResponse.status}`)
          }
          if (retryResponse.status === 204) {
            return { success: false, message: 'Not found' }
          }
          const retryData = await retryResponse.json()
          return retryData
        } catch (refreshErr) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
          throw new Error('Authentication required')
        }
      }

      const statusPrefix = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
      let errorMessage = statusPrefix

      try {
        const contentType = response.headers.get('content-type') || ''
        const text = await response.text()

        if (text && contentType.includes('application/json')) {
          const errorData = JSON.parse(text)
          console.error('Error response data:', errorData)

          if (errorData && typeof errorData === 'object') {
            if (errorData.errors && typeof errorData.errors === 'object') {
              const messages = Object.values(errorData.errors)
                .flat()
                .filter(Boolean)
              if (messages.length) {
                errorMessage = `${statusPrefix}: ${messages.join('; ')}`
              }
            } else if (errorData.message) {
              errorMessage = `${statusPrefix}: ${errorData.message}`
            } else if (errorData.title) {
              errorMessage = `${statusPrefix}: ${errorData.title}`
            } else if (errorData.error) {
              errorMessage = `${statusPrefix}: ${errorData.error}`
            }
          }
        } else if (text) {
          errorMessage = `${statusPrefix}: ${text}`
        }
      } catch (e) {
        console.error('Could not parse error response body:', e)
      }

      const err = new Error(errorMessage)
      // Attach status for callers that want to branch on it
      err.status = response.status
      throw err
    }

    if (response.status === 204) {
      console.log('Response data: No content (204)')
      return { success: false, message: 'Not found' }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.log('Response text:', text)
      return text
    }
    const data = await response.json()
    console.log('Response data:', data)
    return data
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

// Items API functions
export async function getItems(params = {}) {
  const queryParams = new URLSearchParams({
    pageIndex: params.pageIndex || 1,
    pageSize: params.pageSize || 6,
    ...params,
  })
  return apiCall(`/api/Item?${queryParams}`)
}

export async function getItem(itemId) {
  return apiCall(`/api/Item/${itemId}`)
}

export async function createItem(itemData) {
  return apiCall('/api/Item', {
    method: 'POST',
    body: JSON.stringify(itemData),
  })
}

export async function updateItem(itemData) {
  return apiCall('/api/Item', {
    method: 'PUT',
    body: JSON.stringify(itemData),
  })
}

export async function deleteItem(itemId) {
  return apiCall(`/api/Item/${itemId}`, {
    method: 'DELETE',
  })
}

// Categories API functions
export async function getCategories(params = {}) {
  const queryParams = new URLSearchParams({
    ...(params.pageIndex ? { pageIndex: params.pageIndex } : {}),
    ...(params.pageSize ? { pageSize: params.pageSize } : {}),
    ...(params.searchTerm ? { searchTerm: params.searchTerm } : {}),
  })
  const query = queryParams.toString()
  return apiCall(`/api/Category${query ? `?${query}` : ''}`)
}
export async function getCategory(categoryId) {
  return apiCall(`/api/Category/${categoryId}`)
}
export async function createCategory(categoryData) {
  return apiCall('/api/Category', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  })
}
export async function updateCategory(categoryData) {
  return apiCall('/api/Category/update', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  })
}
export async function deleteCategory(categoryId) {
  return apiCall(`/api/Category/${categoryId}`, {
    method: 'DELETE',
  })
}

// Auth API functions
export async function login(credentials) {
  return apiCall('/api/Auth/LogIn', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}
export async function logout() {
  const storedUser = localStorage.getItem('user')
  const email = storedUser ? JSON.parse(storedUser)?.email : undefined
  const refreshToken = localStorage.getItem('refreshToken') || undefined
  return apiCall('/api/Auth/LogOut', { 
    method: 'POST',
    body: JSON.stringify({ email, refreshToken }),
  })
}
export async function refreshToken() {
  // Expose refresh for AuthContext; performRefresh already persists tokens
  return getRefreshPromise()
}
export async function confirmEmail(data) {
  return apiCall('/api/Auth/ConfirmEmail', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Employee API
export async function getEmployees() {
  return apiCall('/api/Employee')
}
export async function getEmployee(email) {
  return apiCall(`/api/Employee/${encodeURIComponent(email)}`) // Why: safety for '@' and '.'
}
export async function createEmployee(employeeData) {
  return apiCall('/api/Employee', {
    method: 'POST',
    body: JSON.stringify(employeeData),
  })
}
export async function deleteEmployee(email) {
  return apiCall(`/api/Employee/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  })
}

// File API
export async function deleteFile(fileId) {
  return apiCall('/api/Admin/files', {
    method: 'DELETE',
    body: JSON.stringify({ fileId }),
  })
}
export async function getFileUrl(generatedFileName) {
  return apiCall(`/api/Item/fileUrl/${generatedFileName}`)
}

// Admin - Employee Roles API
export async function addEmployeeRole(employeeId, roleId) {
  if (!employeeId || !roleId) {
    throw new Error('employeeId and roleId are required')
  }
  return apiCall(`/api/Admin/employee/${encodeURIComponent(employeeId)}/roles/${encodeURIComponent(roleId)}/add`, {
    method: 'POST',
  })
}

export async function removeEmployeeRole(employeeId, roleId) {
  if (!employeeId || !roleId) {
    throw new Error('employeeId and roleId are required')
  }
  return apiCall(`/api/Admin/employee/${encodeURIComponent(employeeId)}/roles/${encodeURIComponent(roleId)}/remove`, {
    method: 'POST',
  })
}

// Employees - support pagination explicitly for Settings UI
export async function getEmployeesPaged(params = {}) {
  const queryParams = new URLSearchParams({
    pageIndex: params.pageIndex || 1,
    pageSize: params.pageSize || 6,
  })
  return apiCall(`/api/Employee?${queryParams}`)
}