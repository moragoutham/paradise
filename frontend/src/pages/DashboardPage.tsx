import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Images,
  FolderOpen,
  HardDrive,
  Heart,
  Upload,
  Clock,
  Sparkles,
  ArrowRight,
  Sliders,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { assetsApi } from '@/services/api'
import { useAuthStore } from '@/stores'
import { UploadModal } from '@/components/assets/UploadModal'
import { CreateCollectionModal } from '@/components/collections/CreateCollectionModal'
import { ImageEditorModal } from '@/components/editor/ImageEditorModal'
import { cn, formatBytes, formatRelativeTime } from '@/lib/utils'
import type { Asset } from '@/types'

export function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.email?.split('@')[0] ?? 'there'
  
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isCreateColOpen, setIsCreateColOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await assetsApi.list({ sort_by: 'created_at', page_size: 1 })
      // Or call stats summary endpoint
      const statsRes = await fetch('/api/v1/assets/stats/summary', {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      })
      if (!statsRes.ok) throw new Error('Failed to fetch stats')
      return await statsRes.json()
    },
  })

  const statCards = [
    {
      label: 'Total Assets',
      value: stats?.total_assets ?? 0,
      icon: Images,
      iconBg: 'bg-brand-500/10',
      iconColor: 'text-brand-500',
    },
    {
      label: 'Collections',
      value: stats?.total_collections ?? 0,
      icon: FolderOpen,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Storage Used',
      value: formatBytes(stats?.total_storage_bytes ?? 0),
      icon: HardDrive,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500',
    },
    {
      label: 'Favorites',
      value: stats?.favorite_count ?? 0,
      icon: Heart,
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-500',
    },
  ]

  const recentAssets: Asset[] = stats?.recent_assets || []
  const favoriteAssets: Asset[] = stats?.favorite_assets || []

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Amazon S3 Cloud Asset Management Workspace
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-all duration-150 hover:scale-[1.02] shadow-glow-brand"
        >
          <Upload className="w-4 h-4" />
          Upload Asset
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="stat-card"
            >
              <div className={cn('icon-container w-11 h-11', stat.iconBg)}>
                <Icon className={cn('w-5 h-5', stat.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{stat.value}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Assets */}
        <div className="xl:col-span-2 card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
              <h2 className="section-heading text-base">Recently Uploaded</h2>
            </div>
            <Link to="/assets" className="text-xs text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-6 flex-1">
            {recentAssets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {recentAssets.map((asset) => (
                  <div key={asset.id} className="group relative rounded-xl overflow-hidden aspect-square bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    {asset.previewUrl ? (
                      <img src={asset.previewUrl} alt={asset.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                        <Images className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 justify-between">
                      <p className="text-2xs text-white font-medium truncate">{asset.title}</p>
                      <button
                        onClick={() => setEditingAsset(asset)}
                        className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"
                        title="Edit"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
                  <Images className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">No assets uploaded yet</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-4">
                  Upload images directly to S3 with presigned URLs to get started.
                </p>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-glow-brand"
                >
                  Upload First Asset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Quick Actions & Favorites */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Quick Actions</h2>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-all text-left group"
            >
              <div className="icon-container w-9 h-9 bg-brand-500 text-white rounded-xl">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-brand-500">Upload to S3</p>
                <p className="text-2xs text-[var(--text-tertiary)]">Presigned direct upload</p>
              </div>
            </button>

            <button
              onClick={() => setIsCreateColOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-all text-left group"
            >
              <div className="icon-container w-9 h-9 bg-violet-500 text-white rounded-xl">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-violet-500">New Collection</p>
                <p className="text-2xs text-[var(--text-tertiary)]">Create asset folder</p>
              </div>
            </button>
          </div>

          {/* Favorites */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Favorite Assets</h2>
              </div>
              <Link to="/favorites" className="text-2xs text-brand-500 hover:text-brand-400">View</Link>
            </div>

            {favoriteAssets.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {favoriteAssets.map((f) => (
                  <div key={f.id} className="relative rounded-lg overflow-hidden aspect-video bg-[var(--bg-secondary)]">
                    {f.previewUrl && <img src={f.previewUrl} alt={f.title} className="w-full h-full object-cover" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">No favorites marked yet</p>
            )}
          </div>
        </div>
      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <CreateCollectionModal isOpen={isCreateColOpen} onClose={() => setIsCreateColOpen(false)} />
      <ImageEditorModal asset={editingAsset} isOpen={!!editingAsset} onClose={() => setEditingAsset(null)} />
    </div>
  )
}
