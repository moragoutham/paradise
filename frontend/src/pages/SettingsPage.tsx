import { motion } from 'framer-motion'
import { Settings, User, Shield, HardDrive, Moon, Sun, Monitor, LogOut, Check } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/stores'
import { authApi } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { user, clearAuth } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <div className="page-container max-w-4xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your account preferences and cloud storage configuration
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="icon-container w-10 h-10 bg-brand-500/10 text-brand-500 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">User Profile</h2>
            <p className="text-xs text-[var(--text-secondary)]">Your account credentials and ID</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Email Address
            </label>
            <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{user?.email || 'user@example.com'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              User ID
            </label>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 break-all">{user?.id || '—'}</p>
          </div>
        </div>
      </motion.section>

      {/* Theme Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="icon-container w-10 h-10 bg-violet-500/10 text-violet-500 rounded-xl">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Appearance</h2>
            <p className="text-xs text-[var(--text-secondary)]">Customize interface theme</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map((item) => {
            const Icon = item.icon
            const isSelected = theme === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as 'light' | 'dark' | 'system')}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-150',
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-semibold shadow-glow-brand'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
                )}
              >
                <Icon className="w-5 h-5 mb-2" />
                <span className="text-xs">{item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 mt-1" />}
              </button>
            )
          })}
        </div>
      </motion.section>

      {/* Storage Architecture Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="icon-container w-10 h-10 bg-cyan-500/10 text-cyan-500 rounded-xl">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Cloud Storage Architecture</h2>
            <p className="text-xs text-[var(--text-secondary)]">S3 Object Storage & Presigned URLs status</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <span className="font-medium text-[var(--text-primary)]">Storage Adapter</span>
            <span className="badge badge-brand">Amazon S3 / Local Dev</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <span className="font-medium text-[var(--text-primary)]">Upload Security</span>
            <span className="badge badge-success">Time-limited Presigned URLs</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <span className="font-medium text-[var(--text-primary)]">Frontend AWS Credential Exposure</span>
            <span className="badge badge-success">Zero Keys Exposed (100% Secure)</span>
          </div>
        </div>
      </motion.section>

      {/* Danger Zone / Logout */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="card p-6 border-red-500/20 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-red-500">Sign Out</h2>
            <p className="text-xs text-[var(--text-secondary)]">Log out of your FrameVault session</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.section>
    </div>
  )
}
