import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { socialApi, SocialFeed, Reading } from '@/lib/api'
import { LoadingSpinner, BookCover } from '@/components/ui'
import { ActivityCard } from '@/components/social'
import { useSession } from 'next-auth/react'
import { Star, Heart, MessageCircle, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export interface ActivityFeedProps {
  onBookClick: (book: any, bookId?: number) => void
  isMobile?: boolean
  className?: string
}

// Streamlined Review Card for Feed
interface FeedReviewCardProps {
  reading: Reading
  onBookClick: (book: any, bookId?: number) => void
}

const FeedReviewCard: React.FC<FeedReviewCardProps> = ({
  reading,
  onBookClick
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="border-b border-gray-100 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {reading.user?.profile_picture_url ? (
              <Image
                src={reading.user.profile_picture_url}
                alt={reading.user.name || 'User'}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {reading.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Review by {reading.user?.name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500">{formatDate(reading.updated_at)}</p>
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex gap-3">
        <div className="flex-shrink-0 cursor-pointer" onClick={() => onBookClick(reading.book, reading.book.id)}>
          <BookCover
            src={reading.book.cover_url}
            alt={reading.book.title}
            width={48}
            height={64}
            className="rounded shadow-sm"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-sm text-gray-900 line-clamp-1 leading-tight cursor-pointer hover:text-black"
            onClick={() => onBookClick(reading.book, reading.book.id)}
          >
            {reading.book.title}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            by {reading.book.author}
          </p>
          
          {/* Rating */}
          {reading.rating && (
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < reading.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">{reading.rating}/5</span>
            </div>
          )}
          
          {/* Review Text */}
          {reading.review && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2 leading-relaxed">
              {reading.review}
            </p>
          )}
        </div>
      </div>

      {/* Social Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
            <Heart className="h-4 w-4" />
            <span className="text-xs">Like</span>
            {reading.like_count && reading.like_count > 0 && (
              <span className="text-xs text-gray-400">({reading.like_count})</span>
            )}
          </button>
          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Comment</span>
            {reading.comment_count && reading.comment_count > 0 && (
              <span className="text-xs text-gray-400">({reading.comment_count})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  onBookClick,
  isMobile = false,
  className = ''
}) => {
  const { data: session } = useSession()

  // Get real social feed data
  const { data: socialFeed, isLoading: feedLoading, error: feedError } = useQuery<SocialFeed>(
    ['social-feed'],
    () => socialApi.getFeed(10), // Limit to 10 items for dashboard
    {
      enabled: !!session?.user?.id,
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  return (
    <div className={className}>
      <div>
        <h2 className="text-lg font-semibold mb-6 text-black">Following</h2>
        
        {/* Scrollable Feed */}
        <div className={`space-y-4 ${isMobile ? 'max-h-none' : 'max-h-screen overflow-y-auto pr-2'}`}>
          {feedError ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Unable to load social feed</p>
              <p className="text-gray-500 text-xs mt-1">Check your connection and try again</p>
            </div>
          ) : feedLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : socialFeed ? (
            <>
              {/* Combine and sort all activities by date */}
              {[
                // Map reviews to activities
                ...socialFeed.recent_reviews.map(reading => ({
                  id: `review-${reading.id}`,
                  type: 'review' as const,
                  data: reading,
                  timestamp: reading.updated_at
                })),
                // Map activities
                ...socialFeed.activities.map(activity => ({
                  id: `activity-${activity.id}`,
                  type: 'activity' as const,
                  data: activity,
                  timestamp: activity.created_at
                }))
              ]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((item) => (
                  <div key={item.id}>
                    {item.type === 'review' ? (
                      <FeedReviewCard 
                        reading={item.data} 
                        onBookClick={onBookClick}
                      />
                    ) : (
                      <ActivityCard 
                        activity={item.data} 
                        onBookClick={onBookClick} 
                      />
                    )}
                  </div>
                ))}

              {/* Empty state for social feed */}
              {socialFeed.activities.length === 0 && 
               socialFeed.recent_reviews.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">No recent activity</p>
                  <p className="text-gray-500 text-xs mt-1">Follow users to see their reading activity</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No recent activity</p>
              <p className="text-gray-500 text-xs mt-1">Follow users to see their reading activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityFeed 