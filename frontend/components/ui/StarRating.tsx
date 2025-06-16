import React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showLabel = false,
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const starSize = sizeClasses[size]

  const handleStarClick = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue)
    }
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            disabled={readonly}
            className={cn(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
              star <= rating
                ? 'text-yellow-400'
                : readonly 
                  ? 'text-gray-300' 
                  : 'text-gray-300 hover:text-yellow-400'
            )}
            type="button"
          >
            <Star className={cn(starSize, 'fill-current')} />
          </button>
        ))}
      </div>
      
      {showLabel && rating > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          {rating} out of 5 stars
        </span>
      )}
    </div>
  )
}

export default StarRating 