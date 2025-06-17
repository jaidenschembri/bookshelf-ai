import React from 'react'
import Image from 'next/image'
import { BookOpen, Star, X, Brain } from 'lucide-react'
import { Badge, BookCover } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface RecommendationCardProps {
  recommendation: {
    id: number
    book: {
      id: number
      title: string
      author: string
      cover_url?: string
      genre?: string
      publication_year?: number
      description?: string
    }
    reason: string
    confidence_score: number
  }
  onBookClick: () => void
  onAddToLibrary: () => void
  onDismiss: () => void
  isAddingToLibrary: boolean
  isDismissing: boolean
  variant?: 'default' | 'compact'
  priority?: boolean
  className?: string
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onBookClick,
  onAddToLibrary,
  onDismiss,
  isAddingToLibrary,
  isDismissing,
  variant = 'default',
  priority = false,
  className
}) => {
  const isCompact = variant === 'compact'
  
  return (
    <div className={cn("relative border border-gray-200 p-4 rounded", className)}>
      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        title="Dismiss recommendation"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <BookCover
            src={recommendation.book.cover_url}
            alt={recommendation.book.title}
            width={isCompact ? 48 : 80}
            height={isCompact ? 64 : 112}
            rounded={true}
            lazy={!priority}
            priority={priority}
            className={cn(
              isCompact ? 'w-12 h-16' : 'w-20 h-28'
            )}
          />
        </div>

        {/* Book Details and Recommendation */}
        <div className="flex-1 min-w-0 pr-6">
          {/* Book Info */}
          <div className="mb-3">
            <h3 className={cn(
              'font-serif font-medium mb-1',
              isCompact ? 'text-sm' : 'text-base'
            )}>
              <button
                onClick={onBookClick}
                className="text-gray-900 hover:underline transition-colors text-left"
              >
                {recommendation.book.title}
              </button>
            </h3>
            <p className="text-xs text-gray-500 mb-2">by {recommendation.book.author}</p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {recommendation.book.genre && (
                <Badge variant="genre" size="sm">
                  {recommendation.book.genre}
                </Badge>
              )}
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 mr-1" />
                <span>{Math.round(recommendation.confidence_score * 100)}% match</span>
              </div>
            </div>
          </div>

          {/* AI Explanation */}
          {!isCompact && (
            <div className="bg-gray-50 p-3 rounded mb-3">
              <div className="flex items-start space-x-2">
                <Brain className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">AI Recommendation:</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {recommendation.reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onAddToLibrary}
              disabled={isAddingToLibrary}
              className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isAddingToLibrary ? 'Adding...' : 'Add to Library'}
            </button>
            <button
              onClick={onDismiss}
              disabled={isDismissing}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {isDismissing ? 'Dismissing...' : 'Not Interested'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecommendationCard
export { RecommendationCard } 