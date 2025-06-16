import React from 'react'
import Link from 'next/link'
import { CheckCircle, Clock, Star, MessageCircle, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui'

export interface ActivityData {
  book_title?: string
  book_id?: number
  book_author?: string
  rating?: number
}

export interface Activity {
  id: number
  activity_type: string
  activity_data: ActivityData
  created_at: string
  user: {
    id: number
    name: string
  }
}

export interface ActivityCardProps {
  activity: Activity
  onBookClick: (book: any, bookId?: number) => void
  className?: string
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onBookClick,
  className = ''
}) => {
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
        onClick={() => onBookClick(null, bookId)}
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
    <div className={`flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0 ${className}`}>
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

export default ActivityCard 