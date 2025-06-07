import axios from 'axios'

// Function to get the correct API URL with HTTPS enforcement
function getApiBaseUrl(): string {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  // Force HTTPS for any Railway URLs - multiple safety checks
  if (apiUrl.includes('railway.app')) {
    // Remove any existing protocol
    apiUrl = apiUrl.replace(/^https?:\/\//, '')
    // Add HTTPS protocol
    apiUrl = 'https://' + apiUrl
  }
  
  return apiUrl
}

// Get the API URL and ensure it's HTTPS in production
const API_BASE_URL = getApiBaseUrl()

// Debug logging - only log the final URL, not process.env in client
if (typeof window !== 'undefined') {
  console.log('🌐 API_BASE_URL:', API_BASE_URL)
  console.log('🔍 Environment check:', {
    hasRailway: API_BASE_URL.includes('railway.app'),
    startsWithHttps: API_BASE_URL.startsWith('https://'),
    originalEnvVar: process.env.NEXT_PUBLIC_API_URL
  })
}

// Create axios instance with dynamic URL checking
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to force HTTPS for Railway URLs and log requests
api.interceptors.request.use((config) => {
  // Always get fresh URL and force HTTPS for Railway URLs
  const freshUrl = getApiBaseUrl()
  if (freshUrl.includes('railway.app')) {
    config.baseURL = freshUrl
  }
  
  // Temporary debugging to catch the HTTP request
  const fullUrl = (config.baseURL || '') + (config.url || '')
  if (typeof window !== 'undefined') {
    console.log('🚀 Making request to:', fullUrl)
    if (fullUrl.includes('railway.app') && fullUrl.startsWith('http://')) {
      console.error('❌ FOUND THE HTTP REQUEST!', {
        originalBaseURL: config.baseURL,
        url: config.url,
        fullUrl: fullUrl,
        freshUrl: freshUrl
      })
    }
  }
  
  return config
})

// Types
export interface Book {
  id: number
  title: string
  author: string
  isbn?: string
  cover_url?: string
  description?: string
  genre?: string
  publication_year?: number
  total_pages?: number
  created_at: string
}

export interface BookSearch {
  title: string
  author: string
  isbn?: string
  cover_url?: string
  description?: string
  publication_year?: number
  open_library_key?: string
}

export interface Reading {
  id: number
  user_id: number
  book_id: number
  status: 'want_to_read' | 'currently_reading' | 'finished'
  rating?: number
  review?: string
  progress_pages: number
  total_pages?: number
  started_at?: string
  finished_at?: string
  created_at: string
  updated_at: string
  book: Book
}

export interface Recommendation {
  id: number
  user_id: number
  book_id: number
  reason: string
  confidence_score: number
  is_dismissed: boolean
  created_at: string
  book: Book
}

export interface ReadingStats {
  total_books: number
  books_this_year: number
  currently_reading: number
  want_to_read: number
  finished: number
  average_rating?: number
  reading_goal: number
  goal_progress: number
}

export interface User {
  id: number
  email: string
  name: string
  reading_goal: number
  created_at: string
}

export interface Dashboard {
  user: User
  stats: ReadingStats
  recent_readings: Reading[]
  current_books: Reading[]
  recent_recommendations: Recommendation[]
}

// API functions
export const bookApi = {
  search: (query: string, limit = 10): Promise<BookSearch[]> =>
    api.get(`/books/search?q=${encodeURIComponent(query)}&limit=${limit}`).then(res => res.data),
  
  add: (book: Partial<Book>): Promise<Book> =>
    api.post('/books', book).then(res => res.data),
  
  getUserBooks: (userId: number): Promise<Book[]> =>
    api.get(`/books/user/${userId}`).then(res => res.data),
  
  getBook: (bookId: number): Promise<Book> =>
    api.get(`/books/${bookId}`).then(res => res.data),
}

export const readingApi = {
  create: (userId: number, reading: { book_id: number; status: string; rating?: number; review?: string }): Promise<Reading> =>
    api.post(`/readings?user_id=${userId}`, reading).then(res => res.data),
  
  update: (readingId: number, updates: Partial<Reading>): Promise<Reading> =>
    api.put(`/readings/${readingId}`, updates).then(res => res.data),
  
  getUserReadings: (userId: number, status?: string): Promise<Reading[]> =>
    api.get(`/readings/user/${userId}${status ? `?status=${status}` : ''}`).then(res => res.data),
  
  getReading: (readingId: number): Promise<Reading> =>
    api.get(`/readings/${readingId}`).then(res => res.data),
  
  delete: (readingId: number): Promise<void> =>
    api.delete(`/readings/${readingId}`).then(res => res.data),
}

export const recommendationApi = {
  get: (userId: number, refresh = false): Promise<Recommendation[]> => {
    if (refresh) {
      // First generate new recommendations, then get them
      return api.post(`/recommendations/generate?user_id=${userId}`)
        .then(() => api.get(`/recommendations/?user_id=${userId}`))
        .then(res => res.data);
    } else {
      return api.get(`/recommendations/?user_id=${userId}`).then(res => res.data);
    }
  },
  
  dismiss: (recommendationId: number): Promise<void> =>
    api.put(`/recommendations/${recommendationId}/dismiss`).then(res => res.data),
}

export const dashboardApi = {
  get: (userId: number): Promise<Dashboard> =>
    api.get(`/dashboard/${userId}`).then(res => res.data),
  
  getStats: (userId: number): Promise<ReadingStats> =>
    api.get(`/dashboard/${userId}/stats`).then(res => res.data),
} 