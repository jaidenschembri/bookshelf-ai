'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { socialApi, userApi, SocialFeed, UserPublicProfile, Reading } from '@/lib/api'
import { Heart, MessageCircle, Users, Search, UserPlus, UserMinus, Star, BookOpen, CheckCircle, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useAuthRefresh } from '@/lib/auth-utils'
import { useBookModal } from '@/contexts/BookModalContext'
import { Button, Card, Input, LoadingSpinner, TabNavigation, Badge, BookCard } from '@/components/ui'

export default function SocialPage() {
  const { needsAuth, isRefreshing, hasValidAuth, session, status } = useAuthRefresh()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'feed' | 'discover'>('feed')
  const { openBookModal } = useBookModal()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Get social feed
  const { data: feed, isLoading: feedLoading, error: feedError } = useQuery<SocialFeed>(
    ['social-feed'],
    () => socialApi.getFeed(),
    {
      enabled: hasValidAuth && activeTab === 'feed',
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useQuery<UserPublicProfile[]>(
    ['user-search', searchQuery],
    () => userApi.searchUsers(searchQuery),
    {
      enabled: searchQuery.length > 2 && activeTab === 'discover' && hasValidAuth,
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  // Follow/unfollow mutations
  const followMutation = useMutation({
    mutationFn: (userId: number) => socialApi.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-search'])
      queryClient.invalidateQueries(['social-feed'])
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: (userId: number) => socialApi.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-search'])
      queryClient.invalidateQueries(['social-feed'])
    },
  })

  const handleFollow = (userId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowMutation.mutate(userId)
    } else {
      followMutation.mutate(userId)
    }
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  // Check if user needs to sign in again (missing JWT token)
  if (needsAuth) {
    if (isRefreshing) {
      return (
        <Layout>
          <Card variant="flat" padding="lg" className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
              <Users className="h-12 w-12 text-white animate-pulse" />
            </div>
            <h3 className="heading-lg text-black mb-4">REFRESHING AUTHENTICATION</h3>
            <p className="text-body text-gray-600 mb-8">
              Please wait while we refresh your session...
            </p>
            <LoadingSpinner />
          </Card>
        </Layout>
      )
    }

    return (
      <Layout>
        <Card variant="flat" padding="lg" className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-red-500 flex items-center justify-center mx-auto mb-8">
            <Users className="h-12 w-12 text-white" />
          </div>
          <h3 className="heading-lg text-black mb-4">AUTHENTICATION REQUIRED</h3>
          <p className="text-body text-gray-600 mb-8">
            Your session has expired. Please sign in again to access social features.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => signIn('google')}
              variant="primary"
              fullWidth
            >
              Sign In with Google
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              fullWidth
            >
              Go to Home
            </Button>
          </div>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold font-serif tracking-tight mb-2">Social Feed</h1>
          <p className="text-sm text-gray-600">Connect with other readers and discover new books</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <TabNavigation
            options={[
              { value: 'feed', label: 'Feed' },
              { value: 'discover', label: 'Discover Users' }
            ]}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as 'feed' | 'discover')}
            spacing="normal"
          />
        </div>

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div>
            {feedError ? (
              <Card variant="flat" padding="lg" className="text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-red-500 flex items-center justify-center mx-auto mb-8">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold font-serif mb-4">Unable to Load Feed</h3>
                  <p className="text-sm text-gray-600 mb-8">
                    There was an error loading your social feed. Please try signing out and signing in again.
                  </p>
                  <Button
                    onClick={() => router.push('/')}
                    variant="primary"
                  >
                    Go to Sign In
                  </Button>
                </div>
              </Card>
            ) : feedLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner />
              </div>
            ) : feed && (feed.activities.length > 0 || feed.recent_reviews.length > 0) ? (
              <div className="space-y-8">
                {/* Recent Reviews */}
                {feed.recent_reviews.length > 0 && (
                  <div className="border border-gray-200 p-4 rounded">
                    <h3 className="text-lg font-semibold font-serif mb-4">Recent Reviews</h3>
                    <div className="space-y-4">
                      {feed.recent_reviews.map((reading) => (
                        <ReviewCard key={reading.id} reading={reading} openBookModal={openBookModal} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {feed.activities.length > 0 && (
                  <div className="border border-gray-200 p-4 rounded">
                    <h3 className="text-lg font-semibold font-serif mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {feed.activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} openBookModal={openBookModal} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card variant="flat" padding="lg" className="text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold font-serif mb-4">No Activity Yet</h3>
                  <p className="text-sm text-gray-600 mb-8">
                    Follow other users to see their reading activity and reviews in your feed.
                  </p>
                  <Button
                    onClick={() => setActiveTab('discover')}
                    variant="primary"
                  >
                    Discover Users
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div>
            {/* Search Form - matching search books styling */}
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
                    {searchResults.map((user, index) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        index={index}
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

            {/* Initial State - matching search books */}
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

// User Card Component - matching dashboard styling
function UserCard({ 
  user, 
  index,
  onFollow, 
  isLoading 
}: { 
  user: UserPublicProfile
  index: number
  onFollow: (userId: number, isFollowing: boolean) => void
  isLoading: boolean
}) {
  return (
    <div key={`${user.name}-${index}`} className="border border-gray-200 p-4 rounded">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            {user.profile_picture_url ? (
              <Image
                src={user.profile_picture_url}
                alt={user.name}
                width={48}
                height={48}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <Users className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/user/${user.id}`}>
              <h4 className="text-lg font-semibold font-serif hover:underline cursor-pointer transition-colors">
                {user.name}
              </h4>
            </Link>
            {user.username && (
              <p className="text-sm text-gray-600">@{user.username}</p>
            )}
            {user.bio && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>{user.follower_count} followers</span>
              <span>{user.following_count} following</span>
              <span>Goal: {user.reading_goal} books</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={() => onFollow(user.id, user.is_following)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              user.is_following
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            {user.is_following ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Review Card Component - using existing BookCard
function ReviewCard({ reading, openBookModal }: { reading: Reading; openBookModal: (book: any, bookId?: number) => void }) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-b-0">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <BookCard
            book={reading.book}
            reading={{
              status: reading.status,
              rating: reading.rating,
              progress_pages: reading.progress_pages,
              total_pages: reading.total_pages
            }}
            onClick={() => openBookModal(null, reading.book.id)}
            mode="compact"
          />
        </div>
        <div className="flex-1 min-w-0">
          {reading.user && (
            <Link href={`/user/${reading.user.id}`}>
              <p className="text-sm font-medium text-gray-900 hover:underline cursor-pointer mb-2">
                Review by {reading.user.name}
              </p>
            </Link>
          )}
          {reading.rating && (
            <div className="flex items-center mb-2">
              <Badge variant="rating" size="sm" color="gray" rating={reading.rating} />
            </div>
          )}
          {reading.review && (
            <p className="text-sm text-gray-600 mb-3">
              {reading.review}
            </p>
          )}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
              <span>Like</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Activity Card Component - matching dashboard style
function ActivityCard({ activity, openBookModal }: { activity: any; openBookModal: (book: any, bookId?: number) => void }) {
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'finished_book':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      case 'started_book':
        return <Clock className="h-4 w-4 text-gray-600" />
      case 'rated_book':
        return <Star className="h-4 w-4 text-gray-600" />
      case 'reviewed_book':
      case 'added_review':
        return <MessageCircle className="h-4 w-4 text-gray-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  const renderActivityMessage = () => {
    const bookTitle = activity.activity_data?.book_title
    const bookId = activity.activity_data?.book_id
    const bookAuthor = activity.activity_data?.book_author || 'Unknown Author'

    // Create clickable book title if available
    const clickableBookTitle = bookTitle && bookId ? (
      <button
        onClick={() => openBookModal(null, bookId)}
        className="font-serif font-medium hover:underline transition-colors"
      >
        {bookTitle}
      </button>
    ) : (
      <span>a book</span>
    )

    return (
      <>
        {clickableBookTitle} by {bookAuthor}
      </>
    )
  }

  const getActivityText = () => {
    switch (activity.activity_type) {
      case 'finished_book':
        return 'Finished reading'
      case 'started_book':
        return 'Started reading'
      case 'rated_book':
        return 'Rated'
      case 'reviewed_book':
      case 'added_review':
        return 'Reviewed'
      default:
        return 'Activity with'
    }
  }

  return (
    <div className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
          {getActivityIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <Link href={`/user/${activity.user.id}`}>
            <span className="font-medium hover:underline cursor-pointer">
              {activity.user.name}
            </span>
          </Link>
          {' '}{getActivityText().toLowerCase()}{' '}
          {renderActivityMessage()}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(activity.created_at).toLocaleDateString()}
        </p>
      </div>
      {activity.activity_data?.rating && (
        <Badge variant="rating" size="sm" color="gray" rating={activity.activity_data.rating} />
      )}
    </div>
  )
}

 
 