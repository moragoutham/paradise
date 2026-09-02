import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle, AlertCircle, FileImage, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionsApi, assetsApi, uploadToS3 } from '@/services/api'
import { cn, formatBytes, isAcceptedImageType, isWithinSizeLimit } from '@/lib/utils'
import type { Collection } from '@/types'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  defaultCollectionId?: string
}

export function UploadModal({ isOpen, onClose, defaultCollectionId }: UploadModalProps) {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [collectionId, setCollectionId] = useState(defaultCollectionId || '')
  const [tagsInput, setTagsInput] = useState('')
  
  const [uploadStage, setUploadStage] = useState<'idle' | 'presigned' | 'uploading' | 'confirming' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch user collections for dropdown
  const { data: collections } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await collectionsApi.list()
      return res.data
    },
    enabled: isOpen,
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const file = acceptedFiles[0]

    if (!isAcceptedImageType(file.type)) {
      setErrorMessage('Unsupported file format. Please upload JPEG, PNG, WebP, or GIF.')
      return
    }

    if (!isWithinSizeLimit(file.size)) {
      setErrorMessage('File size exceeds 25 MB limit.')
      return
    }

    setErrorMessage(null)
    setSelectedFile(file)
    setTitle(file.name.replace(/\.[^/.]+$/, ''))
    setPreviewUrl(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    disabled: uploadStage !== 'idle',
  })

  const handleReset = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setTitle('')
    setDescription('')
    setCollectionId(defaultCollectionId || '')
    setTagsInput('')
    setUploadStage('idle')
    setProgress(0)
    setErrorMessage(null)
  }

  const handleClose = () => {
    if (uploadStage === 'uploading') return
    handleReset()
    onClose()
  }

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title.trim()) return

    setErrorMessage(null)
    try {
      // Stage 1: Request Presigned URL from Backend API
      setUploadStage('presigned')
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const presignedRes = await assetsApi.requestUploadUrl({
        title: title.trim(),
        description: description.trim() || undefined,
        contentType: selectedFile.type,
        fileSize: selectedFile.size,
        fileName: selectedFile.name,
        collectionId: collectionId || undefined,
        tags,
      })

      const { assetId, uploadUrl } = presignedRes.data

      // Stage 2: Direct browser-to-S3 / storage upload using presigned PUT URL
      setUploadStage('uploading')
      await uploadToS3(uploadUrl, selectedFile, (pct) => {
        setProgress(pct)
      })

      // Stage 3: Confirm upload with Backend API
      setUploadStage('confirming')
      await assetsApi.confirmUpload(assetId)

      // Stage 4: Success
      setUploadStage('done')
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      setTimeout(() => {
        handleClose()
      }, 1200)
    } catch (err: any) {
      setUploadStage('error')
      setErrorMessage(err.response?.data?.detail || err.message || 'Upload failed. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-lg card p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="icon-container w-9 h-9 bg-brand-500/10 text-brand-500 rounded-xl">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Upload Asset</h2>
                <p className="text-xs text-[var(--text-secondary)]">Secure S3 direct upload via presigned URL</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={uploadStage === 'uploading'}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleStartUpload} className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150',
                  isDragActive
                    ? 'border-brand-500 bg-brand-500/5 scale-[1.01]'
                    : 'border-[var(--border-default)] hover:border-brand-500/50 hover:bg-[var(--bg-secondary)]'
                )}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-3">
                  <FileImage className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {isDragActive ? 'Drop the image here…' : 'Click to select or drag & drop'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  JPEG, PNG, WebP, GIF (up to 25 MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File preview card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-[var(--border-subtle)]"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{selectedFile.name}</p>
                    <p className="text-2xs text-[var(--text-tertiary)] mt-0.5">{formatBytes(selectedFile.size)} · {selectedFile.type}</p>
                  </div>
                  {uploadStage === 'idle' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="p-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={uploadStage !== 'idle'}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Collection</label>
                    <select
                      value={collectionId}
                      onChange={(e) => setCollectionId(e.target.value)}
                      disabled={uploadStage !== 'idle'}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand-500/40"
                    >
                      <option value="">No Collection</option>
                      {collections?.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. devops, cloud, design"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      disabled={uploadStage !== 'idle'}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:ring-2 focus:ring-brand-500/40"
                    />
                  </div>
                </div>

                {/* Architecture Step Indicator during Upload */}
                {uploadStage !== 'idle' && (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {uploadStage === 'presigned' && '1/3 Generating S3 Presigned URL…'}
                        {uploadStage === 'uploading' && `2/3 Uploading to S3 (${progress}%)…`}
                        {uploadStage === 'confirming' && '3/3 Confirming metadata with database…'}
                        {uploadStage === 'done' && 'Upload Complete!'}
                        {uploadStage === 'error' && 'Upload failed'}
                      </span>
                      {uploadStage === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="w-full bg-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300 rounded-full',
                          uploadStage === 'done' ? 'bg-emerald-500 w-full' : 'bg-brand-500'
                        )}
                        style={{ width: uploadStage === 'done' ? '100%' : `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleClose}
                disabled={uploadStage === 'uploading'}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || !title.trim() || uploadStage !== 'idle'}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-glow-brand disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload to Cloud
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
