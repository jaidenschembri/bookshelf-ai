import React from 'react'
import Image from 'next/image'
import { BookOpen, Star } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface RecommendationCardProps {
  recommendation: {
    id: number
    book: {
      id: number
      title: string
      author: string
      cover_url?: string
    }
    reason: string
    confidence_score: number
  }
  onClick?: () => void
  variant?: 'default' | 'compact'
  className?: string
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onClick,
  variant = 'default',
  className
}) => {
  const isCompact = variant === 'compact'
  
  return (
    <Card
      variant="default"
      clickable={!!onClick}
      onClick={onClick}
      padding="md"
      className={className}
    >
      <div className="flex items-start space-x-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          {recommendation.book.cover_url ? (
            <Image
              src={recommendation.book.cover_url}
              alt={recommendation.book.title}
              width={isCompact ? 32 : 40}
              height={isCompact ? 44 : 56}
              className={cn(
                'book-cover object-cover',
                isCompact ? 'w-8 h-11' : 'w-10 h-14'
              )}
              sizes={isCompact ? '32px' : '40px'}
            />
          ) : (
            <div className={cn(
              'bg-gray-200 border-2 border-black flex items-center justify-center',
              isCompact ? 'w-8 h-11' : 'w-10 h-14'
            )}>
              <BookOpen className={cn(
                'text-gray-600',
                isCompact ? 'h-3 w-3' : 'h-4 w-4'
              )} />
            </div>
          )}
        </div>
        
        {/* Recommendation Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-serif font-bold text-black hover:underline transition-colors',
            isCompact ? 'text-sm' : 'text-base'
          )}>
            {recommendation.book.title}
          </h3>
          <p className="text-caption text-gray-600 mb-3">{recommendation.book.author}</p>
          
          {!isCompact && (
            <p className="text-sm text-gray-700 line-clamp-3 mb-3">{recommendation.reason}</p>
          )}
          
          <div className="flex items-center space-x-2">
            <Badge
              variant="rating"
              size="sm"
              color="black"
              icon={<Star className="h-3 w-3" />}
            >
              {Math.round(recommendation.confidence_score * 100)}% MATCH
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default RecommendationCard 