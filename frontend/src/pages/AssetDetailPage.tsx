import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Trash2, Heart, Edit, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="page-container space-y-6">
      {/* Back link */}
      <Link
        to="/assets"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Assets
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Image preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="xl:col-span-2 card overflow-hidden"
        >
          <div className="flex items-center justify-center h-96 bg-[var(--bg-secondary)]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🖼️</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">Asset ID: {id}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Preview will appear here after upload
              </p>
            </div>
          </div>
        </motion.div>

        {/* Metadata panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Actions */}
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium',
                  'bg-brand-500 hover:bg-brand-600 text-white transition-all duration-150',
                )}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download
              </button>
              <button
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl',
                  'border border-[var(--border-subtle)] bg-[var(--bg-secondary)]',
                  'text-[var(--text-secondary)] hover:text-pink-500 transition-colors',
                )}
                aria-label="Add to favorites"
              >
                <Heart className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl',
                  'border border-[var(--border-subtle)] bg-[var(--bg-secondary)]',
                  'text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors',
                )}
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="card p-5 space-y-4">
            <h2 className="section-heading text-base">Details</h2>
            <div className="space-y-3">
              {[
                { label: 'Title', value: '—' },
                { label: 'Collection', value: '—' },
                { label: 'File type', value: '—' },
                { label: 'File size', value: '—' },
                { label: 'Uploaded', value: '—' },
                { label: 'Modified', value: '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0 pt-0.5">
                    {label}
                  </span>
                  <span className="text-xs text-[var(--text-primary)] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="card p-5 space-y-3">
            <h2 className="section-heading text-base">Tags</h2>
            <p className="text-sm text-[var(--text-tertiary)]">No tags added yet.</p>
          </div>

          {/* Danger zone */}
          <div className="card p-4 border-red-500/20">
            <button
              className={cn(
                'flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors',
              )}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete asset
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
