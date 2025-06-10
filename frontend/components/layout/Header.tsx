import React from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b-8 border-black">
      <div className="container-brutalist">
        <div className="flex justify-between items-center py-8">
          <div className="flex items-center group">
            <div className="p-3 border-4 border-black bg-black text-white group-hover:bg-white group-hover:text-black transition-all duration-200">
              <BookOpen className="h-10 w-10" />
            </div>
            <div className="ml-4">
              <span className="text-3xl font-black font-serif tracking-tight">BOOKSHELF</span>
              <div className="text-xs font-mono uppercase tracking-ultra-wide text-gray-600">AI POWERED</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 