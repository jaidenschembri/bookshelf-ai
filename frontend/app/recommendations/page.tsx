'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { recommendationApi, Recommendation, bookApi, readingApi } from '@/lib/api'
import { RefreshCw, Brain } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useBookModal } from '@/contexts/BookModalContext'
import { Button, Card, LoadingSpinner } from '@/components/ui'
import { RecommendationCard } from '@/components/features'

export default function RecommendationsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { openBookModal } = useBookModal()
  const [loadingStates, setLoadingStates] = useState<{
    adding: Set<number>
    dismissing: Set<number>
  }>({
    adding: new Set(),
    dismissing: new Set()
  })

  const { data: recommendations, isLoading, error, refetch } = useQuery<Recommendation[]>(
    ['recommendations', session?.user?.id],
    () => recommendationApi.get(),
    {
      enabled: !!session?.user?.id && !!session?.accessToken,
      refetchOnWindowFocus: false,
    }
  )

  const refreshMutation = useMutation(
    (options?: { silent?: boolean }) => recommendationApi.get(true),
    {
      onSuccess: (data, variables) => {
        queryClient.setQueryData(['recommendations', session?.user?.id], data)
        if (!variables?.silent) {
          toast.success('Generated new recommendations!')
        }
      },
      onError: (error: any, variables) => {
        if (!variables?.silent) {
          if (error.response?.status === 400) {
            toast.error('Add and rate some books first to get recommendations')
          } else {
            toast.error('Failed to generate recommendations')
          }
        }
      },
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
        queryClient.invalidateQueries(['recommendations'])
        toast.success('Recommendation dismissed')
        setLoadingStates(prev => {
          const newDismissing = new Set(prev.dismissing)
          newDismissing.delete(recommendationId)
          return { ...prev, dismissing: newDismissing }
        })
      },
      onError: (_, recommendationId) => {
        toast.error('Failed to dismiss recommendation')
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
      onMutate: (recommendation) => {
        setLoadingStates(prev => {
          const newAdding = new Set(prev.adding)
          newAdding.add(recommendation.id)
          return { ...prev, adding: newAdding }
        })
      },
      onSuccess: (data) => {
        queryClient.setQueryData<Recommendation[]>(
          ['recommendations', session?.user?.id],
          (oldData) => oldData?.filter(rec => rec.id !== data.recommendationId) || []
        )
        
        queryClient.invalidateQueries(['readings'])
        queryClient.invalidateQueries(['dashboard'])
        
        toast.success('Book added to your library!')
        setLoadingStates(prev => {
          const newAdding = new Set(prev.adding)
          newAdding.delete(data.recommendationId)
          return { ...prev, adding: newAdding }
        })
      },
      onError: (error: any, recommendation) => {
        console.error('Add to library error:', error)
        if (error.response?.status === 409) {
          toast.error('Book is already in your library')
        } else {
          toast.error('Failed to add book to library')
        }
        setLoadingStates(prev => {
          const newAdding = new Set(prev.adding)
          newAdding.delete(recommendation.id)
          return { ...prev, adding: newAdding }
        })
      },
    }
  )

  const handleRefresh = () => {
    refreshMutation.mutate({ silent: false })
  }

  const handleDismiss = (recommendationId: number) => {
    dismissMutation.mutate(recommendationId)
  }

  const handleAddToLibrary = (recommendation: Recommendation) => {
    addToLibraryMutation.mutate(recommendation)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold font-serif tracking-tight flex items-center mb-2">
                <Brain className="h-6 w-6 text-gray-700 mr-3" />
                AI Recommendations
              </h1>
              <p className="text-sm text-gray-600">
                Personalized book suggestions based on your reading history
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshMutation.isLoading}
              className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{refreshMutation.isLoading ? 'Generating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-6">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onAddToLibrary={() => handleAddToLibrary(recommendation)}
                onDismiss={() => handleDismiss(recommendation.id)}
                onBookClick={() => openBookModal(null, recommendation.book.id)}
                isAddingToLibrary={loadingStates.adding.has(recommendation.id)}
                isDismissing={loadingStates.dismissing.has(recommendation.id)}
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-serif mb-2">
              Unable to generate recommendations
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Add and rate some books in your library first, then we can suggest books you'll love!
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/search" className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
                <span>Search for Books</span>
              </Link>
              <Link href="/books" className="inline-flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                <span>View My Library</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-serif mb-2">
              No recommendations yet
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Add and rate some books to get personalized AI recommendations!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search" className="inline-flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
                <span>Search for Books</span>
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshMutation.isLoading}
                className="inline-flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <span>{refreshMutation.isLoading ? 'Generating...' : 'Generate Recommendations'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="border border-gray-200 p-4 rounded mt-8">
          <div className="flex items-start space-x-3">
            <Brain className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold font-serif mb-2">How AI Recommendations Work</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our AI analyzes your reading history, including the books you've rated highly, 
                your favorite genres, and authors you enjoy. It then finds patterns in your 
                preferences and suggests books that match your taste, complete with detailed 
                explanations for each recommendation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 