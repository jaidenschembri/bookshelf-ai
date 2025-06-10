'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { socialApi, userApi, SocialFeed, UserPublicProfile, Reading } from '@/lib/api'
import { Heart, MessageCircle, Users, Search, UserPlus, UserMinus, Star, BookOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useAuthRefresh } from '@/lib/auth-utils'
import { useBookModal } from '@/contexts/BookModalContext'
import { Button, Card, Input, LoadingSpinner, TabNavigation } from '@/components/ui'

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
          <Card variant="flat" className="text-center py-20 max-w-md mx-auto">
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
        <Card variant="flat" className="text-center py-20 max-w-md mx-auto">
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
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-xl text-black mb-4">SOCIAL FEED</h1>
          <p className="text-body text-gray-600">Connect with other readers and discover new books</p>
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
              <Card variant="flat" className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-red-500 flex items-center justify-center mx-auto mb-8">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="heading-lg text-black mb-4">UNABLE TO LOAD FEED</h3>
                  <p className="text-body text-gray-600 mb-8">
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
                  <div>
                    <h3 className="heading-lg text-black mb-6">RECENT REVIEWS</h3>
                    <div className="space-y-6">
                      {feed.recent_reviews.map((reading) => (
                        <ReviewCard key={reading.id} reading={reading} openBookModal={openBookModal} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {feed.activities.length > 0 && (
                  <div>
                    <h3 className="heading-lg text-black mb-6">RECENT ACTIVITY</h3>
                    <div className="space-y-4">
                      {feed.activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} openBookModal={openBookModal} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card variant="flat" className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="heading-lg text-black mb-4">NO ACTIVITY YET</h3>
                  <p className="text-body text-gray-600 mb-8">
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
            {/* Search */}
            <div className="mb-8">
              <Input
                type="text"
                placeholder="Search for users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-5 w-5" />}
              />
            </div>

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <div>
                {searchLoading ? (
                  <div className="text-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="space-y-4">
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
                  <Card variant="flat" className="text-center py-12">
                    <p className="text-body text-gray-600">No users found matching "{searchQuery}"</p>
                  </Card>
                )}
              </div>
            )}

            {searchQuery.length <= 2 && (
              <Card variant="flat" className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
                    <Search className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="heading-lg text-black mb-4">DISCOVER READERS</h3>
                  <p className="text-body text-gray-600">
                    Search for other users to follow and see their reading activity.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

// User Card Component
function UserCard({ 
  user, 
  onFollow, 
  isLoading 
}: { 
  user: UserPublicProfile
  onFollow: (userId: number, isFollowing: boolean) => void
  isLoading: boolean
}) {
  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 border-2 border-black flex items-center justify-center">
            {user.profile_picture_url ? (
              user.profile_picture_url.includes('supabase.co') ? (
                <Image
                  src={user.profile_picture_url}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={user.profile_picture_url}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <Users className="h-8 w-8 text-gray-600" />
            )}
          </div>
          <div>
            <Link href={`/user/${user.id}`}>
              <h4 className="heading-lg text-black hover:underline cursor-pointer transition-colors">{user.name}</h4>
            </Link>
            {user.username && (
              <p className="text-caption text-gray-600">@{user.username}</p>
            )}
            {user.bio && (
              <p className="text-body text-gray-700 mt-1">{user.bio}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-caption text-gray-500">
              <span>{user.follower_count} followers</span>
              <span>{user.following_count} following</span>
              <span>Goal: {user.reading_goal} books</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => onFollow(user.id, user.is_following)}
          variant={user.is_following ? 'primary' : 'secondary'}
          disabled={isLoading}
          icon={user.is_following ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        >
          {user.is_following ? 'UNFOLLOW' : 'FOLLOW'}
        </Button>
      </div>
    </Card>
  )
}

// Review Card Component
function ReviewCard({ reading, openBookModal }: { reading: Reading; openBookModal: (book: any, bookId?: number) => void }) {
  return (
    <Card padding="lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {reading.book.cover_url ? (
            <Image
              src={reading.book.cover_url}
              alt={reading.book.title}
              width={80}
              height={120}
              className="book-cover"
              style={{ width: '80px', height: 'auto' }}
            />
          ) : (
            <div className="w-20 h-28 bg-gray-200 border-2 border-black flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => openBookModal(null, reading.book.id)}
              className="heading-lg text-black hover:underline text-left transition-colors"
            >
              {reading.book.title}
            </button>
            {reading.rating && (
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < reading.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-caption text-gray-600 mb-3">by {reading.book.author}</p>
          {reading.user && (
            <Link href={`/user/${reading.user.id}`}>
              <p className="text-caption text-black hover:underline cursor-pointer mb-2">
                Review by {reading.user.name}
              </p>
            </Link>
          )}
          {reading.review && (
            <p className="text-body text-gray-700 mb-4">{reading.review}</p>
          )}
          <div className="flex items-center space-x-4 text-caption text-gray-500">
            <button className="flex items-center space-x-1 hover:text-red-500">
              <Heart className="h-4 w-4" />
              <span>Like</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-500">
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Activity Card Component
function ActivityCard({ activity, openBookModal }: { activity: any; openBookModal: (book: any, bookId?: number) => void }) {
  const getActivityMessage = () => {
    const userName = (
      <Link href={`/user/${activity.user.id}`}>
        <span className="font-bold text-black hover:underline cursor-pointer">{activity.user.name}</span>
      </Link>
    )

    const bookTitle = activity.activity_data?.book_title
    const bookId = activity.activity_data?.book_id
    const rating = activity.activity_data?.rating

    // Create clickable book title if available
    const clickableBookTitle = bookTitle && bookId ? (
      <button
        onClick={() => openBookModal(null, bookId)}
        className="font-semibold text-black hover:underline cursor-pointer"
      >
        "{bookTitle}"
      </button>
    ) : null

    switch (activity.activity_type) {
      case 'finished_book':
        return clickableBookTitle ? (
          <>{userName} finished reading {clickableBookTitle}</>
        ) : (
          <>{userName} finished reading a book</>
        )
      case 'started_book':
        return clickableBookTitle ? (
          <>{userName} started reading {clickableBookTitle}</>
        ) : (
          <>{userName} started reading a book</>
        )
      case 'rated_book':
        return clickableBookTitle ? (
          <>{userName} rated {clickableBookTitle} {rating && (
            <span className="inline-flex items-center ml-1">
              {Array.from({ length: rating }, (_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </span>
          )}</>
        ) : (
          <>{userName} rated a book {rating && (
            <span className="inline-flex items-center ml-1">
              {Array.from({ length: rating }, (_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </span>
          )}</>
        )
      case 'reviewed_book':
        return clickableBookTitle ? (
          <>{userName} reviewed {clickableBookTitle}</>
        ) : (
          <>{userName} reviewed a book</>
        )
      case 'added_review':
        return clickableBookTitle ? (
          <>{userName} reviewed {clickableBookTitle}</>
        ) : (
          <>{userName} added a review</>
        )
      default:
        return <>{userName} had some activity</>
    }
  }

  return (
    <Card variant="flat" padding="md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 border-2 border-black flex items-center justify-center">
          {activity.user.profile_picture_url ? (
            activity.user.profile_picture_url.includes('supabase.co') ? (
              <Image
                src={activity.user.profile_picture_url}
                alt={activity.user.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={activity.user.profile_picture_url}
                alt={activity.user.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <Users className="h-5 w-5 text-gray-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-body">
            {getActivityMessage()}
          </p>
          <p className="text-caption text-gray-500">
            {new Date(activity.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  )
}

 