import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
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
    profile_picture_url?: string
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
        <Link href={`/user/${activity.user.id}`} className="block">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {activity.user.profile_picture_url ? (
              <Image
                src={activity.user.profile_picture_url}
                alt={activity.user.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </Link>
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