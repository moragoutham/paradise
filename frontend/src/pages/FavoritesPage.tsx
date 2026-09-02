import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export function FavoritesPage() {
  return (
    <div className="page-container space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Favorites</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Assets you've marked as favorites
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-pink-400" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          No favorites yet
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          Click the heart icon on any asset to add it to your favorites.
        </p>
      </motion.div>
    </div>
  )
}
