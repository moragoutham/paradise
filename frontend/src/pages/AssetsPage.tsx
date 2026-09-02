import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Images, Upload, Search, Filter, Grid3X3, List, Heart, Trash2, Sliders, ExternalLink, Tag } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi, collectionsApi } from '@/services/api'
import { UploadModal } from '@/components/assets/UploadModal'
import { ImageEditorModal } from '@/components/editor/ImageEditorModal'
import { cn, formatBytes, formatRelativeTime } from '@/lib/utils'
import type { Asset, Collection, ContentType } from '@/types'

type ViewMode = 'grid' | 'list'

export function AssetsPage() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  // Fetch collections for filtering
  const { data: collections } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await collectionsApi.list()
      return res.data
    },
  })

  // Fetch assets with active filters
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', { search, selectedCollection, selectedType, sortBy }],
    queryFn: async () => {
      const params: any = {
        sort_by: sortBy,
        sort_dir: 'desc',
      }
      if (search.trim()) params.search = search.trim()
      if (selectedCollection) params.collection_id = selectedCollection
      if (selectedType) params.content_type = selectedType

      const res = await assetsApi.list(params)
      return res.data
    },
  })

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      return await assetsApi.update(id, { is_favorite: !isFavorite })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  // Delete (soft delete) mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await assetsApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const assets: Asset[] = assetsData?.items || []

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
            {assetsData ? `${assetsData.total} assets in your workspace` : 'Managing visual assets'}
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium',
            'transition-all duration-150 hover:scale-[1.02] shadow-glow-brand',
          )}
        >
          <Upload className="w-4 h-4" />
          Upload Asset
        </button>
      </motion.div>

      {/* Toolbar / Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-3 flex-wrap"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="search"
            placeholder="Search by title, description, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        {/* Collection Filter */}
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="">All Collections</option>
          {collections?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Format Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="">All Formats</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
          <option value="image/gif">GIF</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="created_at">Newest First</option>
          <option value="title">Title (A-Z)</option>
          <option value="file_size">File Size</option>
        </select>

        {/* View Mode */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-[var(--text-tertiary)]'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-[var(--text-tertiary)]'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Assets Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton h-44 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
            <Images className="w-8 h-8" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            {search || selectedCollection || selectedType ? 'No matching assets found' : 'No assets uploaded yet'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
            {search || selectedCollection || selectedType
              ? 'Try adjusting your filters or search terms.'
              : 'Upload your first image directly to Amazon S3 storage with presigned URLs.'}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-glow-brand"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Image
          </button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card group overflow-hidden flex flex-col"
            >
              {/* Image Preview Container */}
              <div className="relative h-48 bg-[var(--bg-secondary)] overflow-hidden">
                {asset.previewUrl ? (
                  <img
                    src={asset.previewUrl}
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                    <Images className="w-8 h-8" />
                  </div>
                )}

                {/* Badges / Collection */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {asset.collection && (
                    <span className="badge badge-brand text-2xs backdrop-blur-md bg-black/50 text-white">
                      {asset.collection.name}
                    </span>
                  )}
                </div>

                {/* Top action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => favoriteMutation.mutate({ id: asset.id, isFavorite: !!asset.is_favorite })}
                    className={cn(
                      'p-1.5 rounded-lg backdrop-blur-md transition-colors',
                      asset.is_favorite ? 'bg-pink-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                    )}
                    title={asset.is_favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => setEditingAsset(asset)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors"
                    title="Edit image"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(asset.id)}
                    className="p-1.5 rounded-lg bg-black/60 text-red-400 hover:bg-red-500 hover:text-white backdrop-blur-md transition-colors"
                    title="Move to trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <Link
                    to={`/assets/${asset.id}`}
                    className="text-xs font-semibold text-[var(--text-primary)] hover:text-brand-500 transition-colors line-clamp-1"
                  >
                    {asset.title}
                  </Link>
                  <p className="text-2xs text-[var(--text-tertiary)] mt-0.5">
                    {formatBytes(asset.file_size)} · {formatRelativeTime(asset.created_at)}
                  </p>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {asset.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-2xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden divide-y divide-[var(--border-subtle)]">
          {assets.map((asset) => (
            <div key={asset.id} className="p-3.5 flex items-center gap-4 hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] overflow-hidden flex-shrink-0">
                {asset.previewUrl ? (
                  <img src={asset.previewUrl} alt={asset.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                    <Images className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/assets/${asset.id}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-brand-500 transition-colors truncate block">
                  {asset.title}
                </Link>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {formatBytes(asset.file_size)} · {asset.content_type} · {asset.collection ? asset.collection.name : 'No collection'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => favoriteMutation.mutate({ id: asset.id, isFavorite: !!asset.is_favorite })}
                  className={cn('p-1.5 rounded-lg', asset.is_favorite ? 'text-pink-500' : 'text-[var(--text-tertiary)] hover:text-pink-500')}
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingAsset(asset)}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500"
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(asset.id)}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} defaultCollectionId={selectedCollection} />
      <ImageEditorModal asset={editingAsset} isOpen={!!editingAsset} onClose={() => setEditingAsset(null)} />
    </div>
  )
}
