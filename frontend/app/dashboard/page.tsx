'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { dashboardApi, Dashboard, bookApi, readingApi, recommendationApi, Recommendation } from '@/lib/api'
import { BookOpen, Target, Clock, CheckCircle, ArrowRight } from 'lucide-react'
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
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { useErrorHandler, errorRecovery } from '@/lib/error-handling'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { openBookModal } = useBookModal()
  const queryClient = useQueryClient()
  const handleError = useErrorHandler()
  const [loadingStates, setLoadingStates] = useState<{
    adding: Set<number>
    dismissing: Set<number>
  }>({
    adding: new Set(),
    dismissing: new Set()
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  const { data: dashboard, isLoading, error, refetch } = useQuery<Dashboard>(
    ['dashboard', session?.user?.id],
    () => dashboardApi.get(),
    {
      enabled: !!session?.user?.id && !!session?.accessToken,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Custom retry logic - don't retry auth errors
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            return false
          }
        }
        return failureCount < 3
      },
      onError: (error) => {
        handleError(error, { 
          context: 'dashboard_fetch',
          userId: session?.user?.id 
        })
      }
    }
  )

  const dismissMutation = useMutation(
    (recommendationId: number) => recommendationApi.dismiss(recommendationId),
    {
      onMutate: (recommendationId) => {
        setLoadingStates(prev => {
          const newDismissing = new Set(prev.dismissing)
          newDismissing.add(recommendationId)
          return { ...prev, dismissing: newDismissing }
        })
      },
      onSuccess: (_, recommendationId) => {
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['recommendations'])
        toast.success('Recommendation dismissed')
        setLoadingStates(prev => {
          const newDismissing = new Set(prev.dismissing)
          newDismissing.delete(recommendationId)
          return { ...prev, dismissing: newDismissing }
        })
      },
      onError: (error, recommendationId) => {
        handleError(error, { 
          context: 'dismiss_recommendation',
          recommendationId 
        })
        setLoadingStates(prev => {
          const newDismissing = new Set(prev.dismissing)
          newDismissing.delete(recommendationId)
          return { ...prev, dismissing: newDismissing }
        })
      },
    }
  )

  const addToLibraryMutation = useMutation(
    async (recommendation: Recommendation) => {
      const userId = parseInt(session?.user?.id || '1')
      
      // Use error recovery with retry logic
      const result = await errorRecovery.retry(async () => {
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
      }, 2) // Retry up to 2 times
      
      if (!result) {
        throw new Error('Failed to add book after retries')
      }
      
      return result
    },
    {
      onMutate: (recommendation) => {
        setLoadingStates(prev => {
          const newAdding = new Set(prev.adding)
          newAdding.add(recommendation.id)
          return { ...prev, adding: newAdding }
        })
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['recommendations'])
        queryClient.invalidateQueries(['readings'])
        
        toast.success('Book added to your library!')
        setLoadingStates(prev => {
          const newAdding = new Set(prev.adding)
          newAdding.delete(data.recommendationId)
          return { ...prev, adding: newAdding }
        })
      },
      onError: (error: any, recommendation) => {
        handleError(error, { 
          context: 'add_to_library',
          recommendationId: recommendation.id,
          bookTitle: recommendation.book.title 
        })
        setLoadingStates(prev => {
          const newAdding = new Set(prev.adding)
          newAdding.delete(recommendation.id)
          return { ...prev, adding: newAdding }
        })
      },
    }
  )

  const handleDismiss = (recommendationId: number) => {
    dismissMutation.mutate(recommendationId)
  }

  const handleAddToLibrary = (recommendation: Recommendation) => {
    addToLibraryMutation.mutate(recommendation)
  }

  const handleRetryDashboard = () => {
    refetch()
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
            <h2 className="text-2xl font-semibold font-serif tracking-tight mb-4">
              {error ? 'Unable to load dashboard' : 'Welcome to Bookshelf AI!'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {error 
                ? 'We encountered an issue loading your dashboard. Please try again.' 
                : 'Start by adding some books to your library to see your personalized dashboard.'
              }
            </p>
                         <div className="flex flex-col sm:flex-row gap-3 justify-center">
               {error ? (
                 <Button
                   onClick={handleRetryDashboard}
                   variant="primary"
                   loading={isLoading}
                 >
                   Try Again
                 </Button>
               ) : null}
              <Link href="/search" className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
                <span>Search for Books</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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

        {/* Stats Grid - Wrapped in error boundary */}
        <ComponentErrorBoundary componentName="Stats Grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={BookOpen}
              label="Books Read"
              value={stats.total_books}
            />
            
            <StatCard
              icon={Target}
              label="Reading Goal"
              value={`${stats.goal_progress}%`}
              subtitle={`${stats.books_this_year} of ${stats.reading_goal} books`}
            />
            
            <StatCard
              icon={Clock}
              label="Currently Reading"
              value={stats.currently_reading}
            />
            
            <StatCard
              icon={CheckCircle}
              label="Want to Read"
              value={stats.want_to_read}
            />
          </div>
        </ComponentErrorBoundary>

        {/* Reading Progress */}
        {stats.reading_goal > 0 && (
          <ComponentErrorBoundary componentName="Reading Progress">
            <div className="mb-8">
                             <ProgressCard
                 title="Reading Goal Progress"
                 progress={stats.goal_progress}
                 description={`${stats.books_this_year} of ${stats.reading_goal} books read this year`}
               />
            </div>
          </ComponentErrorBoundary>
        )}

        {/* Current Books */}
        {current_books && current_books.length > 0 && (
          <ComponentErrorBoundary componentName="Current Books">
            <div className="mb-8">
              <h2 className="text-lg font-semibold font-serif tracking-tight mb-4">Currently Reading</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {current_books.map((reading) => (
                   <BookCard
                     key={reading.id}
                     book={reading.book}
                     reading={reading}
                     onClick={() => openBookModal(reading.book, reading.book.id)}
                     variant="default"
                     showProgress={true}
                   />
                 ))}
              </div>
            </div>
          </ComponentErrorBoundary>
        )}

        {/* AI Recommendations */}
        {recent_recommendations && recent_recommendations.length > 0 && (
          <ComponentErrorBoundary componentName="AI Recommendations">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-serif tracking-tight">AI Recommendations</h2>
                <Link 
                  href="/recommendations" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recent_recommendations.slice(0, 4).map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onBookClick={() => openBookModal(null, recommendation.book.id)}
                    onAddToLibrary={() => handleAddToLibrary(recommendation)}
                    onDismiss={() => handleDismiss(recommendation.id)}
                    isAddingToLibrary={loadingStates.adding.has(recommendation.id)}
                    isDismissing={loadingStates.dismissing.has(recommendation.id)}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </ComponentErrorBoundary>
        )}

        {/* Recent Activity */}
        {recent_readings && recent_readings.length > 0 && (
          <ComponentErrorBoundary componentName="Recent Activity">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-serif tracking-tight">Recent Activity</h2>
                <Link 
                  href="/books" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {recent_readings.slice(0, 6).map((reading) => (
                   <BookCard
                     key={reading.id}
                     book={reading.book}
                     reading={reading}
                     onClick={() => openBookModal(reading.book, reading.book.id)}
                     variant="compact"
                     showRating={true}
                   />
                 ))}
              </div>
            </div>
          </ComponentErrorBoundary>
        )}

        {/* Empty State */}
        {(!current_books || current_books.length === 0) && 
         (!recent_readings || recent_readings.length === 0) && 
         (!recent_recommendations || recent_recommendations.length === 0) && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold font-serif tracking-tight mb-4">Start Your Reading Journey</h2>
              <p className="text-sm text-gray-600 mb-6">Add some books to your library to see personalized recommendations and track your progress.</p>
              <Link href="/search" className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
                <span>Search for Books</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 