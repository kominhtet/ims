// frontend/src/api.js
// API configuration
const BASE_URL = '' // Using Vite proxy, so we can use relative URLs

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const token = localStorage.getItem('token')

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    console.log('Making API call to:', url)
    console.log('Request config:', config)

    const response = await fetch(url, config)

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new Error('Authentication required')
      }

      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        console.error('Error response data:', errorData)

        // Handle different error response formats
        if (errorData && typeof errorData === 'object') {
          // Check for validation errors (ASP.NET Core ProblemDetails format)
          if (errorData.errors && typeof errorData.errors === 'object') {
            const messages = Object.values(errorData.errors)
              .flat()
              .filter(Boolean)
            if (messages.length) {
              errorMessage = messages.join('; ')
            }
          } 
          // Check for custom error format
          else if (errorData.message) {
            errorMessage = errorData.message
          }
          // Check for title (ProblemDetails)
          else if (errorData.title) {
            errorMessage = errorData.title
          }
          // Check for error property
          else if (errorData.error) {
            errorMessage = errorData.error
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (e) {
        console.error('Could not parse error response as JSON:', e)
      }

      throw new Error(errorMessage)
    }

    if (response.status === 204) {
      console.log('Response data: No content (204)')
      return { success: false, message: 'Not found' }
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
export async function getCategories() {
  return apiCall('/api/Category')
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
  return apiCall('/api/Auth/LogOut', { method: 'POST' })
}
export async function refreshToken() {
  return apiCall('/api/Auth/Refresh', { method: 'POST' })
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
