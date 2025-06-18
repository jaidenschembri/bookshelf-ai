import React from 'react'
import { LucideIcon, Users } from 'lucide-react'

export interface CTASectionProps {
  title?: string
  subtitle?: string
  buttonText?: string
  buttonIcon?: LucideIcon
  onButtonClick: () => void
  isDarkTheme?: boolean
  className?: string
}

const CTASection: React.FC<CTASectionProps> = ({
  title = 'Ready to Join the Community?',
  subtitle = 'Connect with fellow book lovers, track your reading progress, and discover your next great read through our social platform.',
  buttonText = 'Start Your Library',
  buttonIcon: ButtonIcon = Users,
  onButtonClick,
  isDarkTheme = true,
  className = ''
}) => {
  const sectionClasses = isDarkTheme 
    ? 'py-16 md:py-24 bg-gray-900 text-white'
    : 'py-16 md:py-24 bg-gray-50 text-gray-900'
  
  const subtitleClasses = isDarkTheme 
    ? 'text-lg text-gray-300 mb-12 max-w-2xl mx-auto'
    : 'text-lg text-gray-600 mb-12 max-w-2xl mx-auto'
  
  const buttonClasses = isDarkTheme
    ? 'bg-white text-gray-900 px-8 py-4 rounded text-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-3'
    : 'bg-gray-900 text-white px-8 py-4 rounded text-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-3'

  return (
    <section className={`${sectionClasses} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-6">{title}</h2>
        <p className={subtitleClasses}>
          {subtitle}
        </p>
        <div className="flex justify-center">
          <button
            onClick={onButtonClick}
            className={buttonClasses}
          >
            <span>{buttonText}</span>
            <ButtonIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default CTASection 