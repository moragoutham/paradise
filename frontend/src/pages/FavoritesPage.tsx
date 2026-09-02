import { motion } from 'framer-motion'
import { Heart, Images } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi } from '@/services/api'
import { Link } from 'react-router-dom'
import { formatBytes, formatRelativeTime } from '@/lib/utils'
import type { Asset } from '@/types'

export function FavoritesPage() {
  const queryClient = useQueryClient()

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', { favorites_only: true }],
    queryFn: async () => {
      const res = await assetsApi.list({ favorites_only: true })
      return res.data
    },
  })

  const unfavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await assetsApi.update(id, { is_favorite: false })
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
      >
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Favorites</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {assets.length} marked favorite {assets.length === 1 ? 'asset' : 'assets'}
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton h-44 w-full" />
            </div>
          ))}
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="card group overflow-hidden flex flex-col">
              <div className="relative h-48 bg-[var(--bg-secondary)] overflow-hidden">
                {asset.previewUrl ? (
                  <img src={asset.previewUrl} alt={asset.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                    <Images className="w-8 h-8" />
                  </div>
                )}
                <button
                  onClick={() => unfavoriteMutation.mutate(asset.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-pink-500 text-white backdrop-blur-md shadow-md"
                  title="Remove from favorites"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
              <div className="p-3.5">
                <Link to={`/assets/${asset.id}`} className="text-xs font-semibold text-[var(--text-primary)] hover:text-brand-500 truncate block">
                  {asset.title}
                </Link>
                <p className="text-2xs text-[var(--text-tertiary)] mt-0.5">
                  {formatBytes(asset.file_size)} · {formatRelativeTime(asset.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            No favorites yet
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
            Click the heart icon on any asset in your library to add it to your favorites.
          </p>
          <Link
            to="/assets"
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-medium shadow-glow-brand"
          >
            Browse All Assets
          </Link>
        </motion.div>
      )}
    </div>
  )
}
