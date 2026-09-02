import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCw, FlipHorizontal, Sliders, Save, X, RefreshCw } from 'lucide-react'
import { assetsApi, uploadToS3 } from '@/services/api'
import { useQueryClient } from '@tanstack/react-query'
import type { Asset } from '@/types'

interface ImageEditorModalProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
}

export function ImageEditorModal({ asset, isOpen, onClose }: ImageEditorModalProps) {
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFlippedH, setIsFlippedH] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset filters to defaults
  const handleResetFilters = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setRotation(0)
    setIsFlippedH(false)
  }

  // Draw filtered image on canvas
  useEffect(() => {
    if (!isOpen || !asset?.previewUrl) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = asset.previewUrl

    img.onload = () => {
      const isRotated90 = rotation % 180 !== 0
      canvas.width = isRotated90 ? img.height : img.width
      canvas.height = isRotated90 ? img.width : img.height

      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Move to center
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      if (isFlippedH) ctx.scale(-1, 1)

      // Apply CSS-like filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`

      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()
    }
  }, [isOpen, asset, brightness, contrast, saturation, rotation, isFlippedH])

  const handleSave = async () => {
    if (!asset || !canvasRef.current) return
    setIsSaving(true)
    setSaveError(null)

    try {
      // 1. Export canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.9)
      })
      if (!blob) throw new Error('Failed to generate image blob')

      const file = new File([blob], `edited-${asset.title}.jpg`, { type: 'image/jpeg' })

      // 2. Request replacement presigned URL
      const replaceRes = await assetsApi.requestReplaceUrl(asset.id, {
        contentType: 'image/jpeg',
        fileSize: file.size,
      })
      const { uploadUrl } = replaceRes.data

      // 3. Upload to S3/storage directly
      await uploadToS3(uploadUrl, file)

      // 4. Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset', asset.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      onClose()
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save edited image')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !asset) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl card p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-500" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Edit Asset: {asset.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Editor Body */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 flex-1 overflow-hidden min-h-0">
            {/* Canvas Preview */}
            <div className="md:col-span-2 flex items-center justify-center bg-black/40 rounded-2xl overflow-hidden p-4 relative">
              <canvas
                ref={canvasRef}
                className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Controls */}
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Transform</span>
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-2xs text-[var(--text-tertiary)] hover:text-brand-500 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reset all
                </button>
              </div>

              {/* Transform buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] hover:border-[var(--border-default)]"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlippedH((f) => !f)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] hover:border-[var(--border-default)]"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                    <span>Brightness</span>
                    <span className="tabular-nums">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                    <span>Contrast</span>
                    <span className="tabular-nums">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                    <span>Saturation</span>
                    <span className="tabular-nums">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>
              </div>

              {saveError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                  {saveError}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)] mt-4">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-glow-brand disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving & Replacing S3 Object…' : 'Save & Replace'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
