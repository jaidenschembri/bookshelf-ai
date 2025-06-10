import React from 'react'
import Image from 'next/image'
import { BookOpen, Star, X, Brain } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
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
  className
}) => {
  const isCompact = variant === 'compact'
  
  return (
    <Card variant="default" padding="lg" className={cn("relative", className)}>
      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 z-10"
        title="Dismiss recommendation"
      >
        <X className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Book Cover */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {recommendation.book.cover_url ? (
            <Image
              src={recommendation.book.cover_url}
              alt={recommendation.book.title}
              width={120}
              height={160}
              className="rounded-lg object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{ width: '120px', height: 'auto' }}
              sizes="120px"
            />
          ) : (
            <div className="w-30 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Book Details and Recommendation */}
        <div className="flex-1 min-w-0 sm:pr-8">
          {/* Book Info */}
          <div className="mb-4 text-center sm:text-left">
            <h3 className="heading-lg mb-2">
              <button
                onClick={onBookClick}
                className="text-black hover:underline text-left transition-colors"
              >
                {recommendation.book.title}
              </button>
            </h3>
            <p className="text-body text-gray-600 mb-2">by {recommendation.book.author}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm text-gray-500">
              {recommendation.book.genre && (
                <Badge variant="default" size="sm">
                  {recommendation.book.genre}
                </Badge>
              )}
              {recommendation.book.publication_year && (
                <span>{recommendation.book.publication_year}</span>
              )}
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span>{Math.round(recommendation.confidence_score * 100)}% match</span>
              </div>
            </div>
          </div>

          {/* AI Explanation */}
          <Card variant="flat" padding="md" className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-2">
              <Brain className="h-5 w-5 text-black flex-shrink-0 mx-auto sm:mx-0 sm:mt-0.5" />
              <div className="text-center sm:text-left">
                <h4 className="heading-sm text-black mb-2">Why we recommend this book:</h4>
                <p className="text-caption text-gray-600">
                  {recommendation.reason}
                </p>
              </div>
            </div>
          </Card>

          {/* Book Description - Only show if different from AI reason */}
          {recommendation.book.description && 
           recommendation.book.description !== recommendation.reason && (
            <div className="mb-4">
              <h4 className="heading-sm text-black mb-2">About this book:</h4>
              <p className="text-caption text-gray-600 line-clamp-4">
                {recommendation.book.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onAddToLibrary}
              variant="primary"
              size="sm"
              disabled={isAddingToLibrary}
              loading={isAddingToLibrary}
              className="w-full sm:w-auto"
            >
              {isAddingToLibrary ? 'Adding...' : 'Add to Library'}
            </Button>
            <Button
              onClick={onDismiss}
              variant="secondary"
              size="sm"
              disabled={isDismissing}
              loading={isDismissing}
              className="w-full sm:w-auto"
            >
              {isDismissing ? 'Dismissing...' : 'Not Interested'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default RecommendationCard
export { RecommendationCard } 