import React from 'react'
import Image from 'next/image'
import { 
  Users, UserPlus, UserMinus, BookOpen, Calendar, MapPin, 
  User, Settings, Camera, Save 
} from 'lucide-react'
import { UserPublicProfile } from '@/lib/api'

export interface ProfileFormData {
  name: string
  username: string
  bio: string
  location: string
  reading_goal: number
  is_private: boolean
}

export interface ProfileHeaderProps {
  userProfile: UserPublicProfile
  isEditing: boolean
  formData: ProfileFormData
  isUploadingPicture: boolean
  isUpdatingProfile: boolean
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  onFollow: () => void
  onFormDataChange: (updates: Partial<ProfileFormData>) => void
  onProfilePictureUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  isFollowLoading?: boolean
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  isEditing,
  formData,
  isUploadingPicture,
  isUpdatingProfile,
  onStartEdit,
  onSave,
  onCancel,
  onFollow,
  onFormDataChange,
  onProfilePictureUpload,
  isFollowLoading = false
}) => {
  return (
    <div className="border border-gray-200 p-6 rounded bg-white mb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
        {/* Profile Picture */}
        <div className="relative inline-block flex-shrink-0">
          <div className="w-32 h-32 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
            {userProfile.profile_picture_url ? (
              <Image
                src={userProfile.profile_picture_url}
                alt={userProfile.username || userProfile.name}
                width={128}
                height={128}
                className="w-full h-full object-cover rounded"
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
                onChange={onProfilePictureUpload}
                className="hidden"
                id="profile-picture-input"
              />
              <button 
                type="button"
                onClick={() => document.getElementById('profile-picture-input')?.click()}
                disabled={isUploadingPicture}
                className="absolute bottom-0 right-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 transition-colors"
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
              {/* Username as Primary - Editable */}
              {isEditing && userProfile.can_edit ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => onFormDataChange({ username: e.target.value })}
                  className="text-3xl font-bold font-serif mb-2 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                  placeholder="username"
                />
              ) : (
                <h1 className="text-3xl font-bold font-serif mb-2">{userProfile.username || userProfile.name}</h1>
              )}
              
              {/* Display Name as Secondary - Editable */}
              {isEditing && userProfile.can_edit ? (
                <div className="mb-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => onFormDataChange({ name: e.target.value })}
                    className="text-sm text-gray-600 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                    placeholder="Display name"
                  />
                </div>
              ) : (
                userProfile.username && userProfile.name !== userProfile.username && (
                  <p className="text-sm text-gray-600 mb-2">{userProfile.name}</p>
                )
              )}
            </div>
            
            {/* Edit Profile / Follow Button */}
            {userProfile.can_edit ? (
              !isEditing ? (
                <button
                  onClick={onStartEdit}
                  className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={onCancel}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={isUpdatingProfile}
                    className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={onFollow}
                disabled={isFollowLoading}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                  userProfile.is_following
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {userProfile.is_following ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Follow</span>
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
                onChange={(e) => onFormDataChange({ bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-700"
                placeholder="Tell other readers about yourself..."
              />
            </div>
          ) : (
            userProfile.bio && (
              <p className="text-gray-700 mb-4">{userProfile.bio}</p>
            )
          )}

          {/* User Stats */}
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-sm text-gray-600 mb-4">
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
                    onChange={(e) => onFormDataChange({ reading_goal: parseInt(e.target.value) || 12 })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-center text-sm"
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
                  onChange={(e) => onFormDataChange({ location: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-sm"
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
            <div className="border border-gray-200 p-4 rounded bg-gray-50 mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Privacy Settings</h4>
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900 text-sm">Private Profile</h5>
                  <p className="text-xs text-gray-600">
                    Only approved followers can see your reading activity
                  </p>
                </div>
                <button
                  onClick={() => onFormDataChange({ is_private: !formData.is_private })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_private ? 'bg-gray-900' : 'bg-gray-200'
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
          <div className="flex items-center justify-center md:justify-start space-x-1 text-xs text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Joined {new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader 