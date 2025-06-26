'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { dashboardApi, Dashboard, bookApi, readingApi, recommendationApi, Recommendation } from '@/lib/api'
import { BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBookModal } from '@/contexts/BookModalContext'
import { LoadingSpinner } from '@/components/ui'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { useErrorHandler, errorRecovery } from '@/lib/error-handling'
import CurrentlyReadingPanel from '@/components/features/CurrentlyReadingPanel'
import ActivityFeed from '@/components/features/ActivityFeed'

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
      }, 2)
      
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
            <div className="w-16 h-16 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold font-serif tracking-tight mb-4 text-gray-800">
                              {error ? 'Unable to load dashboard' : 'Welcome to Libraria!'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {error 
                ? 'We encountered an issue loading your dashboard. Please try again.' 
                : 'Start by adding some books to your library to see your personalized dashboard.'
              }
            </p>
              <div className="inline-flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium">
                <span>Use the search bar above to find books</span>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const { current_books = [], recent_readings = [], recent_recommendations = [] } = dashboard

  return (
    <Layout>
      {/* Desktop Two-column layout */}
      <div className="hidden lg:flex gap-8 h-full">
        {/* Left Panel - Currently Reading (Fixed) */}
        <div className="w-80 flex-shrink-0">
          <ComponentErrorBoundary componentName="Currently Reading Panel">
            <CurrentlyReadingPanel
              currentBooks={current_books}
              onBookClick={openBookModal}
            />
          </ComponentErrorBoundary>
        </div>

        {/* Right Panel - Activity Feed (Scrollable) */}
        <div className="flex-1 min-w-0">
          <ComponentErrorBoundary componentName="Activity Feed">
            <ActivityFeed
          onBookClick={openBookModal}
        />
          </ComponentErrorBoundary>
        </div>
      </div>

      {/* Mobile Layout - Single Column Stack */}
      <div className="lg:hidden space-y-8">
        <ComponentErrorBoundary componentName="Currently Reading Panel Mobile">
          <CurrentlyReadingPanel
            currentBooks={current_books}
          onBookClick={openBookModal}
            isMobile={true}
        />
        </ComponentErrorBoundary>

                  <ComponentErrorBoundary componentName="Activity Feed Mobile">
            <ActivityFeed
          onBookClick={openBookModal}
              isMobile={true}
            />
          </ComponentErrorBoundary>
      </div>
    </Layout>
  )
} 