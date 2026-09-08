import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useUIStore } from '@/stores'
import { useUploadStore } from '@/stores'
import { UploadModal } from '@/components/assets/UploadModal'
import { cn } from '@/lib/utils'

/**
 * Root layout for all authenticated pages.
 * Contains the collapsible sidebar and topbar.
 */
export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()
  const { isUploadPanelOpen, closeUploadPanel } = useUploadStore()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out',
          // On large screens, offset main content by sidebar width
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0',
        )}
      >
        <Topbar />

        {/* Page content — scrollable */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden"
          role="main"
          aria-label="Page content"
        >
          <Outlet />
        </main>
      </div>
      <UploadModal isOpen={isUploadPanelOpen} onClose={closeUploadPanel} />
    </div>
  )
}
