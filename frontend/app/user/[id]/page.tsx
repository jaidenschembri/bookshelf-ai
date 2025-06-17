'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { userApi, socialApi, UserPublicProfile, Reading, User as UserType } from '@/lib/api'
import { TabNavigation } from '@/components/ui'
import { 
  Users, BookOpen, Star, Eye, MessageCircle, Heart
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthRefresh } from '@/lib/auth-utils'
import { useBookModal } from '@/contexts/BookModalContext'
import { ProfileHeader, ProfileFormData, LibraryCard, ReviewCard } from '@/components/features'

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
  const [formData, setFormData] = useState<ProfileFormData>({
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
          <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center">
            <Users className="h-8 w-8 text-white animate-pulse" />
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
            <div className="w-24 h-24 bg-red-500 rounded flex items-center justify-center mx-auto mb-8">
              <Users className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold font-serif mb-4">User Not Found</h3>
            <p className="text-gray-600 mb-8">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
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
          <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center">
            <Users className="h-8 w-8 text-white animate-pulse" />
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
        <ProfileHeader
          userProfile={userProfile}
          isEditing={isEditing}
          formData={formData}
          isUploadingPicture={isUploadingPicture}
          isUpdatingProfile={updateProfileMutation.isLoading}
          onStartEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          onFollow={handleFollow}
          onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
          onProfilePictureUpload={handleProfilePictureUpload}
          isFollowLoading={followMutation.isLoading || unfollowMutation.isLoading}
        />

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
                <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
            ) : userLibrary && userLibrary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userLibrary.map((reading, index) => (
                  <LibraryCard 
                    key={reading.id} 
                    reading={reading} 
                    onBookClick={openBookModal}
                    priority={index < 6} // Priority loading for first 6 books (visible in initial grid)
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-lg font-semibold font-serif mb-4">No Books Found</h3>
                <p className="text-gray-600">
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
                <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center mx-auto">
                  <Star className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
            ) : userReviews && userReviews.length > 0 ? (
              <div className="space-y-6">
                {userReviews.map((reading, index) => (
                  <ReviewCard 
                    key={reading.id} 
                    reading={reading} 
                    onBookClick={openBookModal}
                    priority={index < 3} // Priority loading for first 3 reviews
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Star className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-lg font-semibold font-serif mb-4">No Reviews Yet</h3>
                <p className="text-gray-600">
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