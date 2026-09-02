import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TrashPage() {
  return (
    <div className="page-container space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Trash</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Deleted assets are kept here for 30 days before permanent deletion.
          </p>
        </div>
        <button
          disabled
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
            'border border-red-500/30 text-red-500 hover:bg-red-500/10',
            'transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Empty Trash
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-[var(--bg-secondary)] flex items-center justify-center mb-6">
          <Trash2 className="w-10 h-10 text-[var(--text-tertiary)]" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Trash is empty</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          Deleted assets will appear here. You can restore them or permanently delete them.
        </p>
      </motion.div>
    </div>
  )
}
