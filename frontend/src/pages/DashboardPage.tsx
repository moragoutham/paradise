import { motion } from 'framer-motion'
import {
  Images,
  FolderOpen,
  HardDrive,
  Heart,
  Upload,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react'
import { cn, formatBytes, formatRelativeTime } from '@/lib/utils'
import { useAuthStore } from '@/stores'

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  iconBg: string
  iconColor: string
  trend?: string
  delay?: number
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card group hover:shadow-card-lg transition-all duration-200"
    >
      <div className={cn('icon-container w-11 h-11', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">{label}</p>
        {trend && (
          <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            {trend}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ── Recent Asset Row ──────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[var(--text-tertiary)]" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-tertiary)] max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, description, color }: {
  icon: React.ElementType
  label: string
  description: string
  color: string
}) {
  return (
    <button
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl w-full text-left',
        'border border-[var(--border-subtle)] bg-[var(--bg-secondary)]',
        'hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-default)]',
        'transition-all duration-150 group',
      )}
    >
      <div className={cn('icon-container w-10 h-10 rounded-xl', color)}>
        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-brand-500 transition-colors">
          {label}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
      </div>
    </button>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.email?.split('@')[0] ?? 'there'

  // Placeholder stats — will be replaced with real API data in Phase 2
  const stats = [
    {
      label: 'Total Assets',
      value: '0',
      icon: Images,
      iconBg: 'bg-brand-500/10',
      iconColor: 'text-brand-500',
      trend: undefined,
    },
    {
      label: 'Collections',
      value: '0',
      icon: FolderOpen,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Storage Used',
      value: formatBytes(0),
      icon: HardDrive,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500',
    },
    {
      label: 'Favorites',
      value: '0',
      icon: Heart,
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-500',
    },
  ]

  const quickActions = [
    {
      icon: Upload,
      label: 'Upload Assets',
      description: 'Add images to your workspace',
      color: 'bg-brand-500',
    },
    {
      icon: FolderOpen,
      label: 'New Collection',
      description: 'Organize your assets into groups',
      color: 'bg-violet-500',
    },
  ]

  return (
    <div className="page-container space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 17
                ? 'afternoon'
                : 'evening'}
            , {firstName} 👋
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0',
            'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
            'transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
            'shadow-glow-brand',
          )}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          Upload
        </button>
      </motion.div>

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Workspace statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} delay={i * 0.05} />
          ))}
        </div>
      </section>

      {/* ── Main content grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Recent Assets (2/3 width) ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="xl:col-span-2 card overflow-hidden"
          aria-labelledby="recent-assets-heading"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
              <h2 id="recent-assets-heading" className="section-heading text-base">
                Recent Assets
              </h2>
            </div>
            <button className="text-xs text-brand-500 hover:text-brand-400 transition-colors font-medium">
              View all →
            </button>
          </div>

          <EmptyState
            icon={Images}
            title="No assets yet"
            description="Upload your first image to get started. Drag and drop or click to select files."
            action={
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl',
                  'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
                  'transition-all duration-150',
                )}
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Upload your first asset
              </button>
            }
          />
        </motion.section>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card overflow-hidden"
            aria-labelledby="quick-actions-heading"
          >
            <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--border-subtle)]">
              <Sparkles className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
              <h2 id="quick-actions-heading" className="section-heading text-base">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {quickActions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </div>
          </motion.section>

          {/* Recent Collections */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card overflow-hidden"
            aria-labelledby="recent-collections-heading"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
                <h2 id="recent-collections-heading" className="section-heading text-base">
                  Collections
                </h2>
              </div>
              <button className="text-xs text-brand-500 hover:text-brand-400 transition-colors font-medium">
                View all →
              </button>
            </div>
            <EmptyState
              icon={FolderOpen}
              title="No collections yet"
              description="Create a collection to organize your assets."
            />
          </motion.section>

          {/* Favorites */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="card overflow-hidden"
            aria-labelledby="favorites-heading"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
                <h2 id="favorites-heading" className="section-heading text-base">
                  Favorites
                </h2>
              </div>
              <button className="text-xs text-brand-500 hover:text-brand-400 transition-colors font-medium">
                View all →
              </button>
            </div>
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              description="Mark assets as favorites to find them quickly."
            />
          </motion.section>
        </div>
      </div>
    </div>
  )
}
