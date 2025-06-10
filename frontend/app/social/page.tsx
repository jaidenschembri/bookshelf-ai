'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { socialApi, userApi, SocialFeed, UserPublicProfile, Reading, User } from '@/lib/api'
import { Heart, MessageCircle, Users, Search, UserPlus, UserMinus, Star, BookOpen, Settings, Camera, Save } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useAuthRefresh } from '@/lib/auth-utils'
import { useBookModal } from '@/contexts/BookModalContext'

export default function SocialPage() {
  const { needsAuth, isRefreshing, hasValidAuth, session, status } = useAuthRefresh()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'profile'>('feed')
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
      retry: false, // Don't retry on auth errors
    }
  )

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useQuery<UserPublicProfile[]>(
    ['user-search', searchQuery],
    () => userApi.searchUsers(searchQuery),
    {
      enabled: searchQuery.length > 2 && activeTab === 'discover' && hasValidAuth,
      refetchOnWindowFocus: false,
      retry: false, // Don't retry on auth errors
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
          <div className="loading-brutalist">
            <div className="w-32 h-32 border-8 border-black bg-white flex items-center justify-center">
              <Users className="h-16 w-16 text-black" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Check if user needs to sign in again (missing JWT token)
  if (needsAuth) {
    if (isRefreshing) {
      return (
        <Layout>
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-blue-500 flex items-center justify-center mx-auto mb-8">
                <Users className="h-12 w-12 text-white animate-pulse" />
              </div>
              <h3 className="heading-sm mb-4">REFRESHING AUTHENTICATION</h3>
              <p className="text-body text-gray-600 mb-8">
                Please wait while we refresh your session...
              </p>
              <div className="loading-brutalist">
                <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
                  <Users className="h-8 w-8 text-black" />
                </div>
              </div>
            </div>
          </div>
        </Layout>
      )
    }

    return (
      <Layout>
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-red-500 flex items-center justify-center mx-auto mb-8">
              <Users className="h-12 w-12 text-white" />
            </div>
            <h3 className="heading-sm mb-4">AUTHENTICATION REQUIRED</h3>
            <p className="text-body text-gray-600 mb-8">
              Your session has expired. Please sign in again to access social features.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => signIn('google')}
                className="btn-primary w-full"
              >
                Sign In with Google
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary w-full"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-lg mb-4">SOCIAL FEED</h1>
          <p className="text-body text-gray-600">Connect with other readers and discover new books</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-3 font-bold border-2 border-black transition-all duration-200 ${
              activeTab === 'feed'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            FEED
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-3 font-bold border-2 border-black transition-all duration-200 ${
              activeTab === 'discover'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            DISCOVER USERS
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-bold border-2 border-black transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            MY PROFILE
          </button>
        </div>

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div>
            {feedError ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-red-500 flex items-center justify-center mx-auto mb-8">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="heading-sm mb-4">UNABLE TO LOAD FEED</h3>
                  <p className="text-body text-gray-600 mb-8">
                    There was an error loading your social feed. Please try signing out and signing in again.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="btn-primary"
                  >
                    Go to Sign In
                  </button>
                </div>
              </div>
            ) : feedLoading ? (
              <div className="text-center py-12">
                <div className="loading-brutalist">
                  <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
                    <Users className="h-8 w-8 text-black" />
                  </div>
                </div>
              </div>
            ) : feed && (feed.activities.length > 0 || feed.recent_reviews.length > 0) ? (
              <div className="space-y-8">
                {/* Recent Reviews */}
                {feed.recent_reviews.length > 0 && (
                  <div>
                    <h3 className="heading-sm mb-6">RECENT REVIEWS</h3>
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
                    <h3 className="heading-sm mb-6">RECENT ACTIVITY</h3>
                    <div className="space-y-4">
                      {feed.activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} openBookModal={openBookModal} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="heading-sm mb-4">NO ACTIVITY YET</h3>
                  <p className="text-body text-gray-600 mb-8">
                    Follow other users to see their reading activity and reviews in your feed.
                  </p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="btn-primary"
                  >
                    Discover Users
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div>
            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <div>
                {searchLoading ? (
                  <div className="text-center py-12">
                    <div className="loading-brutalist">
                      <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
                        <Search className="h-8 w-8 text-black" />
                      </div>
                    </div>
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
                  <div className="text-center py-12">
                    <p className="text-body text-gray-600">No users found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {searchQuery.length <= 2 && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
                    <Search className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="heading-sm mb-4">DISCOVER READERS</h3>
                  <p className="text-body text-gray-600">
                    Search for other users to follow and see their reading activity.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileSettings />
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
    <div className="card-flat p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 border-2 border-black flex items-center justify-center">
            {user.profile_picture_url ? (
              user.profile_picture_url.includes('supabase.co') ? (
                // Use Next.js Image for Supabase URLs (they're optimized and reliable)
                <Image
                  src={user.profile_picture_url}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                // Use Next.js Image for external URLs (Google profile pics)
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
              <h4 className="font-serif font-bold text-lg hover:text-blue-600 cursor-pointer transition-colors">{user.name}</h4>
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
        <button
          onClick={() => onFollow(user.id, user.is_following)}
          disabled={isLoading}
          className={`px-4 py-2 font-bold border-2 border-black transition-all duration-200 ${
            user.is_following
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-white text-black hover:bg-gray-100'
          } disabled:opacity-50`}
        >
          {user.is_following ? (
            <>
              <UserMinus className="h-4 w-4 inline mr-2" />
              UNFOLLOW
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 inline mr-2" />
              FOLLOW
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Review Card Component
function ReviewCard({ reading, openBookModal }: { reading: Reading; openBookModal: (book: any, bookId?: number) => void }) {
  return (
    <div className="card p-6">
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
              className="font-serif font-bold text-lg text-black hover:text-blue-600 hover:underline text-left transition-colors"
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
              <p className="text-caption text-blue-600 hover:text-blue-800 cursor-pointer mb-2">
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
    </div>
  )
}

// Activity Card Component
function ActivityCard({ activity, openBookModal }: { activity: any; openBookModal: (book: any, bookId?: number) => void }) {
  const getActivityMessage = () => {
    const userName = (
      <Link href={`/user/${activity.user.id}`}>
        <span className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer">{activity.user.name}</span>
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
      case 'followed_user':
        return <>{userName} followed a new user</>
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
    <div className="card-flat p-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 border-2 border-black flex items-center justify-center">
          {activity.user.profile_picture_url ? (
            activity.user.profile_picture_url.includes('supabase.co') ? (
              // Use Next.js Image for Supabase URLs (they're optimized and reliable)
              <Image
                src={activity.user.profile_picture_url}
                alt={activity.user.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              // Use Next.js Image for external URLs (Google profile pics)
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
    </div>
  )
}

// Profile Settings Component
function ProfileSettings() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    reading_goal: 12,
    is_private: false
  })

  // Get current user data
  const { data: currentUser, isLoading } = useQuery<User>(
    ['current-user'],
    () => userApi.getCurrentUser(),
    {
      enabled: !!session?.user?.id,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setFormData({
          name: data.name || '',
          username: data.username || '',
          bio: data.bio || '',
          location: data.location || '',
          reading_goal: data.reading_goal || 12,
          is_private: data.is_private || false
        })
      }
    }
  )

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<User>) => userApi.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user'])
      queryClient.invalidateQueries(['dashboard'])
      setIsEditing(false)
      // Show success message
    },
    onError: () => {
      // Show error message
    }
  })

  // Profile picture upload mutation
  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => userApi.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user'])
      queryClient.invalidateQueries(['dashboard'])
      setIsUploadingPicture(false)
      // Show success message
    },
    onError: (error: any) => {
      setIsUploadingPicture(false)
      console.error('Profile picture upload failed:', error)
      // Show error message
    }
  })

  const handleSave = () => {
    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        reading_goal: currentUser.reading_goal || 12,
        is_private: currentUser.is_private || false
      })
    }
    setIsEditing(false)
  }

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert('File size must be less than 5MB')
        return
      }

      setIsUploadingPicture(true)
      uploadPictureMutation.mutate(file)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading-brutalist">
          <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
            <Settings className="h-8 w-8 text-black" />
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
            <Settings className="h-12 w-12 text-white" />
          </div>
          <h3 className="heading-sm mb-4">PROFILE NOT FOUND</h3>
          <p className="text-body text-gray-600">
            Unable to load your profile information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-8">
          <h3 className="heading-sm">MY PROFILE</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-ghost flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>EDIT</span>
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="btn-ghost"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>SAVE</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Profile Picture */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gray-200 border-4 border-black flex items-center justify-center mx-auto">
                {currentUser.profile_picture_url ? (
                  currentUser.profile_picture_url.includes('supabase.co') ? (
                    // Use Next.js Image for Supabase URLs (they're optimized and reliable)
                    <Image
                      src={currentUser.profile_picture_url}
                      alt={currentUser.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // Use Next.js Image for external URLs (Google profile pics)
                    <Image
                      src={currentUser.profile_picture_url}
                      alt={currentUser.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <Users className="h-16 w-16 text-gray-600" />
                )}
              </div>
              {isEditing && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                    id="profile-picture-input"
                  />
                  <button 
                    type="button"
                    onClick={() => document.getElementById('profile-picture-input')?.click()}
                    disabled={isUploadingPicture}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white border-2 border-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isUploadingPicture ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                </>
              )}
            </div>
            <p className="text-caption text-gray-600 mt-4">
              {isEditing ? 'Click camera icon to change photo' : 'Profile Picture'}
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-caption font-bold text-gray-900 mb-2">
                DISPLAY NAME
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-0"
                  placeholder="Your display name"
                />
              ) : (
                <p className="text-body py-3">{currentUser.name || 'Not set'}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-caption font-bold text-gray-900 mb-2">
                USERNAME
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-0"
                  placeholder="@username"
                />
              ) : (
                <p className="text-body py-3">
                  {currentUser.username ? `@${currentUser.username}` : 'Not set'}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-caption font-bold text-gray-900 mb-2">
                EMAIL
              </label>
              <p className="text-body py-3 text-gray-600">{currentUser.email}</p>
            </div>

            {/* Reading Goal */}
            <div>
              <label className="block text-caption font-bold text-gray-900 mb-2">
                READING GOAL (BOOKS/YEAR)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.reading_goal}
                  onChange={(e) => setFormData({ ...formData, reading_goal: parseInt(e.target.value) || 12 })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-0"
                />
              ) : (
                <p className="text-body py-3">{currentUser.reading_goal} books</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-caption font-bold text-gray-900 mb-2">
              BIO
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-0"
                placeholder="Tell other readers about yourself..."
              />
            ) : (
              <p className="text-body py-3">{currentUser.bio || 'No bio added yet'}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-caption font-bold text-gray-900 mb-2">
              LOCATION
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-0"
                placeholder="City, Country"
              />
            ) : (
              <p className="text-body py-3">{currentUser.location || 'Not set'}</p>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="card-flat p-6">
            <h4 className="text-caption font-bold text-gray-900 mb-4">PRIVACY SETTINGS</h4>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-gray-900">Private Profile</h5>
                <p className="text-body text-gray-600">
                  Only approved followers can see your reading activity
                </p>
              </div>
              {isEditing ? (
                <button
                  onClick={() => setFormData({ ...formData, is_private: !formData.is_private })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_private ? 'bg-black' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_private ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              ) : (
                <span className={`text-caption px-3 py-1 border-2 border-black ${
                  currentUser.is_private ? 'bg-black text-white' : 'bg-white text-black'
                }`}>
                  {currentUser.is_private ? 'PRIVATE' : 'PUBLIC'}
                </span>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="card-flat p-6">
            <h4 className="text-caption font-bold text-gray-900 mb-4">ACCOUNT INFO</h4>
            <div className="space-y-2 text-body text-gray-600">
              <p>Member since: {new Date(currentUser.created_at).toLocaleDateString()}</p>
              <p>User ID: {currentUser.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 