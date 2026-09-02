import { motion } from 'framer-motion'
import { Images, Upload, Search, Filter, Grid3X3, List } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

export function AssetsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            All Assets
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            0 assets in your workspace
          </p>
        </div>
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
            'transition-all duration-150 hover:scale-[1.02] shadow-glow-brand',
          )}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          Upload
        </button>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-3 flex-wrap"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search assets…"
            className={cn(
              'w-full pl-9 pr-4 py-2 text-sm rounded-xl',
              'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
              'transition-all duration-150',
            )}
            aria-label="Search assets"
          />
        </div>

        {/* Filter */}
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm',
            'border border-[var(--border-subtle)] bg-[var(--bg-secondary)]',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-tertiary)] transition-colors',
          )}
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          Filter
        </button>

        {/* View mode toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
          role="group"
          aria-label="View mode"
        >
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-brand-500 text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            )}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid3X3 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-brand-500 text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            )}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>

      {/* Empty state */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 flex items-center justify-center mb-6">
          <Images className="w-10 h-10 text-brand-400" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          No assets yet
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
          Upload your first image to get started. Supports JPEG, PNG, WebP, and GIF up to 25 MB.
        </p>
        <button
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl',
            'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
            'transition-all duration-150 hover:scale-[1.02] shadow-glow-brand',
          )}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          Upload your first asset
        </button>
      </motion.div>
    </div>
  )
}
