import { motion } from 'framer-motion'
import { Trash2, RotateCcw, AlertTriangle, Images } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi } from '@/services/api'
import { formatBytes, formatRelativeTime } from '@/lib/utils'
import type { Asset } from '@/types'

export function TrashPage() {
  const queryClient = useQueryClient()

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', { deleted: true }],
    queryFn: async () => {
      const res = await assetsApi.trash()
      return res.data
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return await assetsApi.restore(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await assetsApi.permanentDelete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const assets: Asset[] = assetsData?.items || []

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
            Soft-deleted assets can be restored or permanently removed from storage.
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 skeleton h-16" />
          ))}
        </div>
      ) : assets.length > 0 ? (
        <div className="card divide-y divide-[var(--border-subtle)] overflow-hidden">
          {assets.map((asset) => (
            <div key={asset.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] overflow-hidden flex-shrink-0">
                  {asset.previewUrl ? (
                    <img src={asset.previewUrl} alt={asset.title} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                      <Images className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{asset.title}</p>
                  <p className="text-2xs text-[var(--text-tertiary)] mt-0.5">
                    {formatBytes(asset.file_size)} · Deleted {formatRelativeTime(asset.deleted_at || asset.updated_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => restoreMutation.mutate(asset.id)}
                  disabled={restoreMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-default)]"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Permanently delete "${asset.title}" from S3 storage and database? This action cannot be undone.`)) {
                      permanentDeleteMutation.mutate(asset.id)
                    }
                  }}
                  disabled={permanentDeleteMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--bg-secondary)] text-[var(--text-tertiary)] flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Trash is empty</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm">
            Deleted assets will appear here before being permanently removed from Amazon S3.
          </p>
        </div>
      )}
    </div>
  )
}
