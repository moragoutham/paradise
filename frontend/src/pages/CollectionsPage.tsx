import { motion } from 'framer-motion'
import { FolderOpen, Plus, MoreHorizontal, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function CollectionCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-40 rounded-t-2xl rounded-b-none" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  )
}

function EmptyCollections() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center mb-6"
      >
        <FolderOpen className="w-10 h-10 text-brand-400" aria-hidden="true" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          No collections yet
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
          Create your first collection to start organizing your visual assets into meaningful groups.
        </p>
        <button
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl mx-auto',
            'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
            'transition-all duration-150 hover:scale-[1.02] shadow-glow-brand',
          )}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Create first collection
        </button>
      </motion.div>
    </div>
  )
}

export function CollectionsPage() {
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
            Collections
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Organize your assets into collections
          </p>
        </div>
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
            'transition-all duration-150 hover:scale-[1.02] shadow-glow-brand',
          )}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Collection
        </button>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <EmptyCollections />
      </div>
    </div>
  )
}
