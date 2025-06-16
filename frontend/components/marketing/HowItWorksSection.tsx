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
    title: 'Sign In',
    description: 'Create your account securely with Google OAuth authentication'
  },
  {
    number: '02',
    title: 'Add Books',
    description: 'Search our extensive database and add books you\'ve read or want to read'
  },
  {
    number: '03',
    title: 'Rate & Review',
    description: 'Share your thoughts and ratings to help our AI understand your taste'
  },
  {
    number: '04',
    title: 'Get Recommendations',
    description: 'Receive personalized AI-powered book suggestions tailored just for you'
  }
]

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  title = 'How It Works',
  subtitle = 'Four simple steps to unlock your personalized reading experience',
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