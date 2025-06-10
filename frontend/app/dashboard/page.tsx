'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import { dashboardApi, Dashboard, bookApi, readingApi, recommendationApi, Recommendation } from '@/lib/api'
import { BookOpen, Target, TrendingUp, Star, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useBookModal } from '@/contexts/BookModalContext'
import { 
  Button, 
  Card, 
  Badge, 
  LoadingSpinner,
  BookCard,
  StatCard,
  ProgressCard,
  RecommendationCard
} from '@/components/ui'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { openBookModal } = useBookModal()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  const { data: dashboard, isLoading, error } = useQuery<Dashboard>(
    ['dashboard', session?.user?.id],
    () => dashboardApi.get(),
    {
      enabled: !!session?.user?.id && !!session?.accessToken,
      refetchOnWindowFocus: false,
    }
  )

  const dismissMutation = useMutation(
    (recommendationId: number) => recommendationApi.dismiss(recommendationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['recommendations'])
        toast.success('Recommendation dismissed')
      },
      onError: () => {
        toast.error('Failed to dismiss recommendation')
      },
    }
  )

  const addToLibraryMutation = useMutation(
    async (recommendation: Recommendation) => {
      const userId = parseInt(session?.user?.id || '1')
      
      const book = await bookApi.add({
        title: recommendation.book.title,
        author: recommendation.book.author,
        isbn: recommendation.book.isbn,
        cover_url: recommendation.book.cover_url,
        description: recommendation.book.description || recommendation.reason,
        genre: recommendation.book.genre,
        publication_year: recommendation.book.publication_year,
        total_pages: recommendation.book.total_pages,
      })
      
      const reading = await readingApi.create({
        book_id: book.id,
        status: 'want_to_read'
      })
      
      await recommendationApi.dismiss(recommendation.id)
      
      return { book, reading, recommendationId: recommendation.id }
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['recommendations'])
        queryClient.invalidateQueries(['readings'])
        
        toast.success('Book added to your library!')
      },
      onError: (error: any) => {
        console.error('Add to library error:', error)
        if (error.response?.status === 409) {
          toast.error('Book is already in your library')
        } else {
          toast.error('Failed to add book to library')
        }
      },
    }
  )

  const handleDismiss = (recommendationId: number) => {
    dismissMutation.mutate(recommendationId)
  }

  const handleAddToLibrary = (recommendation: Recommendation) => {
    addToLibraryMutation.mutate(recommendation)
  }

  if (status === 'loading' || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading your dashboard..." />
        </div>
      </Layout>
    )
  }

  if (error || !dashboard) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold font-serif tracking-tight mb-4">Welcome to Bookshelf AI!</h2>
            <p className="text-sm text-gray-600 mb-6">Start by adding some books to your library to see your personalized dashboard.</p>
            <Link href="/search" className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
              <span>Search for Books</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const { user, stats, recent_readings, current_books, recent_recommendations } = dashboard

  return (
    <Layout>
      <div>
        {/* Header - Minimalistic style matching main header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold font-serif tracking-tight mb-2">Welcome back, {user.name}!</h1>
          <p className="text-sm text-gray-600">Here's your reading progress and personalized recommendations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Books Read"
            value={stats.total_books}
          />
          
          <StatCard
            icon={Target}
            label="This Year"
            value={stats.books_this_year}
            subtitle={`Goal: ${stats.reading_goal}`}
          />
          
          <StatCard
            icon={Clock}
            label="Currently Reading"
            value={stats.currently_reading}
          />
          
          <StatCard
            icon={Star}
            label="Avg Rating"
            value={stats.average_rating ? `${stats.average_rating}★` : 'N/A'}
          />
        </div>

        {/* Reading Goal Progress */}
        <ProgressCard
          title="Reading Goal Progress"
          progress={stats.goal_progress}
          description={`${stats.books_this_year} of ${stats.reading_goal} books read this year`}
          className="mb-8"
        />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Currently Reading */}
          <div className="border border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-serif">Currently Reading</h3>
              <Link href="/books" className="text-sm text-gray-600 hover:text-gray-900 font-mono uppercase tracking-wide">
                View All
              </Link>
            </div>
            {current_books.length > 0 ? (
              <div className="space-y-4">
                {current_books.slice(0, 3).map((reading) => (
                  <BookCard
                    key={reading.id}
                    book={reading.book}
                    reading={{
                      status: reading.status,
                      progress_pages: reading.progress_pages,
                      total_pages: reading.total_pages
                    }}
                        onClick={() => openBookModal(null, reading.book.id)}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-4">No books currently being read</p>
                <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900 underline">
                  Find a book to read
                </Link>
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="border border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-serif">AI Recommendations</h3>
              <Link href="/recommendations" className="text-sm text-gray-600 hover:text-gray-900 font-mono uppercase tracking-wide">
                View All
              </Link>
            </div>
            {recent_recommendations.length > 0 ? (
              <div className="space-y-4">
                {recent_recommendations.slice(0, 2).map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onBookClick={() => openBookModal(null, rec.book.id)}
                    onAddToLibrary={() => handleAddToLibrary(rec)}
                    onDismiss={() => handleDismiss(rec.id)}
                    isAddingToLibrary={addToLibraryMutation.isLoading}
                    isDismissing={dismissMutation.isLoading}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-2">No recommendations yet</p>
                <p className="text-xs text-gray-400 mb-4">
                  Add and rate some books to get AI recommendations
                </p>
                <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900 underline">
                  Add books to your library
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-gray-200 p-4 rounded mt-8">
          <h3 className="text-lg font-semibold font-serif mb-4">Recent Activity</h3>
          {recent_readings.length > 0 ? (
            <div className="space-y-3">
              {recent_readings.slice(0, 5).map((reading) => (
                <div key={reading.id} className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      {reading.status === 'finished' ? (
                        <CheckCircle className="h-4 w-4 text-gray-600" />
                      ) : reading.status === 'currently_reading' ? (
                        <Clock className="h-4 w-4 text-gray-600" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <button
                        onClick={() => openBookModal(null, reading.book.id)}
                        className="font-serif font-medium hover:underline transition-colors"
                      >
                        {reading.book.title}
                      </button> by {reading.book.author}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reading.status === 'finished' ? 'Finished reading' : 
                       reading.status === 'currently_reading' ? 'Started reading' : 
                       'Added to want to read'}
                    </p>
                  </div>
                  {reading.rating && (
                    <Badge variant="rating" size="sm" color="gray" rating={reading.rating} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 