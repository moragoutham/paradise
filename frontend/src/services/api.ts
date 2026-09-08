import axios from 'axios'
import { useAuthStore } from '@/stores'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies (refresh token)
})

// ── Request interceptor: attach access token ──────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle 401 → refresh → retry ───────────────────────
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const { accessToken, user } = response.data
        useAuthStore.getState().setUser(user, accessToken)

        // Resolve queued requests
        refreshQueue.forEach(({ resolve }) => resolve(accessToken))
        refreshQueue = []

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch {
        // Refresh failed — log out
        refreshQueue.forEach(({ reject }) => reject(error))
        refreshQueue = []
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    apiClient.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get('/auth/me'),

  refresh: () => apiClient.post('/auth/refresh'),
}

// ── Collections API ───────────────────────────────────────────────────────────
export const collectionsApi = {
  list: () => apiClient.get('/collections'),
  get: (id: string) => apiClient.get(`/collections/${id}`),
  create: (data: { name: string; description?: string }) =>
    apiClient.post('/collections', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch(`/collections/${id}`, data),
  delete: (id: string) => apiClient.delete(`/collections/${id}`),
}

// ── Assets API ────────────────────────────────────────────────────────────────
export const assetsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/assets', { params }),
  summary: () => apiClient.get('/assets/stats/summary'),
  get: (id: string) => apiClient.get(`/assets/${id}`),
  requestUploadUrl: (data: {
    title: string
    contentType: string
    fileSize: number
    fileName: string
    collectionId?: string
    description?: string
    tags?: string[]
  }) => apiClient.post('/assets/upload-url', {
    title: data.title,
    description: data.description,
    content_type: data.contentType,
    file_size: data.fileSize,
    file_name: data.fileName,
    collection_id: data.collectionId,
    tags: data.tags,
  }),
  confirmUpload: (id: string) => apiClient.patch(`/assets/${id}/confirm-upload`),
  update: (
    id: string,
    data: any,
  ) => apiClient.patch(`/assets/${id}`, data),
  delete: (id: string) => apiClient.delete(`/assets/${id}`),
  restore: (id: string) => apiClient.patch(`/assets/${id}/restore`),
  permanentDelete: (id: string) => apiClient.delete(`/assets/${id}/permanent`),
  requestReplaceUrl: (id: string, data: { contentType: string; fileSize: number }) =>
    apiClient.post(`/assets/${id}/replace-url`, data),
  favorites: () => apiClient.get('/assets', { params: { favoritesOnly: true } }),
  trash: () => apiClient.get('/assets', { params: { deleted: true } }),
}

// ── Direct S3 upload ──────────────────────────────────────────────────────────
/**
 * Upload a file directly to S3 using a presigned PUT URL.
 * The browser uploads directly to S3 — no backend bandwidth used.
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`S3 upload failed: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('S3 upload network error')))
    xhr.addEventListener('abort', () => reject(new Error('S3 upload aborted')))

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
