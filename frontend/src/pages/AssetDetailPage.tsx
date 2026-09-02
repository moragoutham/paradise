import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Trash2, Heart, Sliders, Edit2, Check, Tag, FolderOpen, Calendar, HardDrive, FileType } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi, collectionsApi } from '@/services/api'
import { ImageEditorModal } from '@/components/editor/ImageEditorModal'
import { cn, formatBytes, formatDate } from '@/lib/utils'
import type { Asset, Collection } from '@/types'

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Fetch Asset details
  const { data: asset, isLoading, isError } = useQuery<Asset>({
    queryKey: ['asset', id],
    queryFn: async () => {
      const res = await assetsApi.get(id!)
      const a = res.data
      setTitle(a.title)
      setDescription(a.description || '')
      setCollectionId(a.collection_id || '')
      setTagsInput(a.tags ? a.tags.join(', ') : '')
      return a
    },
    enabled: !!id,
  })

  // Fetch Collections for moving asset
  const { data: collections } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await collectionsApi.list()
      return res.data
    },
  })

  // Update metadata mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      return await assetsApi.update(id!, {
        title: title.trim(),
        description: description.trim() || undefined,
        collectionId: collectionId || null,
        tags,
      })
    },
    onSuccess: () => {
      setIsEditingMeta(false)
      queryClient.invalidateQueries({ queryKey: ['asset', id] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  // Favorite toggle
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!asset) return
      return await assetsApi.update(id!, { is_favorite: !asset.is_favorite })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await assetsApi.delete(id!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate('/assets')
    },
  })

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isError || !asset) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Asset not found</h2>
        <Link to="/assets" className="text-xs text-brand-500 mt-2 inline-block">Back to assets</Link>
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      {/* Back button */}
      <Link
        to="/assets"
        className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assets
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Large Preview */}
        <div className="xl:col-span-2 card overflow-hidden flex flex-col">
          <div className="bg-black/60 flex items-center justify-center p-4 min-h-[450px] relative">
            {asset.previewUrl ? (
              <img
                src={asset.previewUrl}
                alt={asset.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <p className="text-xs text-[var(--text-tertiary)]">Preview unavailable</p>
            )}

            {/* Float Action: Edit Filter / Transform */}
            <button
              onClick={() => setIsEditorOpen(true)}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs backdrop-blur-md transition-all shadow-lg"
            >
              <Sliders className="w-3.5 h-3.5" />
              Edit Image
            </button>
          </div>
        </div>

        {/* Details & Actions Sidebar */}
        <div className="space-y-4">
          {/* Main Action Bar */}
          <div className="card p-4 flex items-center gap-2">
            {asset.previewUrl && (
              <a
                href={asset.previewUrl}
                download={asset.title}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-glow-brand transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            )}
            <button
              onClick={() => favoriteMutation.mutate()}
              className={cn(
                'p-2 rounded-xl border border-[var(--border-subtle)] transition-colors',
                asset.is_favorite ? 'text-pink-500 bg-pink-500/10' : 'text-[var(--text-secondary)] hover:text-pink-500'
              )}
              title={asset.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
            >
              <Heart className={cn('w-4 h-4', asset.is_favorite && 'fill-current')} />
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Metadata Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Asset Information</h2>
              <button
                onClick={() => setIsEditingMeta(!isEditingMeta)}
                className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1 font-medium"
              >
                {isEditingMeta ? 'Cancel' : <><Edit2 className="w-3 h-3" /> Edit</>}
              </button>
            </div>

            {isEditingMeta ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate()
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Collection</label>
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                  >
                    <option value="">No Collection</option>
                    {collections?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium shadow-glow-brand"
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--text-tertiary)] block">Title</span>
                  <span className="font-semibold text-[var(--text-primary)] mt-0.5 block">{asset.title}</span>
                </div>

                {asset.description && (
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Description</span>
                    <p className="text-[var(--text-secondary)] mt-0.5">{asset.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[var(--text-tertiary)] block">File Size</span>
                    <span className="font-medium text-[var(--text-primary)] mt-0.5 block">{formatBytes(asset.file_size)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Format</span>
                    <span className="font-medium text-[var(--text-primary)] mt-0.5 block">{asset.content_type}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Uploaded</span>
                    <span className="font-medium text-[var(--text-primary)] mt-0.5 block">{formatDate(asset.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Collection</span>
                    <span className="font-medium text-[var(--text-primary)] mt-0.5 block">
                      {asset.collection ? asset.collection.name : 'None'}
                    </span>
                  </div>
                </div>

                {/* S3 Key */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)] block">S3 Object Key</span>
                  <span className="font-mono text-2xs text-[var(--text-secondary)] mt-0.5 block break-all">
                    {asset.s3_key}
                  </span>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[var(--text-tertiary)] block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.map((t) => (
                        <span key={t} className="badge badge-brand text-2xs">#{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageEditorModal asset={asset} isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
    </div>
  )
}
