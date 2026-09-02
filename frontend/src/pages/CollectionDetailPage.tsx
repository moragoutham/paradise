import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, ArrowLeft, Upload, Images, Trash2, Edit2, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionsApi, assetsApi } from '@/services/api'
import { UploadModal } from '@/components/assets/UploadModal'
import { formatBytes, formatRelativeTime } from '@/lib/utils'
import type { Collection, Asset } from '@/types'

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: collection, isLoading: colLoading } = useQuery<Collection>({
    queryKey: ['collection', id],
    queryFn: async () => {
      const res = await collectionsApi.get(id!)
      const c = res.data
      setName(c.name)
      setDescription(c.description || '')
      return c
    },
    enabled: !!id,
  })

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', { collection_id: id }],
    queryFn: async () => {
      const res = await assetsApi.list({ collection_id: id })
      return res.data
    },
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await collectionsApi.update(id!, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
    },
    onSuccess: () => {
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await collectionsApi.delete(id!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate('/collections')
    },
  })

  const assets: Asset[] = assetsData?.items || []

  if (colLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Collection not found</h2>
        <Link to="/collections" className="text-xs text-brand-500 mt-2 inline-block">Back to collections</Link>
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      {/* Back button */}
      <Link
        to="/collections"
        className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      {/* Header */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-7 h-7 text-brand-400" />
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate()
                }}
                className="space-y-2"
              >
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1.5 text-base font-bold rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                />
                <input
                  type="text"
                  placeholder="Description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] w-full"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-1 text-xs rounded-lg bg-brand-500 text-white font-medium">Save</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs rounded-lg border text-[var(--text-secondary)]">Cancel</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[var(--text-primary)]">{collection.name}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded text-[var(--text-tertiary)] hover:text-brand-500"
                    title="Edit collection"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {collection.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{collection.description}</p>
                )}
                <p className="text-2xs text-[var(--text-tertiary)] mt-2">
                  {assets.length} {assets.length === 1 ? 'asset' : 'assets'} in this collection
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-glow-brand"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload to Collection
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete collection "${collection.name}"? Assets inside will remain intact.`)) {
                deleteMutation.mutate()
              }
            }}
            className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete collection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      {assetsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card overflow-hidden skeleton h-44" />
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
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--bg-secondary)] text-[var(--text-tertiary)] flex items-center justify-center mb-4">
            <Images className="w-8 h-8" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">This collection is empty</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
            Add images to "{collection.name}" to organize your library.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-glow-brand"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Asset
          </button>
        </div>
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultCollectionId={id}
      />
    </div>
  )
}
