import React from 'react'

export interface Step {
  number: string
  title: string
  description: string
}

export interface HowItWorksSectionProps {
  title?: string
  subtitle?: string
  steps?: Step[]
  className?: string
}

const defaultSteps: Step[] = [
  {
    number: '01',
    title: 'Create Account',
    description: 'Sign up with Google and set up your reading profile and goals'
  },
  {
    number: '02',
    title: 'Build Your Library',
    description: 'Add books you\'ve read, are reading, or want to read to your personal library'
  },
  {
    number: '03',
    title: 'Connect & Share',
    description: 'Follow other readers, share reviews, and see what your friends are reading'
  },
  {
    number: '04',
    title: 'Discover & Explore',
    description: 'Get book recommendations from your network and AI-powered suggestions'
  }
]

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  title = 'How It Works',
  subtitle = 'Join thousands of readers building their digital libraries and discovering great books together',
  steps = defaultSteps,
  className = ''
}) => {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-6">{title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded flex items-center justify-center mx-auto mb-6 text-xl font-bold font-serif">
                {step.number}
              </div>
              <h4 className="text-lg font-semibold font-serif mb-3">{step.title}</h4>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection 