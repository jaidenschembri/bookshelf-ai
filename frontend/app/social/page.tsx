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
import { UserCard, ReviewCard, ActivityCard } from '@/components/social'

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
                      {feed.recent_reviews.map((reading, index) => (
                        <ReviewCard 
                          key={reading.id} 
                          reading={reading} 
                          onBookClick={openBookModal}
                          priority={index < 3} // Priority loading for first 3 reviews
                        />
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
                        <ActivityCard 
                          key={activity.id} 
                          activity={activity} 
                          onBookClick={openBookModal} 
                        />
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



 
 