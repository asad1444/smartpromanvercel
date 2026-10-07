import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { I } from './icons'
import './Login.css'

const API_BASE_URL = 'https://webapicoderepo.onrender.com/api'

const emptyForgotForm = {
  identifier: '',
  otp: '',
  newPassword: '',
  confirmPassword: ''
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.registered === true
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Forgot Password State
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotForm, setForgotForm] = useState(emptyForgotForm)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleForgotChange = (e) => {
    const { name, value } = e.target
    setForgotForm(prev => ({ ...prev, [name]: value }))
    setForgotError('')
    setForgotSuccess('')
  }

  const closeForgotModal = () => {
    setForgotOpen(false)
    setForgotStep(1)
    setForgotForm(emptyForgotForm)
    setForgotError('')
    setForgotSuccess('')
  }

  const sendForgotOtp = async (e) => {
    e.preventDefault()

    if (!forgotForm.identifier.trim()) {
      setForgotError('Please enter your email address.')
      return
    }

    setForgotLoading(true)
    setForgotError('')
    setForgotSuccess('')

    try {
      const response = await axios.post(`${API_BASE_URL}/company/auth/forgot-password`, {
        identifier: forgotForm.identifier.trim()
      })

      setForgotSuccess(response.data?.message || 'OTP sent successfully.')
      setForgotStep(2)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Unable to send OTP right now.'
      setForgotError(typeof msg === 'string' ? msg : 'Unable to send OTP right now.')
    } finally {
      setForgotLoading(false)
    }
  }

  const verifyForgotOtp = async (e) => {
    e.preventDefault()

    if (!forgotForm.otp.trim()) {
      setForgotError('Please enter the OTP sent to your email.')
      return
    }

    setForgotLoading(true)
    setForgotError('')
    setForgotSuccess('')

    try {
      const response = await axios.post(`${API_BASE_URL}/company/auth/verify-otp`, {
        identifier: forgotForm.identifier.trim(),
        otp: forgotForm.otp.trim()
      })

      setForgotSuccess(response.data?.message || 'OTP verified successfully.')
      setForgotStep(3)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'OTP verification failed.'
      setForgotError(typeof msg === 'string' ? msg : 'OTP verification failed.')
    } finally {
      setForgotLoading(false)
    }
  }

  const resetForgotPassword = async (e) => {
    e.preventDefault()

    if (!forgotForm.newPassword) {
      setForgotError('Please enter a new password.')
      return
    }

    if (forgotForm.newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.')
      return
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError('Passwords do not match.')
      return
    }

    setForgotLoading(true)
    setForgotError('')
    setForgotSuccess('')

    try {
      const response = await axios.post(`${API_BASE_URL}/company/auth/reset-password`, {
        identifier: forgotForm.identifier.trim(),
        otp: forgotForm.otp.trim(),
        newPassword: forgotForm.newPassword,
        confirmPassword: forgotForm.confirmPassword
      })

      setForgotSuccess(response.data?.message || 'Password reset successfully.')
      setForgotStep(1)
      setForgotForm(emptyForgotForm)
      setTimeout(() => closeForgotModal(), 1800)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Password reset failed.'
      setForgotError(typeof msg === 'string' ? msg : 'Password reset failed.')
    } finally {
      setForgotLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/company/auth/login`,
        {
          identifier: formData.email.trim(),
          password: formData.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const responseData = response.data || {}
      const token = responseData.Token || responseData.token || responseData.accessToken
      const company = responseData.company || {}

      if (token) {
        sessionStorage.setItem('token', token)
      }

      if (company && Object.keys(company).length > 0) {
        sessionStorage.setItem('company', JSON.stringify(company))
      }

      window.dispatchEvent(new Event('auth-changed'))
      navigate('/Dashboard', { replace: true })
    } catch (err) {
      if (err.response) {
        // Server ne error diya
        setApiError(
          err.response.data?.message ||
          err.response.data?.title ||
          `Login failed (${err.response.status}). Please try again.`
        )
      } else {
        // Network error
        setApiError('Network error. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card login-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">SPM</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to SMART PROMAN</p>
        </div>

        {justRegistered && (
          <div className="auth-success forgot-message" style={{ marginBottom: '12px' }}>
            Account created successfully! Please sign in.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Email */}
          <div className="form-field">
            <label className="field-label">Email Address <span className="req">*</span></label>
            <div className="input-wrap">
              <span className="inp-ico">{I.search}</span>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className={`field-input ${errors.email ? 'is-error' : ''}`}
                autoFocus
              />
            </div>
            {errors.email && <span className="err-msg">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="field-label">Password <span className="req">*</span></label>
            <div className="input-wrap">
              <span className="inp-ico">{I.shield}</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={`field-input ${errors.password ? 'is-error' : ''}`}
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                {I.eye}
              </button>
            </div>
            {errors.password && <span className="err-msg">{errors.password}</span>}
          </div>

          {/* Remember / Forgot */}
          <div className="login-row">
            <label className="check-label">
              <input type="checkbox" />
              Remember me
            </label>
            <button type="button" className="link-btn" onClick={() => setForgotOpen(true)}>Forgot Password?</button>
          </div>

          {/* API Error */}
          {apiError && (
            <span className="err-msg" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>
              {apiError}
            </span>
          )}

          {/* Submit */}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing In…' : 'Sign In'}
            {!loading && <span className="btn-arr">{I.login}</span>}
          </button>

          {/* Footer */}
          <div className="auth-footer">
            Don't have an account?{' '}
            <button type="button" className="link-btn" onClick={() => navigate('/register')}>
              Create Account
            </button>
          </div>

        </form>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="forgot-overlay" onClick={closeForgotModal}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forgot-header">
              <h2>Reset Password</h2>
              <button type="button" className="close-btn" onClick={closeForgotModal}>×</button>
            </div>

            {forgotError && <div className="auth-error forgot-message">{forgotError}</div>}
            {forgotSuccess && <div className="auth-success forgot-message">{forgotSuccess}</div>}

            {forgotStep === 1 && (
              <form onSubmit={sendForgotOtp} className="forgot-form">
                <p>Enter your email address. We will send a one-time password to you.</p>
                <div className="form-field">
                  <label className="field-label">Email Address <span className="req">*</span></label>
                  <div className="input-wrap">
                    <span className="inp-ico">{I.search}</span>
                    <input
                      type="email"
                      name="identifier"
                      value={forgotForm.identifier}
                      onChange={handleForgotChange}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="field-input"
                    />
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={verifyForgotOtp} className="forgot-form">
                <p>Enter the OTP sent to <strong>{forgotForm.identifier}</strong>.</p>
                <div className="form-field">
                  <label className="field-label">OTP Code <span className="req">*</span></label>
                  <div className="input-wrap">
                    <span className="inp-ico">{I.shield}</span>
                    <input
                      type="text"
                      name="otp"
                      value={forgotForm.otp}
                      onChange={handleForgotChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="field-input"
                    />
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={forgotLoading}>
                  {forgotLoading ? 'Verifying…' : 'Verify OTP'}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={resetForgotPassword} className="forgot-form">
                <p>Create a new password for <strong>{forgotForm.identifier}</strong>.</p>
                <div className="form-field">
                  <label className="field-label">New Password <span className="req">*</span></label>
                  <div className="input-wrap">
                    <span className="inp-ico">{I.shield}</span>
                    <input
                      type="password"
                      name="newPassword"
                      value={forgotForm.newPassword}
                      onChange={handleForgotChange}
                      placeholder="Minimum 6 characters"
                      className="field-input"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Confirm Password <span className="req">*</span></label>
                  <div className="input-wrap">
                    <span className="inp-ico">{I.shield}</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={forgotForm.confirmPassword}
                      onChange={handleForgotChange}
                      placeholder="Repeat new password"
                      className="field-input"
                    />
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={forgotLoading}>
                  {forgotLoading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
