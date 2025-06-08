'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
}

interface FormData {
  email: string
  password: string
  name: string
  username: string
}

interface FormErrors {
  email?: string
  password?: string
  name?: string
  username?: string
  general?: string
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    username: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Password validation
    if (mode !== 'forgot') {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (mode === 'signup' && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }
    }

    // Name validation for signup
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      if (mode === 'signup') {
        // Sign up with email
        const response = await fetch(`${apiUrl}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            username: formData.username || undefined
          })
        })

        const data = await response.json()

        if (response.ok) {
          toast.success('Account created! Check your email to verify.')
          setMode('signin')
          setFormData({ ...formData, password: '' })
        } else {
          setErrors({ general: data.detail || 'Failed to create account' })
        }
      } else if (mode === 'signin') {
        // Sign in with email
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        })

        const data = await response.json()

        if (response.ok) {
          // Store the JWT token and redirect
          localStorage.setItem('auth_token', data.access_token)
          toast.success('Signed in successfully!')
          window.location.href = '/dashboard'
        } else {
          setErrors({ general: data.detail || 'Invalid email or password' })
        }
      } else if (mode === 'forgot') {
        // Forgot password
        const response = await fetch(`${apiUrl}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        })

        if (response.ok) {
          toast.success('Password reset link sent to your email!')
          setMode('signin')
        } else {
          const data = await response.json()
          setErrors({ general: data.detail || 'Failed to send reset email' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', username: '' })
    setErrors({})
  }

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode)
    resetForm()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white border-8 border-black max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="heading-sm">
            {mode === 'signin' && 'SIGN IN'}
            {mode === 'signup' && 'CREATE ACCOUNT'}
            {mode === 'forgot' && 'RESET PASSWORD'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full btn-secondary mb-6 flex items-center justify-center space-x-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white font-mono uppercase tracking-wider text-gray-600">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-4 p-4 border-2 border-red-500 bg-red-50 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-mono text-sm">{errors.general}</span>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Name field for signup */}
            {mode === 'signup' && (
              <div>
                <label className="block text-caption font-bold text-gray-900 mb-2">
                  FULL NAME *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full pl-12 pr-4 py-3 border-2 ${errors.name ? 'border-red-500' : 'border-black'} focus:outline-none focus:ring-0 font-mono`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-red-500 text-xs font-mono">{errors.name}</p>
                )}
              </div>
            )}

            {/* Username field for signup */}
            {mode === 'signup' && (
              <div>
                <label className="block text-caption font-bold text-gray-900 mb-2">
                  USERNAME (OPTIONAL)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-mono">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full pl-8 pr-4 py-3 border-2 ${errors.username ? 'border-red-500' : 'border-black'} focus:outline-none focus:ring-0 font-mono`}
                    placeholder="username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-red-500 text-xs font-mono">{errors.username}</p>
                )}
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-caption font-bold text-gray-900 mb-2">
                EMAIL ADDRESS *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-12 pr-4 py-3 border-2 ${errors.email ? 'border-red-500' : 'border-black'} focus:outline-none focus:ring-0 font-mono`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-red-500 text-xs font-mono">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-caption font-bold text-gray-900 mb-2">
                  PASSWORD *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full pl-12 pr-12 py-3 border-2 ${errors.password ? 'border-red-500' : 'border-black'} focus:outline-none focus:ring-0 font-mono`}
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-red-500 text-xs font-mono">{errors.password}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'SIGN IN'}
                    {mode === 'signup' && 'CREATE ACCOUNT'}
                    {mode === 'forgot' && 'SEND RESET LINK'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switching */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <p className="text-caption text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="font-bold text-black hover:underline"
                  >
                    Create one
                  </button>
                </p>
                <p className="text-caption text-gray-600">
                  <button
                    onClick={() => switchMode('forgot')}
                    className="font-bold text-black hover:underline"
                  >
                    Forgot your password?
                  </button>
                </p>
              </>
            )}
            
            {mode === 'signup' && (
              <p className="text-caption text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="font-bold text-black hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            
            {mode === 'forgot' && (
              <p className="text-caption text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="font-bold text-black hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 