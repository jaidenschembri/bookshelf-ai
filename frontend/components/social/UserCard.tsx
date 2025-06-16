import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { UserPublicProfile } from '@/lib/api'

export interface UserCardProps {
  user: UserPublicProfile
  onFollow: (userId: number, isFollowing: boolean) => void
  isLoading?: boolean
  className?: string
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onFollow,
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`border border-gray-200 p-4 rounded ${className}`}>
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

export default UserCard 