// ── TypeScript type definitions ───────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
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
  access_token: string
}

// ── Collections ───────────────────────────────────────────────────────────────
export interface Collection {
  id: string
  user_id?: string
  userId?: string
  name: string
  description: string | null
  asset_count?: number
  assetCount?: number
  cover_image_url?: string | null
  coverImageUrl?: string | null
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
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
  user_id?: string
  userId?: string
  collection_id?: string | null
  collectionId?: string | null
  title: string
  description: string | null
  tags: string[]
  s3_key?: string
  s3Key?: string
  content_type?: ContentType
  contentType?: ContentType
  file_size?: number
  fileSize?: number
  is_favorite?: boolean
  isFavorite?: boolean
  is_deleted?: boolean
  isDeleted?: boolean
  deleted_at?: string | null
  deletedAt?: string | null
  previewUrl?: string | null
  preview_url?: string | null
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  collection?: { id: string; name: string }
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
  collection_id?: string | null
  isFavorite?: boolean
  is_favorite?: boolean
}

export interface UploadUrlResponse {
  assetId?: string
  asset_id?: string
  uploadUrl?: string
  upload_url?: string
  s3Key?: string
  s3_key?: string
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
  pageSize?: number
  page_size?: number
  totalPages?: number
  total_pages?: number
}

// ── UI State ─────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system'

export type SortDirection = 'asc' | 'desc'

export type AssetSortField = 'created_at' | 'updated_at' | 'title' | 'file_size'

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
  totalAssets?: number
  total_assets?: number
  totalCollections?: number
  total_collections?: number
  totalStorageBytes?: number
  total_storage_bytes?: number
  favoriteCount?: number
  favorite_count?: number
  recentAssets?: Asset[]
  recent_assets?: Asset[]
  recentCollections?: Collection[]
  recent_collections?: Collection[]
  favoriteAssets?: Asset[]
  favorite_assets?: Asset[]
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
