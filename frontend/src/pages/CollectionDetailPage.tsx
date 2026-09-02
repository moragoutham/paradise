import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, ArrowLeft, Upload, Images } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="page-container space-y-6">
      {/* Back link */}
      <Link
        to="/collections"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Collections
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center">
            <FolderOpen className="w-7 h-7 text-brand-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Collection
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              Collection ID: {id} · 0 assets
            </p>
          </div>
        </div>
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0',
            'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
            'transition-all duration-150 hover:scale-[1.02] shadow-glow-brand',
          )}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          Upload to collection
        </button>
      </motion.div>

      {/* Empty state */}
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
          <Images className="w-8 h-8 text-[var(--text-tertiary)]" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">
          This collection is empty
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          Upload images to this collection to get started.
        </p>
      </div>
    </div>
  )
}
