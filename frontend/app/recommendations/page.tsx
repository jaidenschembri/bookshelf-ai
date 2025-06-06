'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { recommendationApi, Recommendation } from '@/lib/api'
import { Star, RefreshCw, X, BookOpen, Brain } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RecommendationsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: recommendations, isLoading, error, refetch } = useQuery<Recommendation[]>(
    ['recommendations', session?.user?.id],
    () => recommendationApi.get(parseInt(session?.user?.id || '1')),
    {
      enabled: !!session?.user?.id,
      refetchOnWindowFocus: false,
    }
  )

  const refreshMutation = useMutation(
    () => recommendationApi.get(parseInt(session?.user?.id || '1'), true),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['recommendations', session?.user?.id], data)
        toast.success('Generated new recommendations!')
      },
      onError: (error: any) => {
        if (error.response?.status === 400) {
          toast.error('Add and rate some books first to get recommendations')
        } else {
          toast.error('Failed to generate recommendations')
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

  const handleRefresh = () => {
    refreshMutation.mutate()
  }

  const handleDismiss = (recommendationId: number) => {
    dismissMutation.mutate(recommendationId)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Brain className="h-8 w-8 text-primary-600 mr-3" />
                AI Recommendations
              </h1>
              <p className="text-gray-600 mt-2">
                Personalized book suggestions based on your reading history
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshMutation.isLoading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshMutation.isLoading ? 'animate-spin' : ''}`} />
              <span>{refreshMutation.isLoading ? 'Generating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-6">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="card relative">
                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismiss(recommendation.id)}
                  className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Dismiss recommendation"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex gap-6">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    {recommendation.book.cover_url ? (
                      <Image
                        src={recommendation.book.cover_url}
                        alt={recommendation.book.title}
                        width={120}
                        height={160}
                        className="rounded-lg object-cover shadow-sm"
                        style={{ width: '120px', height: 'auto' }}
                        sizes="120px"
                      />
                    ) : (
                      <div className="w-30 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Book Details and Recommendation */}
                  <div className="flex-1 min-w-0 pr-8">
                    {/* Book Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {recommendation.book.title}
                      </h3>
                      <p className="text-gray-600 mb-2">by {recommendation.book.author}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {recommendation.book.genre && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {recommendation.book.genre}
                          </span>
                        )}
                        {recommendation.book.publication_year && (
                          <span>{recommendation.book.publication_year}</span>
                        )}
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span>{Math.round(recommendation.confidence_score * 100)}% match</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-2">
                        <Brain className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-primary-900 mb-2">Why we recommend this book:</h4>
                          <p className="text-primary-800 text-sm leading-relaxed">
                            {recommendation.reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Book Description */}
                    {recommendation.book.description && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                          {recommendation.book.description}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/search?q=${encodeURIComponent(recommendation.book.title)}`}
                        className="btn-primary text-sm"
                      >
                        Add to Library
                      </Link>
                      <button
                        onClick={() => handleDismiss(recommendation.id)}
                        className="btn-secondary text-sm"
                      >
                        Not Interested
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to generate recommendations
            </h3>
            <p className="text-gray-600 mb-6">
              Add and rate some books in your library first, then we can suggest books you'll love!
            </p>
            <div className="space-x-4">
              <Link href="/search" className="btn-primary">
                Search for Books
              </Link>
              <Link href="/books" className="btn-secondary">
                View My Library
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recommendations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add and rate some books to get personalized AI recommendations!
            </p>
            <div className="space-x-4">
              <Link href="/search" className="btn-primary">
                Search for Books
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshMutation.isLoading}
                className="btn-secondary disabled:opacity-50"
              >
                {refreshMutation.isLoading ? 'Generating...' : 'Generate Recommendations'}
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Brain className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">How AI Recommendations Work</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
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