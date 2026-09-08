import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Images,
  Heart,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore, useUploadStore } from '@/stores'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/collections', icon: FolderOpen, label: 'Collections' },
  { to: '/assets', icon: Images, label: 'All Assets' },
  { to: '/favorites', icon: Heart, label: 'Favorites' },
] as const

const bottomNavItems = [
  { to: '/trash', icon: Trash2, label: 'Trash' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { openUploadPanel } = useUploadStore()
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <>
      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ───────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30',
          'flex flex-col',
          'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
          'overflow-hidden',
          // Mobile: always show, controlled by overlay
          // Desktop: always visible, just width changes
          'lg:relative lg:z-auto',
          !sidebarCollapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform lg:transition-none',
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* ── Logo / Header ──────────────────────────────────────────────── */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--sidebar-border)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-glow-brand">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 2l2.5-2.5L18 16l-3-2-3.5 3.5-1.5-1.5 3.5-3.5z" />
              </svg>
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="font-bold text-[var(--text-primary)] text-base tracking-tight whitespace-nowrap"
                >
                  FrameVault
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'hidden lg:flex items-center justify-center',
              'w-6 h-6 rounded-md ml-auto flex-shrink-0',
              'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
              'hover:bg-[var(--bg-tertiary)] transition-colors',
            )}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* ── Upload CTA ─────────────────────────────────────────────────── */}
        <div className={cn('px-3 pt-4 pb-2 flex-shrink-0', sidebarCollapsed && 'flex justify-center')}>
          <button
            onClick={openUploadPanel}
            className={cn(
              'flex items-center gap-2.5 rounded-xl bg-brand-500 hover:bg-brand-600',
              'text-white font-medium text-sm transition-all duration-150',
              'shadow-glow-brand hover:shadow-glow-brand hover:scale-[1.02] active:scale-[0.98]',
              sidebarCollapsed ? 'w-10 h-10 justify-center' : 'w-full px-4 py-2.5',
            )}
            aria-label="Upload new asset"
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap"
                >
                  Upload
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* ── Primary Navigation ─────────────────────────────────────────── */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-none">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'sidebar-item',
                  isActive && 'active',
                  sidebarCollapsed && 'justify-center px-0',
                )
              }
              title={sidebarCollapsed ? label : undefined}
              aria-label={label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom section ─────────────────────────────────────────────── */}
        <div className="px-3 pb-4 space-y-1 border-t border-[var(--sidebar-border)] pt-3 flex-shrink-0">
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'sidebar-item',
                  isActive && 'active',
                  sidebarCollapsed && 'justify-center px-0',
                  to === '/trash' && 'hover:text-red-500',
                )
              }
              title={sidebarCollapsed ? label : undefined}
              aria-label={label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}

          {/* ── User avatar ─────────────────────────────────────────────── */}
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2 mt-2 rounded-xl',
              'border border-[var(--border-subtle)]',
              'bg-[var(--bg-secondary)]',
              sidebarCollapsed && 'justify-center px-0',
            )}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {user?.email?.charAt(0) ?? 'U'}
              </span>
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0 flex-1"
                >
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {user?.email ?? 'User'}
                  </p>
                  <p className="text-2xs text-[var(--text-tertiary)]">Free plan</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
