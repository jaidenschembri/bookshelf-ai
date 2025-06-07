import axios from 'axios'
import { getSession } from 'next-auth/react'

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

// Add request interceptor to force HTTPS for Railway URLs, log requests, and add auth headers
api.interceptors.request.use(async (config) => {
  // Always get fresh URL and force HTTPS for Railway URLs
  const freshUrl = getApiBaseUrl()
  if (freshUrl.includes('railway.app')) {
    config.baseURL = freshUrl
  }
  
  // Add authentication header if user is logged in
  if (typeof window !== 'undefined') {
    try {
      const session = await getSession()
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
      } else if (session?.user) {
        // User is logged in but doesn't have JWT token - they need to sign in again
        console.warn('User session exists but no JWT token found. User needs to sign in again.')
      }
    } catch (error) {
      console.warn('Failed to get session for API request:', error)
    }
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

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      // Authentication error - the user needs to sign in again
      if (typeof window !== 'undefined') {
        console.warn('Authentication error detected. User may need to sign in again.')
        // You could redirect to sign in page or show a message here
      }
    }
    return Promise.reject(error)
  }
)

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
  is_review_public?: boolean
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
  username?: string
  bio?: string
  location?: string
  profile_picture_url?: string
  reading_goal: number
  is_private?: boolean
  created_at: string
}

export interface UserPublicProfile extends User {
  follower_count: number
  following_count: number
  is_following: boolean
}

export interface UserFollow {
  id: number
  follower_id: number
  following_id: number
  created_at: string
  follower: User
  following: User
}

export interface ReviewComment {
  id: number
  reading_id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
  user: User
}

export interface ReviewLike {
  id: number
  reading_id: number
  user_id: number
  created_at: string
  user: User
}

export interface UserActivity {
  id: number
  user_id: number
  activity_type: string
  activity_data: any
  created_at: string
  user: User
}

export interface SocialFeed {
  activities: UserActivity[]
  recent_reviews: Reading[]
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
    api.post('/books/', book).then(res => res.data),
  
  getUserBooks: (userId: number): Promise<Book[]> =>
    api.get(`/books/user/${userId}`).then(res => res.data),
  
  getBook: (bookId: number): Promise<Book> =>
    api.get(`/books/${bookId}`).then(res => res.data),
}

export const readingApi = {
  create: (reading: { book_id: number; status: string; rating?: number; review?: string }): Promise<Reading> =>
    api.post('/readings/', reading).then(res => res.data),
  
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

export const socialApi = {
  // User Following
  followUser: (userId: number): Promise<UserFollow> =>
    api.post('/social/follow', { following_id: userId }).then(res => res.data),
  
  unfollowUser: (userId: number): Promise<void> =>
    api.delete(`/social/unfollow/${userId}`).then(res => res.data),
  
  getFollowers: (userId: number): Promise<UserPublicProfile[]> =>
    api.get(`/social/followers/${userId}`).then(res => res.data),
  
  getFollowing: (userId: number): Promise<UserPublicProfile[]> =>
    api.get(`/social/following/${userId}`).then(res => res.data),
  
  // Review Interactions
  likeReview: (readingId: number): Promise<ReviewLike> =>
    api.post(`/social/reviews/${readingId}/like`).then(res => res.data),
  
  unlikeReview: (readingId: number): Promise<void> =>
    api.delete(`/social/reviews/${readingId}/unlike`).then(res => res.data),
  
  // Review Comments
  addComment: (readingId: number, content: string): Promise<ReviewComment> =>
    api.post(`/social/reviews/${readingId}/comments`, { content }).then(res => res.data),
  
  getComments: (readingId: number): Promise<ReviewComment[]> =>
    api.get(`/social/reviews/${readingId}/comments`).then(res => res.data),
  
  updateComment: (commentId: number, content: string): Promise<ReviewComment> =>
    api.put(`/social/reviews/comments/${commentId}`, { content }).then(res => res.data),
  
  deleteComment: (commentId: number): Promise<void> =>
    api.delete(`/social/reviews/comments/${commentId}`).then(res => res.data),
  
  // Social Feed
  getFeed: (limit = 20): Promise<SocialFeed> =>
    api.get(`/social/feed?limit=${limit}`).then(res => res.data),
}

export const userApi = {
  getProfile: (userId: number): Promise<UserPublicProfile> =>
    api.get(`/users/${userId}`).then(res => res.data),
  
  searchUsers: (query: string): Promise<UserPublicProfile[]> =>
    api.get(`/users/search?q=${encodeURIComponent(query)}`).then(res => res.data),
  
  updateProfile: (updates: Partial<User>): Promise<User> =>
    api.put('/users/me', updates).then(res => res.data),
  
  getCurrentUser: (): Promise<User> =>
    api.get('/auth/me').then(res => res.data),
} 