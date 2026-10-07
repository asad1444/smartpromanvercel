import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { I } from './icons'
import './Login.css'
import './Register.css'

const API_BASE_URL = 'https://webapicoderepo.onrender.com/api'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    cnic: ''
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    const mobileRegex = /^[0-9]{10,15}$/
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!mobileRegex.test(formData.mobile.replace(/[\s-]/g, ''))) {
      newErrors.mobile = 'Invalid mobile number (10-15 digits)'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    const cnicRegex = /^[0-9]{13}$/
    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required'
    } else if (!cnicRegex.test(formData.cnic.replace(/-/g, ''))) {
      newErrors.cnic = 'Invalid CNIC (13 digits required)'
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
      const response = await axios.post(`${API_BASE_URL}/company/auth/register`, {
        companyName: formData.name.trim(),
        inchargeName: formData.name.trim(),
        inchargePhone: formData.mobile.trim(),
        email: formData.email.trim(),
        password: formData.password,
        city: '',
        zone: '',
        serviceType: ''
      })

      if (response.status === 200 || response.status === 201) {
        navigate('/login', { state: { registered: true } })
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Registration failed. Please try again.'
      setApiError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">SPM</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">SMART PROMAN — Register to get started</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form register-form-grid">

          {/* Full Name */}
          <div className="form-field">
            <label className="field-label">Full Name <span className="req">*</span></label>
            <div className="input-wrap">
              <span className="inp-ico">{I.userIco}</span>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className={`field-input ${errors.name ? 'is-error' : ''}`}
                autoFocus
              />
            </div>
            {errors.name && <span className="err-msg">{errors.name}</span>}
          </div>

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
              />
            </div>
            {errors.email && <span className="err-msg">{errors.email}</span>}
          </div>

          {/* Mobile */}
          <div className="form-field">
            <label className="field-label">Mobile Number <span className="req">*</span></label>
            <div className="input-wrap">
              <span className="inp-ico">{I.phone}</span>
              <input
                type="tel"
                name="mobile"
                placeholder="03001234567"
                value={formData.mobile}
                onChange={handleChange}
                className={`field-input ${errors.mobile ? 'is-error' : ''}`}
              />
            </div>
            {errors.mobile && <span className="err-msg">{errors.mobile}</span>}
          </div>

          {/* CNIC */}
          <div className="form-field">
            <label className="field-label">CNIC Number <span className="req">*</span></label>
            <div className="input-wrap">
              <span className="inp-ico">{I.clip}</span>
              <input
                type="text"
                name="cnic"
                placeholder="12345-1234567-1"
                value={formData.cnic}
                onChange={handleChange}
                className={`field-input ${errors.cnic ? 'is-error' : ''}`}
                maxLength="15"
              />
            </div>
            {errors.cnic && <span className="err-msg">{errors.cnic}</span>}
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="field-label">Password <span className="req">*</span></label>
            <div className="input-wrap">
              <span className="inp-ico">{I.shield}</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a strong password"
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

          {/* Confirm Password */}
          <div className="form-field">
            <label className="field-label">Confirm Password <span className="req">*</span></label>
            <div className="input-wrap">
              <span className="inp-ico">{I.shield}</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`field-input ${errors.confirmPassword ? 'is-error' : ''}`}
              />
              <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {I.eye}
              </button>
            </div>
            {errors.confirmPassword && <span className="err-msg">{errors.confirmPassword}</span>}
          </div>

          {/* API Error */}
          {apiError && (
            <div className="form-field full-col">
              <span className="err-msg" style={{ display: 'block', textAlign: 'center' }}>{apiError}</span>
            </div>
          )}

          {/* Submit */}
          <div className="form-field full-col">
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account'}
              {!loading && <span className="btn-arr">{I.login}</span>}
            </button>
          </div>

          {/* Footer */}
          <div className="auth-footer full-col">
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
