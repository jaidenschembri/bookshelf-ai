'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { userApi, socialApi, UserPublicProfile, Reading, User as UserType } from '@/lib/api'
import { TabNavigation } from '@/components/ui'
import { 
  Users, UserPlus, UserMinus, BookOpen, Star, Calendar, MapPin, 
  Eye, MessageCircle, Heart, User, Settings, Camera, Save 
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthRefresh } from '@/lib/auth-utils'
import { useBookModal } from '@/contexts/BookModalContext'

export default function UserProfilePage() {
  const { needsAuth, isRefreshing, hasValidAuth } = useAuthRefresh()
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = parseInt(id as string)
  const [activeTab, setActiveTab] = useState<'library' | 'reviews'>('library')
  const [libraryFilter, setLibraryFilter] = useState<string>('all')
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
  const { openBookModal } = useBookModal()

  // Get user profile
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery<UserPublicProfile>(
    ['user-profile', userId],
    () => userApi.getProfile(userId),
    {
      enabled: hasValidAuth && !isNaN(userId),
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        // Initialize form data when profile loads (only for own profile)
        if (data.can_edit) {
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
    }
  )

  // Get user library
  const { data: userLibrary, isLoading: libraryLoading } = useQuery<Reading[]>(
    ['user-library', userId, libraryFilter],
    () => userApi.getUserLibrary(userId, libraryFilter === 'all' ? undefined : libraryFilter),
    {
      enabled: hasValidAuth && !isNaN(userId) && activeTab === 'library',
      refetchOnWindowFocus: false,
    }
  )

  // Get user reviews
  const { data: userReviews, isLoading: reviewsLoading } = useQuery<Reading[]>(
    ['user-reviews', userId],
    () => userApi.getUserReviews(userId),
    {
      enabled: hasValidAuth && !isNaN(userId) && activeTab === 'reviews',
      refetchOnWindowFocus: false,
    }
  )

  // Follow/unfollow mutations
  const followMutation = useMutation({
    mutationFn: () => socialApi.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', userId])
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => socialApi.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', userId])
    },
  })

  // Profile editing mutations (only for own profile)
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<UserType>) => userApi.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', userId])
      queryClient.invalidateQueries(['current-user'])
      queryClient.invalidateQueries(['dashboard'])
      setIsEditing(false)
      // TODO: Show success message
    },
    onError: () => {
      // TODO: Show error message
    }
  })

  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => userApi.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', userId])
      queryClient.invalidateQueries(['current-user'])
      queryClient.invalidateQueries(['dashboard'])
      setIsUploadingPicture(false)
      // TODO: Show success message
    },
    onError: (error: any) => {
      setIsUploadingPicture(false)
      console.error('Profile picture upload failed:', error)
      // TODO: Show error message
    }
  })

  const handleFollow = () => {
    if (userProfile?.is_following) {
      unfollowMutation.mutate()
    } else {
      followMutation.mutate()
    }
  }

  const handleSave = () => {
    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        reading_goal: userProfile.reading_goal || 12,
        is_private: userProfile.is_private || false
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

  if (needsAuth || isRefreshing) {
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

  if (profileError || isNaN(userId)) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-red-500 flex items-center justify-center mx-auto mb-8">
              <Users className="h-12 w-12 text-white" />
            </div>
            <h3 className="heading-sm mb-4">USER NOT FOUND</h3>
            <p className="text-body text-gray-600 mb-8">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.back()}
              className="btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (profileLoading) {
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

  if (!userProfile) {
    return null
  }

  const libraryStatusOptions = [
    { value: 'all', label: 'All Books' },
    { value: 'want_to_read', label: 'Want to Read' },
    { value: 'currently_reading', label: 'Currently Reading' },
    { value: 'finished', label: 'Finished' },
  ]

  return (
    <Layout>
      <div>
        {/* Profile Header */}
        <div className="card-flat p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative inline-block flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 border-4 border-black flex items-center justify-center">
                {userProfile.profile_picture_url ? (
                  <Image
                    src={userProfile.profile_picture_url}
                    alt={userProfile.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-gray-600" />
                )}
              </div>
              {isEditing && userProfile.can_edit && (
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

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  {/* Name - Editable */}
                  {isEditing && userProfile.can_edit ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="heading-lg mb-2 w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-0 bg-white"
                      placeholder="Display name"
                    />
                  ) : (
                    <h1 className="heading-lg mb-2">{userProfile.name}</h1>
                  )}
                  
                  {/* Username - Editable */}
                  {isEditing && userProfile.can_edit ? (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="text-caption text-gray-600 px-3 py-1 border-2 border-black focus:outline-none focus:ring-0 bg-white"
                        placeholder="@username"
                      />
                    </div>
                  ) : (
                    userProfile.username && (
                      <p className="text-caption text-gray-600 mb-2">@{userProfile.username}</p>
                    )
                  )}
                </div>
                
                {/* Edit Profile / Follow Button */}
                {userProfile.can_edit ? (
                  !isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 font-bold border-2 border-black transition-all duration-200 bg-white text-black hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4 inline mr-2" />
                      EDIT PROFILE
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-3 font-bold border-2 border-black transition-all duration-200 bg-white text-black hover:bg-gray-100"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isLoading}
                        className="px-4 py-3 font-bold border-2 border-black transition-all duration-200 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>SAVE</span>
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followMutation.isLoading || unfollowMutation.isLoading}
                    className={`px-6 py-3 font-bold border-2 border-black transition-all duration-200 ${
                      userProfile.is_following
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-white text-black hover:bg-gray-100'
                    } disabled:opacity-50`}
                  >
                    {userProfile.is_following ? (
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
                )}
              </div>

              {/* Bio - Editable */}
              {isEditing && userProfile.can_edit ? (
                <div className="mb-4">
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-0 bg-white text-body"
                    placeholder="Tell other readers about yourself..."
                  />
                </div>
              ) : (
                userProfile.bio && (
                  <p className="text-body text-gray-700 mb-4">{userProfile.bio}</p>
                )
              )}

              {/* User Stats */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-caption text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{userProfile.follower_count} followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{userProfile.following_count} following</span>
                </div>
                
                {/* Reading Goal - Editable */}
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  {isEditing && userProfile.can_edit ? (
                    <div className="flex items-center space-x-1">
                      <span>Goal:</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.reading_goal}
                        onChange={(e) => setFormData({ ...formData, reading_goal: parseInt(e.target.value) || 12 })}
                        className="w-16 px-2 py-1 border border-black focus:outline-none focus:ring-0 bg-white text-center"
                      />
                      <span>books/year</span>
                    </div>
                  ) : (
                    <span>Goal: {userProfile.reading_goal} books/year</span>
                  )}
                </div>
                
                {/* Location - Editable */}
                {isEditing && userProfile.can_edit ? (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="px-2 py-1 border border-black focus:outline-none focus:ring-0 bg-white"
                      placeholder="City, Country"
                    />
                  </div>
                ) : (
                  userProfile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{userProfile.location}</span>
                    </div>
                  )
                )}
              </div>

              {/* Privacy Settings - Only show when editing */}
              {isEditing && userProfile.can_edit && (
                <div className="card-flat p-4 mb-4">
                  <h4 className="text-caption font-bold text-gray-900 mb-3">PRIVACY SETTINGS</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm">Private Profile</h5>
                      <p className="text-caption text-gray-600">
                        Only approved followers can see your reading activity
                      </p>
                    </div>
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
                  </div>
                </div>
              )}

              {/* Join Date */}
              <div className="flex items-center justify-center md:justify-start space-x-1 text-caption text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <TabNavigation
            options={[
              { value: 'library', label: 'Library' },
              { value: 'reviews', label: 'Reviews' }
            ]}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as 'library' | 'reviews')}
            spacing="normal"
          />
        </div>

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div>
            {/* Library Filter */}
            <div className="mb-6">
              <TabNavigation
                options={libraryStatusOptions}
                activeTab={libraryFilter}
                onTabChange={setLibraryFilter}
                spacing="normal"
                className="flex-wrap"
              />
            </div>

            {/* Library Content */}
            {libraryLoading ? (
              <div className="text-center py-12">
                <div className="loading-brutalist">
                  <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-black" />
                  </div>
                </div>
              </div>
            ) : userLibrary && userLibrary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userLibrary.map((reading) => (
                  <LibraryCard key={reading.id} reading={reading} openBookModal={openBookModal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="heading-sm mb-4">NO BOOKS FOUND</h3>
                <p className="text-body text-gray-600">
                  {libraryFilter === 'all' 
                    ? "This user hasn't added any books to their library yet."
                    : `This user has no ${libraryFilter.replace('_', ' ')} books.`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviewsLoading ? (
              <div className="text-center py-12">
                <div className="loading-brutalist">
                  <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
                    <Star className="h-8 w-8 text-black" />
                  </div>
                </div>
              </div>
            ) : userReviews && userReviews.length > 0 ? (
              <div className="space-y-6">
                {userReviews.map((reading) => (
                  <ReviewCard key={reading.id} reading={reading} openBookModal={openBookModal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Star className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="heading-sm mb-4">NO REVIEWS YET</h3>
                <p className="text-body text-gray-600">
                  This user hasn't written any public reviews yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

// Library Card Component
function LibraryCard({ reading, openBookModal }: { reading: Reading; openBookModal: (book: any, bookId?: number) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'bg-green-100 text-green-800'
      case 'currently_reading': return 'bg-blue-100 text-blue-800'
      case 'want_to_read': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'finished': return 'Finished'
      case 'currently_reading': return 'Reading'
      case 'want_to_read': return 'Want to Read'
      default: return status
    }
  }

  return (
    <div className="card-flat p-4">
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          {reading.book.cover_url ? (
            <Image
              src={reading.book.cover_url}
              alt={reading.book.title}
              width={80}
              height={120}
              className="object-cover border-2 border-black"
              style={{ width: '80px', height: 'auto' }}
            />
          ) : (
            <div className="w-20 h-28 bg-gray-200 border-2 border-black flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => openBookModal(null, reading.book.id)}
            className="font-serif font-bold text-lg mb-1 line-clamp-2 text-black hover:text-blue-600 hover:underline text-left transition-colors"
          >
            {reading.book.title}
          </button>
          <p className="text-caption text-gray-600 mb-2">{reading.book.author}</p>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(reading.status)}`}>
              {getStatusLabel(reading.status)}
            </span>
            {reading.rating && (
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < reading.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {reading.review && reading.is_review_public && (
            <p className="text-sm text-gray-700 line-clamp-2">{reading.review}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Review Card Component
function ReviewCard({ reading, openBookModal }: { reading: Reading; openBookModal: (book: any, bookId?: number) => void }) {
  return (
    <div className="card-flat p-6">
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          {reading.book.cover_url ? (
            <Image
              src={reading.book.cover_url}
              alt={reading.book.title}
              width={80}
              height={120}
              className="object-cover border-2 border-black"
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
          
          {reading.review && (
            <div className="mb-4">
              <p className="text-body text-gray-700">{reading.review}</p>
            </div>
          )}

          {/* Review interactions */}
          <div className="flex items-center space-x-4 text-caption text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{reading.like_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{reading.comment_count || 0}</span>
            </div>
            <span>{new Date(reading.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 