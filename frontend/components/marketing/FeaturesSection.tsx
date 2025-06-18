import React from 'react'
import { LucideIcon, Users, BookOpen, TrendingUp, Zap } from 'lucide-react'

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
    icon: BookOpen,
    title: 'Personal Library Management',
    description: 'Organize your books with custom shelves, track reading progress, and maintain a complete record of your literary journey.'
  },
  {
    icon: Users,
    title: 'Social Reading Community',
    description: 'Follow friends, share reviews, see what others are reading, and discover books through your social network.'
  },
  {
    icon: TrendingUp,
    title: 'Reading Goals & Stats',
    description: 'Set annual reading goals, track your progress, and get insights into your reading habits and preferences.'
  },
  {
    icon: Zap,
    title: 'Smart Recommendations',
    description: 'Get personalized book suggestions powered by AI analysis of your reading history and community trends.'
  }
]

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  title = 'Everything You Need',
  subtitle = 'A complete platform for book lovers to track, share, and discover their next great read',
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