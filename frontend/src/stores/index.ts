import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Theme } from '@/types'

// ── Auth Store ────────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'framevault-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoading(false)
        }
      },
    },
  ),
)

// ── UI Store ──────────────────────────────────────────────────────────────────
interface UIStore {
  theme: Theme
  sidebarCollapsed: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: 'framevault-ui',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)

/** Apply theme class to <html> element */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

// ── Upload Store ──────────────────────────────────────────────────────────────
import type { UploadQueueItem } from '@/types'

interface UploadStore {
  queue: UploadQueueItem[]
  isUploadPanelOpen: boolean
  addToQueue: (item: UploadQueueItem) => void
  updateQueueItem: (id: string, updates: Partial<UploadQueueItem>) => void
  removeFromQueue: (id: string) => void
  clearCompleted: () => void
  openUploadPanel: () => void
  closeUploadPanel: () => void
}

export const useUploadStore = create<UploadStore>()((set) => ({
  queue: [],
  isUploadPanelOpen: false,
  addToQueue: (item) => set((state) => ({ queue: [...state.queue, item] })),
  updateQueueItem: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),
  removeFromQueue: (id) =>
    set((state) => ({ queue: state.queue.filter((item) => item.id !== id) })),
  clearCompleted: () =>
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== 'done' && item.status !== 'error'),
    })),
  openUploadPanel: () => set({ isUploadPanelOpen: true }),
  closeUploadPanel: () => set({ isUploadPanelOpen: false }),
}))
