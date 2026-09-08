import { Menu, Search, Sun, Moon, Monitor, Bell } from 'lucide-react'
import { useUIStore, useAuthStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { Theme } from '@/types'

const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

export function Topbar() {
  const { theme, setTheme, toggleSidebar, sidebarCollapsed } = useUIStore()
  const { user } = useAuthStore()

  // Cycle through themes
  const cycleTheme = () => {
    const current = themeOptions.findIndex((t) => t.value === theme)
    const next = themeOptions[(current + 1) % themeOptions.length]
    setTheme(next.value)
  }

  const ThemeIcon = themeOptions.find((t) => t.value === theme)?.icon ?? Moon

  return (
    <header
      className={cn(
        'flex items-center h-16 px-4 sm:px-6',
        'bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]',
        'flex-shrink-0 sticky top-0 z-10',
      )}
      role="banner"
    >
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'lg:hidden flex items-center justify-center w-9 h-9 rounded-lg mr-3',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'hover:bg-[var(--bg-secondary)] transition-colors',
        )}
        aria-label={sidebarCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
        aria-expanded={!sidebarCollapsed}
        aria-controls="main-navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search assets, collections…"
            className={cn(
              'w-full pl-9 pr-4 py-2 text-sm rounded-xl',
              'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50',
              'transition-all duration-150',
            )}
            aria-label="Search assets and collections"
          />
          <kbd
            className={cn(
              'hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2',
              'items-center gap-1 px-1.5 py-0.5 rounded text-2xs',
              'text-[var(--text-tertiary)] border border-[var(--border-subtle)]',
              'bg-[var(--bg-tertiary)] font-mono',
            )}
            aria-hidden="true"
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Right actions ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 ml-4">
        {/* Notifications */}
        <button
          className={cn(
            'relative flex items-center justify-center w-9 h-9 rounded-lg',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-secondary)] transition-colors',
          )}
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" aria-hidden="true" />
          {/* Notification dot */}
          <span
            className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full"
            aria-hidden="true"
          />
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-secondary)] transition-colors',
          )}
          aria-label={`Current theme: ${theme}. Click to cycle theme.`}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* User avatar (topbar — mobile) */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex-shrink-0 cursor-pointer"
          aria-label={`User: ${user?.email}`}
          title={user?.email}
          role="button"
          tabIndex={0}
        >
          <span className="text-white text-xs font-bold uppercase">
            {user?.email?.charAt(0) ?? 'U'}
          </span>
        </div>
      </div>
    </header>
  )
}
