import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, Plus, MoreHorizontal, Images, Trash2, Edit } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionsApi } from '@/services/api'
import { CreateCollectionModal } from '@/components/collections/CreateCollectionModal'
import { formatRelativeTime } from '@/lib/utils'
import type { Collection } from '@/types'

export function CollectionsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: collections, isLoading } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await collectionsApi.list()
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await collectionsApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

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
            {collections ? `${collections.length} collections` : 'Organize your visual assets'}
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-all duration-150 hover:scale-[1.02] shadow-glow-brand"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton h-36" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {collections.map((col) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card group overflow-hidden flex flex-col hover:border-brand-500/40 transition-all duration-200 shadow-card hover:shadow-card-lg"
            >
              <Link to={`/collections/${col.id}`} className="block relative h-36 bg-[var(--bg-secondary)] overflow-hidden">
                {col.cover_image_url ? (
                  <img src={col.cover_image_url} alt={col.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] gap-1">
                    <FolderOpen className="w-8 h-8 text-brand-400/60" />
                    <span className="text-2xs">Empty collection</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="badge badge-brand backdrop-blur-md bg-black/50 text-white">
                    {col.asset_count} {col.asset_count === 1 ? 'asset' : 'assets'}
                  </span>
                </div>
              </Link>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/collections/${col.id}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-brand-500 transition-colors truncate">
                      {col.name}
                    </Link>
                    <button
                      onClick={() => deleteMutation.mutate(col.id)}
                      className="p-1 rounded text-[var(--text-tertiary)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {col.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
                      {col.description}
                    </p>
                  )}
                </div>
                <p className="text-2xs text-[var(--text-tertiary)] mt-3">
                  Created {formatRelativeTime(col.created_at)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">No collections yet</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
            Create your first collection to start organizing your cloud assets into groups.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-glow-brand"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Collection
          </button>
        </div>
      )}

      <CreateCollectionModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
