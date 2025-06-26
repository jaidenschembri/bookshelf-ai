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
    <section className={`section-spacing ${className}`}>
      <div className="content-container-narrow">
        <div className="text-center">
          <h1 className="text-display mb-12">
            Track, Share & Discover<br />
            <span className="text-slate-500">Your Reading Journey</span>
          </h1>
          
          <div className="max-w-2xl mx-auto mb-16">
            <p className="text-body-large mb-12">
              The social book tracker that helps you organize your library, connect with fellow readers, 
              and discover your next great read through community insights and smart recommendations.
            </p>
            <div className="border-l-4 border-slate-300 pl-8 py-8 bg-white rounded-r-xl shadow-sm">
              <p className="text-lg italic font-serif text-slate-700 leading-relaxed">
                "A reader lives a thousand lives before he dies... The man who never reads lives only one."
              </p>
              <p className="text-caption mt-4">— George R.R. Martin</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={onGetStarted}
              className="bg-slate-800 text-white px-10 py-5 rounded-xl text-lg font-medium hover:bg-slate-900 transition-all duration-200 shadow-lg flex items-center space-x-4"
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