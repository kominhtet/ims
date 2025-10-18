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
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        try {
          // Try to refresh token to validate it
          const response = await refreshToken()
          if (response.success && response.accessToken) {
            setToken(response.accessToken)
            setUser(JSON.parse(storedUser))
            localStorage.setItem('token', response.accessToken)
          } else {
            // Token is invalid, clear storage
            clearAuth()
          }
        } catch (error) {
          console.error('Token validation failed:', error)
          clearAuth()
        }
      }
      setIsLoading(false)
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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const value = {
    user,
    token,
    isLoading,
    loginUser,
    logoutUser,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
