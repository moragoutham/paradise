import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderPlus, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionsApi } from '@/services/api'

interface CreateCollectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCollectionModal({ isOpen, onClose }: CreateCollectionModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: async () => {
      return await collectionsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      handleClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to create collection')
    },
  })

  const handleClose = () => {
    setName('')
    setDescription('')
    setError(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-md card p-6 shadow-2xl relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="icon-container w-9 h-9 bg-violet-500/10 text-violet-500 rounded-xl">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">New Collection</h2>
                <p className="text-xs text-[var(--text-secondary)]">Group and organize your cloud assets</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Collection Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. AWS Architecture, Travel, Logos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Description (optional)</label>
              <textarea
                rows={3}
                placeholder="Describe what this collection contains..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || createMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-glow-brand disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Collection'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
