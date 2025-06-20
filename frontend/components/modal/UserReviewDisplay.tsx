import React from 'react'
import { Reading } from '@/lib/api'
import { StarRating, Button } from '@/components/ui'
import { Eye, EyeOff } from 'lucide-react'

export interface UserReviewDisplayProps {
  reading: Reading
  onEditClick: () => void
  className?: string
}

const UserReviewDisplay: React.FC<UserReviewDisplayProps> = ({
  reading,
  onEditClick,
  className
}) => {
  if (!reading.review) return null

  return (
    <div className={className}>
      <div className="border-t border-gray-200 pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold font-serif text-gray-900">My Review</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            className="flex-shrink-0"
          >
            Edit
          </Button>
        </div>
        
        {reading.rating && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <StarRating
                rating={reading.rating}
                readonly
                size="sm"
              />
              <span className="text-sm text-gray-600">({reading.rating}/5)</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {reading.is_review_public ? (
                <>
                  <Eye className="h-3 w-3 flex-shrink-0" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 flex-shrink-0" />
                  <span>Private</span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 p-3 sm:p-4 rounded border border-gray-200">
          <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base leading-relaxed">{reading.review}</p>
        </div>
      </div>
    </div>
  )
}

export default UserReviewDisplay 