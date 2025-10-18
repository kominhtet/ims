// frontend/src/views/pages/register/Register.js
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilEnvelopeClosed, cilLockLocked } from '@coreui/icons'
import { createEmployee, confirmEmail } from 'src/api'

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (errorMessage) setErrorMessage('')
    if (successMessage) setSuccessMessage('')
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const email = formData.email.trim().toLowerCase()
      const payload = { 
        name: formData.name.trim(), 
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      }
      console.log('Sending registration data:', payload)

      const response = await createEmployee(payload)
      console.log('Registration response:', response)
      
      if (response && response.success) {
        const enteredOtp = window.prompt('Enter the OTP sent to your email to confirm registration:')
        if (enteredOtp && enteredOtp.trim()) {
          try {
            const confirmRes = await confirmEmail({ email, otp: enteredOtp.trim() })
            if (confirmRes && confirmRes.success) {
              setSuccessMessage('Email confirmed. You can now log in.')
              setFormData({ name: '', email: '', password: '', confirmPassword: '' })
              setTimeout(() => navigate('/login'), 1500)
            } else {
              setErrorMessage(confirmRes?.message || 'Invalid OTP. Please try again.')
            }
          } catch {
            setErrorMessage('Failed to confirm email. Please try again.')
          }
        } else {
          setSuccessMessage('Registration started. Check your email for the OTP to finish.')
        }
      } else {
        setErrorMessage(response?.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error details:', error)
      setErrorMessage(error.message || 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm onSubmit={handleSubmit}>
                  <h1>Register</h1>
                  <p className="text-body-secondary">Create your account</p>

                  {successMessage && <CAlert color="success" className="mb-3">{successMessage}</CAlert>}
                  {errorMessage && <CAlert color="danger" className="mb-3">{errorMessage}</CAlert>}

                  <CInputGroup className="mb-3">
                    <CInputGroupText><CIcon icon={cilUser} /></CInputGroupText>
                    <CFormInput
                      name="name"
                      placeholder="Full Name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      invalid={!!errors.name}
                    />
                  </CInputGroup>
                  {errors.name && <div className="text-danger small mb-2">{errors.name}</div>}

                  <CInputGroup className="mb-3">
                    <CInputGroupText><CIcon icon={cilEnvelopeClosed} /></CInputGroupText>
                    <CFormInput
                      name="email"
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      invalid={!!errors.email}
                    />
                  </CInputGroup>
                  {errors.email && <div className="text-danger small mb-2">{errors.email}</div>}

                  <CInputGroup className="mb-3">
                    <CInputGroupText><CIcon icon={cilLockLocked} /></CInputGroupText>
                    <CFormInput
                      name="password"
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      invalid={!!errors.password}
                    />
                  </CInputGroup>
                  {errors.password && <div className="text-danger small mb-2">{errors.password}</div>}

                  <CInputGroup className="mb-3">
                    <CInputGroupText><CIcon icon={cilLockLocked} /></CInputGroupText>
                    <CFormInput
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      invalid={!!errors.confirmPassword}
                    />
                  </CInputGroup>
                  {errors.confirmPassword && <div className="text-danger small mb-2">{errors.confirmPassword}</div>}

                  <div className="d-grid">
                    <CButton color="success" type="submit" disabled={isLoading}>
                      {isLoading ? <CSpinner size="sm" /> : 'Create Account'}
                    </CButton>
                  </div>

                  <div className="text-center mt-3">
                    <p className="text-body-secondary">
                      Already have an account? <Link to="/login">Login here</Link>
                    </p>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
