import React from 'react'
import { BookOpen } from 'lucide-react'

export interface FooterProps {
  className?: string
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`bg-gray-50 border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-5 w-5 mr-2 text-gray-600" />
            <span className="font-serif font-semibold text-lg text-gray-900">Libraria</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Discover your next favorite book with AI-powered personalized recommendations.
          </p>
          <p className="text-xs text-gray-400">
            © 2024 Libraria • Literature Meets Technology
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 