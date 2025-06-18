'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { recommendationApi, socialApi, userApi, bookApi, readingApi, Recommendation, User, Reading, UserPublicProfile } from '@/lib/api'
import { Brain, Users, BookOpen, UserPlus, Check, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBookModal } from '@/contexts/BookModalContext'
import { Button, Card, LoadingSpinner, TabNavigation } from '@/components/ui'
import { RecommendationCard } from '@/components/features'
import { UserCard } from '@/components/social'

export default function DiscoverPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { openBookModal } = useBookModal()
  const [activeTab, setActiveTab] = useState<'books' | 'users'>('books')
  const [searchQuery, setSearchQuery] = useState('')
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set())
  const [loadingStates, setLoadingStates] = useState<{
    adding: Set<number>
    dismissing: Set<number>
    following: Set<number>
  }>({
    adding: new Set(),
    dismissing: new Set(),
    following: new Set()
  })

  // AI Recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<Recommendation[]>(
    ['recommendations', session?.user?.id],
    () => recommendationApi.get(),
    {
      enabled: !!session?.user?.id && !!session?.accessToken && activeTab === 'books',
      refetchOnWindowFocus: false,
    }
  )

  // Suggested Users (people with similar taste)
  const { data: suggestedUsers, isLoading: usersLoading } = useQuery<UserPublicProfile[]>(
    ['suggested-users', session?.user?.id],
    async () => {
      // Get users who have rated books similarly to current user
      const users = await userApi.searchUsers('')
      return users.slice(0, 4) // Limit to 4 suggested users
    },
    {
      enabled: !!session?.user?.id && activeTab === 'books',
      refetchOnWindowFocus: false,
    }
  )

  // User search results
  const { data: searchResults, isLoading: searchLoading } = useQuery<UserPublicProfile[]>(
    ['user-search', searchQuery],
    () => userApi.searchUsers(searchQuery),
    {
      enabled: searchQuery.length > 2 && activeTab === 'users' && !!session?.user?.id,
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  // What others are reading (recent activity from followed users + public activity)
  const { data: othersReading, isLoading: othersReadingLoading } = useQuery<Reading[]>(
    ['others-reading', session?.user?.id],
    async () => {
      // Get recent public readings from other users
      const feed = await socialApi.getFeed()
      // Extract readings from activities and recent reviews
      const readings: Reading[] = []
      
      // Add recent reviews (these are actual Reading objects)
      if (feed.recent_reviews) {
        feed.recent_reviews.forEach(reading => {
          // Include currently reading books and recently finished books
          if (reading.status === 'currently_reading' || 
              (reading.status === 'finished' && reading.finished_at)) {
            readings.push(reading)
          }
        })
      }
      
      // Add readings from activities
      if (feed.activities) {
        feed.activities.forEach(activity => {
          if (activity.activity_data?.reading) {
            const reading = activity.activity_data.reading
            // Include currently reading books and recently finished books
            if (reading.status === 'currently_reading' || 
                (reading.status === 'finished' && reading.finished_at)) {
              readings.push(reading)
            }
          }
        })
      }
      
      return readings.slice(0, 8) // Limit to 8 books
    },
    {
      enabled: !!session?.user?.id && activeTab === 'books',
      refetchOnWindowFocus: false,
    }
  )

  // Mutations
  const dismissMutation = useMutation(
    (recommendationId: number) => recommendationApi.dismiss(recommendationId),
    {
      onMutate: (recommendationId) => {
        setLoadingStates(prev => ({
          ...prev,
          dismissing: new Set(prev.dismissing).add(recommendationId)
        }))
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
        setLoadingStates(prev => ({
          ...prev,
          adding: new Set(prev.adding).add(recommendation.id)
        }))
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

  const followMutation = useMutation({
    mutationFn: (userId: number) => socialApi.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-search'])
      queryClient.invalidateQueries(['suggested-users'])
      toast.success('User followed!')
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: (userId: number) => socialApi.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-search'])
      queryClient.invalidateQueries(['suggested-users'])
      toast.success('User unfollowed!')
    },
  })

  const handleDismiss = (recommendationId: number) => {
    dismissMutation.mutate(recommendationId)
  }

  const handleAddToLibrary = (recommendation: Recommendation) => {
    addToLibraryMutation.mutate(recommendation)
  }

  const handleFollow = (userId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowMutation.mutate(userId)
    } else {
      followMutation.mutate(userId)
    }
  }

  const handleBookClick = (book: any) => {
    openBookModal(null, book.id)
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold font-serif tracking-tight flex items-center mb-2">
            <Brain className="h-6 w-6 text-gray-700 mr-3" />
            Discover
          </h1>
          <p className="text-sm text-gray-600">
            Find your next great read and connect with other readers
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <TabNavigation
            options={[
              { value: 'books', label: 'Books' },
              { value: 'users', label: 'Users' }
            ]}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as 'books' | 'users')}
            spacing="normal"
          />
        </div>

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div>
            {/* AI Recommendations Section */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold font-serif mb-6">Recommended for you</h2>
              
              {recommendationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.slice(0, 2).map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onBookClick={() => handleBookClick(recommendation.book)}
                      onAddToLibrary={() => handleAddToLibrary(recommendation)}
                      onDismiss={() => handleDismiss(recommendation.id)}
                      isAddingToLibrary={loadingStates.adding.has(recommendation.id)}
                      isDismissing={loadingStates.dismissing.has(recommendation.id)}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <Card variant="flat" padding="lg" className="text-center">
                  <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold font-serif mb-2">No recommendations yet</h3>
                  <p className="text-sm text-gray-600">
                    Add and rate some books to get personalized AI recommendations
                  </p>
                </Card>
              )}
            </div>

            {/* People with Similar Taste Section */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold font-serif mb-6">People with similar taste</h2>
              
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : suggestedUsers && suggestedUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestedUsers.map((user) => (
                    <Card key={user.id} variant="hover" padding="lg" className="flex items-center space-x-4">
                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        {user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={user.username || user.name}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {user.username || user.name}
                        </h3>
                        {user.username && user.name !== user.username && (
                          <p className="text-xs text-gray-600">{user.name}</p>
                        )}
                        {user.bio && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                      </div>

                      {/* Follow Button */}
                      <div className="flex-shrink-0">
                        {followingUsers.has(user.id) ? (
                          <Button
                            variant="success"
                            size="sm"
                            disabled
                            icon={<Check className="h-4 w-4" />}
                          >
                            Following
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleFollow(user.id, user.is_following)}
                            loading={loadingStates.following.has(user.id)}
                            icon={<UserPlus className="h-4 w-4" />}
                          >
                            Follow
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card variant="flat" padding="lg" className="text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold font-serif mb-2">No suggested users yet</h3>
                  <p className="text-sm text-gray-600">
                    As more users join and rate books, we'll suggest people with similar taste
                  </p>
                </Card>
              )}
            </div>

            {/* What Others Are Reading Section */}
            <div className="mb-12">
              <h2 className="text-lg font-semibold font-serif mb-6">What others are reading</h2>
              
              {othersReadingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : othersReading && othersReading.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {othersReading.map((reading, index) => (
                    <div
                      key={`${reading.id}-${index}`}
                      className="cursor-pointer group"
                      onClick={() => handleBookClick(reading.book)}
                    >
                      {/* Book Cover */}
                      <div className="aspect-[3/4] mb-2">
                        {reading.book.cover_url ? (
                          <img
                            src={reading.book.cover_url}
                            alt={reading.book.title}
                            className="w-full h-full object-cover rounded border border-gray-200 group-hover:shadow-md transition-shadow"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 border border-gray-200 rounded flex items-center justify-center group-hover:shadow-md transition-shadow">
                            <BookOpen className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="text-center">
                        <h4 className="text-xs font-medium text-gray-900 truncate mb-1">
                          {reading.book.title}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">
                          {reading.book.author}
                        </p>
                        {reading.user && (
                          <p className="text-xs text-gray-500 mt-1">
                            by {reading.user.username || reading.user.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card variant="flat" padding="lg" className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold font-serif mb-2">No community activity yet</h3>
                  <p className="text-sm text-gray-600">
                    Follow other users to see what they're reading
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Search Form */}
            <div className="border border-gray-200 p-4 rounded mb-8">
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for users by name or username..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold font-serif">
                  Search Results ({searchResults?.length || 0})
                </h2>
                
                {searchLoading ? (
                  <div className="text-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="grid gap-6">
                    {searchResults.map((user) => (
                      <UserCard 
                        key={user.id}
                        user={user}
                        onFollow={handleFollow}
                        isLoading={followMutation.isLoading || unfollowMutation.isLoading}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold font-serif mb-2">No users found</h3>
                    <p className="text-sm text-gray-600">
                      Try searching with different keywords or check your spelling.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Initial State */}
            {!searchQuery && (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold font-serif mb-2">
                  Search for users to follow
                </h3>
                <p className="text-sm text-gray-600">
                  Enter a name or username to find other readers.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
} 