import React, { useState, useEffect, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { socialApi, SocialFeed, Reading } from '@/lib/api'
import { LoadingSpinner, BookCover } from '@/components/ui'
import { ActivityCard } from '@/components/social'
import { useSession } from 'next-auth/react'
import { Star, Heart, MessageCircle, ChevronDown, ChevronUp, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export interface ActivityFeedProps {
  onBookClick: (book: any, bookId?: number) => void
  isMobile?: boolean
  className?: string
}

// Grouped Activity Card for similar actions
interface GroupedActivityCardProps {
  user: {
    id: number
    name: string
    username?: string
    profile_picture_url?: string
  }
  activities: any[]
  onBookClick: (book: any, bookId?: number) => void
}

const GroupedActivityCard: React.FC<GroupedActivityCardProps> = ({
  user,
  activities,
  onBookClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const getGroupedActivityText = () => {
    const activityType = activities[0].activity_type
    const count = activities.length
    
    switch (activityType) {
      case 'finished_book':
        return count === 1 ? 'finished reading' : `finished reading ${count} books`
      case 'started_book':
        return count === 1 ? 'started reading' : `started reading ${count} books`
      case 'rated_book':
        return count === 1 ? 'rated' : `rated ${count} books`
      case 'want_to_read':
        return count === 1 ? 'wants to read' : `added ${count} books to want to read`
      default:
        return count === 1 ? 'updated' : `made ${count} updates`
    }
  }

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

  const showFirstBook = activities[0]
  const remainingCount = activities.length - 1
  
  // Get display name - prefer username, fallback to name
  const displayName = user.username || user.name

  return (
    <div className="border-b border-gray-100 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Link href={`/user/${user.id}`} className="block">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-gray-300 transition-all">
            {user.profile_picture_url ? (
              <Image
                src={user.profile_picture_url}
                alt={displayName}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {displayName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
        </Link>
        <div>
          <p className="text-sm font-medium text-gray-900">
            <Link href={`/user/${user.id}`} className="font-medium hover:underline transition-colors">
              {displayName}
            </Link> {getGroupedActivityText()}
          </p>
          <p className="text-xs text-gray-500">{formatDate(activities[0].created_at)}</p>
        </div>
      </div>

      {/* First Book */}
      <div className="flex gap-3 mb-3">
        <div className="flex-shrink-0 cursor-pointer" 
             onClick={() => onBookClick(null, showFirstBook.activity_data.book_id)}>
          <BookCover
            key={`main-cover-${showFirstBook.id}-${showFirstBook.activity_data.book_id}`}
            src={showFirstBook.activity_data.book_cover_url}
            alt={showFirstBook.activity_data.book_title}
            width={48}
            height={64}
            className="rounded shadow-sm"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-sm text-gray-900 line-clamp-1 leading-tight cursor-pointer hover:text-black"
            onClick={() => onBookClick(null, showFirstBook.activity_data.book_id)}
          >
            {showFirstBook.activity_data.book_title}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            by {showFirstBook.activity_data.book_author}
          </p>
          
          {showFirstBook.activity_data.rating && (
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`main-star-${showFirstBook.id}-${i}`}
                  className={`h-3 w-3 ${
                    i < showFirstBook.activity_data.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">{showFirstBook.activity_data.rating}/5</span>
            </div>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      {remainingCount > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3 focus:outline-none"
          style={{ border: 'none', outline: 'none' }}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isExpanded ? 'Show less' : `Show ${remainingCount} more`}
        </button>
      )}

      {/* Expanded Books */}
      {isExpanded && remainingCount > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-gray-100">
          {activities.slice(1).map((activity, index) => (
            <div key={`${activity.id}-${activity.activity_data.book_id}-${index}`} className="flex gap-3">
              <div className="flex-shrink-0 cursor-pointer" 
                   onClick={() => onBookClick(null, activity.activity_data.book_id)}>
                <BookCover
                  key={`expanded-cover-${activity.id}-${activity.activity_data.book_id}`}
                  src={activity.activity_data.book_cover_url}
                  alt={activity.activity_data.book_title}
                  width={32}
                  height={48}
                  className="rounded shadow-sm"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-medium text-xs text-gray-900 line-clamp-1 cursor-pointer hover:text-black"
                  onClick={() => onBookClick(null, activity.activity_data.book_id)}
                >
                  {activity.activity_data.book_title}
                </h4>
                <p className="text-xs text-gray-500">
                  by {activity.activity_data.book_author}
                </p>
                
                {activity.activity_data.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={`star-${activity.id}-${i}`}
                        className={`h-2 w-2 ${
                          i < activity.activity_data.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{activity.activity_data.rating}/5</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
  const [isReviewExpanded, setIsReviewExpanded] = useState(false)
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

  // Get display name - prefer username, fallback to name
  const displayName = reading.user?.username || reading.user?.name || 'Anonymous'

  return (
    <div className="border-b border-gray-100 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Link href={`/user/${reading.user?.id}`} className="block">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-gray-300 transition-all">
            {reading.user?.profile_picture_url ? (
              <Image
                src={reading.user.profile_picture_url}
                alt={displayName}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {displayName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
        </Link>
        <div>
          <p className="text-sm font-medium text-gray-900">
            Review by <Link href={`/user/${reading.user?.id}`} className="font-medium hover:underline transition-colors">
              {displayName}
            </Link>
          </p>
          <p className="text-xs text-gray-500">{formatDate(reading.updated_at)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-3">
        <div className="flex-shrink-0 cursor-pointer" onClick={() => onBookClick(reading.book, reading.book.id)}>
          <BookCover
            key={`review-cover-${reading.id}-${reading.book.id}`}
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
                  key={`review-star-${reading.id}-${i}`}
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
            <div className="mt-2">
              <p className={`text-sm text-gray-700 leading-relaxed ${
                !isReviewExpanded && reading.review.length > 200 ? 'line-clamp-3' : ''
              }`}>
                {reading.review}
              </p>
              {reading.review.length > 200 && (
                <button
                  onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                  className="text-xs text-slate-500 hover:text-slate-700 mt-1 font-medium focus:outline-none"
                  style={{ border: 'none', outline: 'none' }}
                >
                  {isReviewExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
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

  // Infinite scroll feed data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading,
    error: feedError
  } = useInfiniteQuery({
    queryKey: ['social-feed'],
    queryFn: ({ pageParam = 0 }) => socialApi.getFeed(20, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than 20 items, we've reached the end
      const totalActivities = lastPage.activities.length + lastPage.recent_reviews.length
      if (totalActivities < 20) return undefined
      return allPages.length * 20
    },
    enabled: !!session?.user?.id,
    refetchOnWindowFocus: false,
    retry: false,
  })

  // Combine all pages into a single feed
  const socialFeed = data?.pages.reduce(
    (acc, page) => ({
      activities: [...acc.activities, ...page.activities],
      recent_reviews: [...acc.recent_reviews, ...page.recent_reviews]
    }),
    { activities: [], recent_reviews: [] }
  )

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (isMobile) return // Skip for mobile
    
    const scrollContainer = document.querySelector('[data-scroll-container="activity-feed"]')
    if (!scrollContainer) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const threshold = 100 // Load more when 100px from bottom
    
    if (scrollHeight - scrollTop - clientHeight < threshold && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isMobile])

  // Add scroll listener
  useEffect(() => {
    if (isMobile) return
    
    const scrollContainer = document.querySelector('[data-scroll-container="activity-feed"]')
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [handleScroll, isMobile])

  return (
    <div className={className}>
      <div>
        <h2 className="text-lg font-semibold mb-6 text-black">Following</h2>
        
        {/* Scrollable Feed */}
        <div 
          className={`space-y-4 ${isMobile ? 'max-h-none' : 'max-h-screen overflow-y-auto pr-2'}`}
          data-scroll-container="activity-feed"
        >
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
              {(() => {
                // Group activities by user and activity type
                const activitiesMap = new Map()
                const reviewsArray: any[] = []
                
                // Add reviews
                socialFeed.recent_reviews.forEach(reading => {
                  reviewsArray.push({
                    id: `review-${reading.id}`,
                    type: 'review',
                    data: reading,
                    timestamp: reading.updated_at
                  })
                })
                
                // Group activities by user_id and activity_type
                socialFeed.activities
                  .filter(activity => 
                    !['reviewed_book', 'added_review'].includes(activity.activity_type)
                  )
                  .forEach(activity => {
                    const key = `${activity.user.id}-${activity.activity_type}`
                    if (!activitiesMap.has(key)) {
                      activitiesMap.set(key, {
                        id: `grouped-${key}`,
                        type: 'grouped_activity',
                        user: activity.user,
                        activities: [],
                        timestamp: activity.created_at
                      })
                    }
                    activitiesMap.get(key).activities.push(activity)
                    // Update timestamp to latest activity
                    if (new Date(activity.created_at) > new Date(activitiesMap.get(key).timestamp)) {
                      activitiesMap.get(key).timestamp = activity.created_at
                    }
                  })
                
                // Combine reviews and grouped activities
                const allItems = [
                  ...reviewsArray,
                  ...Array.from(activitiesMap.values())
                ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                
                return allItems.map((item) => (
                  <div key={item.id}>
                    {item.type === 'review' ? (
                      <FeedReviewCard 
                        reading={item.data} 
                        onBookClick={onBookClick}
                      />
                    ) : item.type === 'grouped_activity' ? (
                      <GroupedActivityCard 
                        user={item.user}
                        activities={item.activities}
                        onBookClick={onBookClick}
                      />
                    ) : (
                      <ActivityCard 
                        activity={item.data} 
                        onBookClick={onBookClick} 
                      />
                    )}
                  </div>
                ))
              })()}

              {/* Empty state for social feed */}
              {socialFeed.activities.length === 0 && 
               socialFeed.recent_reviews.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">No recent activity</p>
                  <p className="text-gray-500 text-xs mt-1">Follow users to see their reading activity</p>
                </div>
              )}

              {/* Infinite scroll loading indicator */}
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <LoadingSpinner size="sm" />
                  <p className="text-gray-400 text-xs mt-2">Loading more...</p>
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