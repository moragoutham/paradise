// ── TypeScript type definitions ───────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

// ── Collections ───────────────────────────────────────────────────────────────
export interface Collection {
  id: string
  userId: string
  name: string
  description: string | null
  assetCount: number
  coverImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionPayload {
  name: string
  description?: string
}

export interface UpdateCollectionPayload {
  name?: string
  description?: string
}

// ── Assets ───────────────────────────────────────────────────────────────────
export type ContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

export interface Asset {
  id: string
  userId: string
  collectionId: string | null
  title: string
  description: string | null
  tags: string[]
  s3Key: string
  contentType: ContentType
  fileSize: number
  isFavorite: boolean
  isDeleted: boolean
  deletedAt: string | null
  previewUrl: string | null  // Presigned GET URL — time-limited
  createdAt: string
  updatedAt: string
  collection?: Pick<Collection, 'id' | 'name'>
}

export interface CreateAssetPayload {
  title: string
  description?: string
  tags?: string[]
  collectionId?: string
  contentType: ContentType
  fileName: string
  fileSize: number
}

export interface UpdateAssetPayload {
  title?: string
  description?: string
  tags?: string[]
  collectionId?: string | null
  isFavorite?: boolean
}

export interface UploadUrlResponse {
  assetId: string
  uploadUrl: string   // Presigned PUT URL (short-lived)
  s3Key: string
}

// ── Tags ─────────────────────────────────────────────────────────────────────
export interface Tag {
  id: string
  name: string
}

// ── API ──────────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ── UI State ─────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system'

export type SortDirection = 'asc' | 'desc'

export type AssetSortField = 'createdAt' | 'updatedAt' | 'title' | 'fileSize'

export interface AssetFilters {
  search: string
  collectionId: string | null
  contentType: ContentType | null
  sortField: AssetSortField
  sortDirection: SortDirection
  favoritesOnly: boolean
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalAssets: number
  totalCollections: number
  totalStorageBytes: number
  favoriteCount: number
  recentAssets: Asset[]
  recentCollections: Collection[]
  favoriteAssets: Asset[]
}

// ── File Upload ───────────────────────────────────────────────────────────────
export interface UploadQueueItem {
  id: string
  file: File
  title: string
  collectionId?: string
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  error?: string
  assetId?: string
}
