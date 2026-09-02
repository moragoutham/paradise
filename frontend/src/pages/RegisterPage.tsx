import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import { authApi } from '@/services/api'
import type { User } from '@/types'

interface PasswordStrength {
  score: number       // 0–4
  label: string
  color: string
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels: PasswordStrength[] = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Weak', color: 'bg-red-500' },
    { score: 2, label: 'Fair', color: 'bg-amber-500' },
    { score: 3, label: 'Good', color: 'bg-emerald-400' },
    { score: 4, label: 'Strong', color: 'bg-emerald-500' },
  ]
  return levels[score]
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = password ? getPasswordStrength(password) : null
  const passwordsMatch = password && confirmPassword && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.register(email, password)
      const { user, accessToken } = response.data as { user: User; accessToken: string }
      setUser(user, accessToken)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } }
      if (axiosErr.response?.status === 409) {
        setError('An account with this email already exists.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Get started with FrameVault — free forever
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium text-[var(--text-primary)]">
            Email address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
              aria-hidden="true"
            />
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={isLoading}
              className={cn(
                'w-full pl-10 pr-4 py-3 text-sm rounded-xl',
                'bg-[var(--bg-secondary)] border border-[var(--border-default)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50',
                'disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150',
              )}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium text-[var(--text-primary)]">
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
              aria-hidden="true"
            />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
              disabled={isLoading}
              aria-describedby="password-strength"
              className={cn(
                'w-full pl-10 pr-12 py-3 text-sm rounded-xl',
                'bg-[var(--bg-secondary)] border border-[var(--border-default)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50',
                'disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Password strength meter */}
          {password && strength && (
            <div id="password-strength" aria-live="polite">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'flex-1 h-1 rounded-full transition-all duration-300',
                      level <= strength.score ? strength.color : 'bg-[var(--border-subtle)]',
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Password strength:{' '}
                <span
                  className={cn(
                    'font-medium',
                    strength.score <= 1 && 'text-red-500',
                    strength.score === 2 && 'text-amber-500',
                    strength.score >= 3 && 'text-emerald-500',
                  )}
                >
                  {strength.label}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <label
            htmlFor="register-confirm-password"
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
              aria-hidden="true"
            />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              disabled={isLoading}
              className={cn(
                'w-full pl-10 pr-12 py-3 text-sm rounded-xl',
                'bg-[var(--bg-secondary)] border',
                confirmPassword
                  ? passwordsMatch
                    ? 'border-emerald-500/50'
                    : 'border-red-500/50'
                  : 'border-[var(--border-default)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50',
                'disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150',
              )}
            />
            {confirmPassword && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {passwordsMatch ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" aria-label="Passwords match" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" aria-label="Passwords do not match" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 px-4',
            'bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm rounded-xl',
            'transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]',
            'shadow-glow-brand disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
          )}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Create account
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-center text-[var(--text-tertiary)]">
          By creating an account, you agree to our{' '}
          <button type="button" className="text-brand-500 hover:text-brand-400 transition-colors">
            Terms of Service
          </button>{' '}
          and{' '}
          <button type="button" className="text-brand-500 hover:text-brand-400 transition-colors">
            Privacy Policy
          </button>
          .
        </p>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-brand-500 hover:text-brand-400 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
