'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
      onSuccess: () => {
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
        queryClient.setQueryData<Recommendation[]>(
          ['recommendations', session?.user?.id],
          (oldData) => oldData?.filter(rec => rec.id !== data.recommendationId) || []
        )
        
        queryClient.invalidateQueries(['readings'])
        queryClient.invalidateQueries(['dashboard'])
        
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
              <h1 className="heading-xl text-black flex items-center">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-black mr-2 sm:mr-3" />
                AI Recommendations
              </h1>
              <p className="text-body text-gray-600 mt-2">
                Personalized book suggestions based on your reading history
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="primary"
              disabled={refreshMutation.isLoading}
              loading={refreshMutation.isLoading}
              icon={<RefreshCw className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {refreshMutation.isLoading ? 'Generating...' : 'Refresh'}
            </Button>
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
                isAddingToLibrary={addToLibraryMutation.isLoading}
                isDismissing={dismissMutation.isLoading}
              />
            ))}
          </div>
        ) : error ? (
          <Card variant="flat" className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="heading-lg text-black mb-2">
              Unable to generate recommendations
            </h3>
            <p className="text-body text-gray-600 mb-6">
              Add and rate some books in your library first, then we can suggest books you'll love!
            </p>
            <div className="space-x-4">
              <Link href="/search">
                <Button variant="primary">Search for Books</Button>
              </Link>
              <Link href="/books">
                <Button variant="secondary">View My Library</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card variant="flat" className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="heading-lg text-black mb-2">
              No recommendations yet
            </h3>
            <p className="text-body text-gray-600 mb-6">
              Add and rate some books to get personalized AI recommendations!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
                <Button variant="primary" className="w-full sm:w-auto">
                  Search for Books
                </Button>
              </Link>
              <Button
                onClick={handleRefresh}
                variant="secondary"
                disabled={refreshMutation.isLoading}
                loading={refreshMutation.isLoading}
                className="w-full sm:w-auto"
              >
                {refreshMutation.isLoading ? 'Generating...' : 'Generate Recommendations'}
              </Button>
            </div>
          </Card>
        )}

        {/* Info Box */}
        <Card variant="flat" className="mt-12">
          <div className="flex items-start space-x-3">
            <Brain className="h-6 w-6 text-black mt-0.5" />
            <div>
              <h3 className="heading-sm text-black mb-2">How AI Recommendations Work</h3>
              <p className="text-body text-gray-600">
                Our AI analyzes your reading history, including the books you've rated highly, 
                your favorite genres, and authors you enjoy. It then finds patterns in your 
                preferences and suggests books that match your taste, complete with detailed 
                explanations for each recommendation.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
} 