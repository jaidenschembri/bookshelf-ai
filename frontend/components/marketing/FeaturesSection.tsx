import React from 'react'
import { LucideIcon, Brain, TrendingUp, Star } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface FeaturesSectionProps {
  title?: string
  subtitle?: string
  features?: Feature[]
  className?: string
}

const defaultFeatures: Feature[] = [
  {
    icon: Brain,
    title: 'AI-Powered Recommendations',
    description: 'Our advanced artificial intelligence analyzes your reading history, preferences, and ratings to suggest books you\'ll absolutely love.'
  },
  {
    icon: TrendingUp,
    title: 'Reading Progress Tracking',
    description: 'Set reading goals, monitor your progress with visual charts, and celebrate your literary achievements along the way.'
  },
  {
    icon: Star,
    title: 'Rate & Review System',
    description: 'Rate books, write detailed reviews, and help improve your personalized recommendations with every interaction.'
  }
]

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  title = 'Powerful Features',
  subtitle = 'Everything you need to discover, track, and enjoy your reading journey',
  features = defaultFeatures,
  className = ''
}) => {
  return (
    <section className={`py-16 md:py-24 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-6">{title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="border border-gray-200 p-6 rounded bg-white">
              <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold font-serif mb-4">{feature.title}</h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection 