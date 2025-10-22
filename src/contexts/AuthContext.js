import React, { createContext, useContext, useState, useEffect } from 'react'
import { login, logout as apiLogout, refreshToken } from 'src/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)
  const [claims, setClaims] = useState({ roles: [], permissions: [], raw: {} })

  const decodeJwt = (jwtToken) => {
    if (!jwtToken || typeof jwtToken !== 'string' || jwtToken.split('.').length !== 3) {
      return null
    }
    try {
      const base64Url = jwtToken.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (e) {
      console.error('Failed to decode JWT:', e)
      return null
    }
  }

  const deriveClaims = (jwtToken) => {
    const payload = decodeJwt(jwtToken)
    if (!payload || typeof payload !== 'object') {
      setClaims({ roles: [], permissions: [], raw: {} })
      return
    }
    
    // Debug: log the full payload to see what's available
    console.log('JWT Payload:', payload)
    
    // Common claim keys in ASP.NET: role (array or string), roles, permission(s)
    const roles = new Set()
    const permissions = new Set()

    const pushValues = (val, targetSet) => {
      if (Array.isArray(val)) {
        val.filter(Boolean).forEach((v) => targetSet.add(String(v)))
      } else if (val != null) {
        targetSet.add(String(val))
      }
    }

    // Try different fields
    pushValues(payload['role'], roles)
    pushValues(payload['roles'], roles)
    pushValues(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'], roles)

    pushValues(payload['permission'], permissions)
    pushValues(payload['permissions'], permissions)
    pushValues(payload['perms'], permissions)
    
    // Also check for policy-based claims
    pushValues(payload['CanAdd'], permissions)
    pushValues(payload['CanEdit'], permissions)
    pushValues(payload['CanDelete'], permissions)
    
    // Handle space-separated permissions like "Can Add", "Can Edit", "Can Delete"
    const permissionArray = payload['permission'] || []
    if (Array.isArray(permissionArray)) {
      permissionArray.forEach(perm => {
        if (typeof perm === 'string') {
          // Map "Can Add" -> "CanAdd", "Can Edit" -> "CanEdit", "Can Delete" -> "CanDelete"
          const normalized = perm.replace(/\s+/g, '')
          permissions.add(normalized)
          // Also keep the original with spaces
          permissions.add(perm)
        }
      })
    }

    const finalClaims = { roles: Array.from(roles), permissions: Array.from(permissions), raw: payload }
    console.log('Derived claims:', finalClaims)
    setClaims(finalClaims)
  }

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      const storedRefreshToken = localStorage.getItem('refreshToken')

      // If we have token and user, initialize auth state immediately
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        deriveClaims(storedToken)
      }

      setIsLoading(false)

      // If a refresh token exists, refresh in background to extend session
      if (storedToken && storedUser && storedRefreshToken) {
        try {
          const response = await refreshToken()
          if (response && response.accessToken) {
            setToken(response.accessToken)
            localStorage.setItem('token', response.accessToken)
            deriveClaims(response.accessToken)
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken)
            }
          } else {
            clearAuth()
          }
        } catch (error) {
          console.error('Token validation failed:', error)
          clearAuth()
        }
      }
    }

    checkAuth()
  }, [])

  const loginUser = async (credentials) => {
    try {
      setIsLoading(true)
      const response = await login(credentials)
      
      console.log('Login response in AuthContext:', response)
      
      if (response.success && response.accessToken) {
        // Extract user info from credentials (email) since backend doesn't return user object
        const userInfo = {
          email: credentials.email,
          name: credentials.email.split('@')[0] // Use email prefix as name fallback
        }
        
        setToken(response.accessToken)
        setUser(userInfo)
        localStorage.setItem('token', response.accessToken)
        localStorage.setItem('user', JSON.stringify(userInfo))
        deriveClaims(response.accessToken)
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken)
        }
        return { success: true }
      } else {
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: error.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logoutUser = async () => {
    try {
      if (token) {
        await apiLogout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
    }
  }

  const clearAuth = () => {
    setUser(null)
    setToken(null)
    setClaims({ roles: [], permissions: [], raw: {} })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  // Helper to get bypass headers for testing
  const getBypassHeaders = () => {
    const headers = {}
    
    // Add headers to bypass authorization (for testing only)
    if (claims.permissions.includes('CanAdd')) {
      headers['X-Bypass-CanAdd'] = 'true'
    }
    if (claims.permissions.includes('CanEdit')) {
      headers['X-Bypass-CanEdit'] = 'true'
    }
    if (claims.permissions.includes('CanDelete')) {
      headers['X-Bypass-CanDelete'] = 'true'
    }
    
    return headers
  }

  // Store auth context globally for API calls
  useEffect(() => {
    window.__authContext = { getBypassHeaders }
    return () => {
      delete window.__authContext
    }
  }, [claims])

  const value = {
    user,
    token,
    isLoading,
    loginUser,
    logoutUser,
    isAuthenticated,
    claims,
    hasPermission: (perm) => !!perm && claims.permissions.includes(perm),
    hasRole: (role) => !!role && claims.roles.includes(role),
    getBypassHeaders,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
