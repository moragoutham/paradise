import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'

/**
 * Layout for authentication pages (/login, /register).
 * Full-screen split layout with a branded left panel and form on the right.
 * Redirects authenticated users away from auth pages.
 */
export function AuthLayout() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* ── Left: Brand Panel ────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-accent-500" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-400/25 rounded-full blur-2xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-brand-300/15 rounded-full blur-2xl animate-pulse [animation-delay:2s]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 2l2.5-2.5L18 16l-3-2-3.5 3.5-1.5-1.5 3.5-3.5z" />
              </svg>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">FrameVault</span>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Your visual assets,
              <br />
              <span className="text-brand-200">organized and secure.</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-md">
              Upload images to Amazon S3, organize them into collections, and access them anywhere —
              all with enterprise-grade security.
            </p>

            {/* Feature bullets */}
            <div className="space-y-3 pt-2">
              {[
                'Secure S3 storage with presigned URLs',
                'Organize into unlimited collections',
                'Fast search across all your assets',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-400/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-brand-200" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6-7-1-1z" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bottom quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-white/40 text-xs"
          >
            Open source · MIT License · Built with React + FastAPI + AWS
          </motion.div>
        </div>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 2l2.5-2.5L18 16l-3-2-3.5 3.5-1.5-1.5 3.5-3.5z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">FrameVault</span>
          </div>

          {/* Page content (login/register form) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
