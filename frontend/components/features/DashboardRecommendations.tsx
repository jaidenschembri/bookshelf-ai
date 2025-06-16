import React from 'react'
import Link from 'next/link'
import { RecommendationCard } from '@/components/features'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { Recommendation } from '@/lib/api'

export interface DashboardRecommendationsProps {
  recommendations: Recommendation[]
  onBookClick: (book: any, bookId?: number) => void
  onAddToLibrary: (recommendation: Recommendation) => void
  onDismiss: (recommendationId: number) => void
  loadingStates: {
    adding: Set<number>
    dismissing: Set<number>
  }
  maxItems?: number
  className?: string
}

const DashboardRecommendations: React.FC<DashboardRecommendationsProps> = ({
  recommendations,
  onBookClick,
  onAddToLibrary,
  onDismiss,
  loadingStates,
  maxItems = 4,
  className = ''
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <ComponentErrorBoundary componentName="AI Recommendations">
      <div className={`mb-8 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-serif tracking-tight">AI Recommendations</h2>
          <Link 
            href="/recommendations" 
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.slice(0, maxItems).map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onBookClick={() => onBookClick(null, recommendation.book.id)}
              onAddToLibrary={() => onAddToLibrary(recommendation)}
              onDismiss={() => onDismiss(recommendation.id)}
              isAddingToLibrary={loadingStates.adding.has(recommendation.id)}
              isDismissing={loadingStates.dismissing.has(recommendation.id)}
              variant="compact"
            />
          ))}
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}

export default DashboardRecommendations 