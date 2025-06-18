import React from 'react'
import { Zap } from 'lucide-react'

export interface HeroSectionProps {
  onGetStarted: () => void
  className?: string
}

const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  className = ''
}) => {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight mb-8">
            Track, Share & Discover<br />
            <span className="text-gray-600">Your Reading Journey</span>
          </h1>
          
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-lg text-gray-600 mb-8">
              The social book tracker that helps you organize your library, connect with fellow readers, 
              and discover your next great read through community insights and smart recommendations.
            </p>
            <div className="border-l-4 border-gray-300 pl-6 py-4 bg-gray-50 rounded-r">
              <p className="text-lg italic font-serif text-gray-700">
                "A reader lives a thousand lives before he dies... The man who never reads lives only one."
              </p>
              <p className="text-sm text-gray-500 mt-2">— George R.R. Martin</p>
            </div>
          </div>
          
          <div className="flex justify-center mb-16">
            <button
              onClick={onGetStarted}
              className="bg-gray-900 text-white px-8 py-4 rounded text-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-3"
            >
              <span>Get Started Free</span>
              <Zap className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection 