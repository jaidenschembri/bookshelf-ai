'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Home, Star } from 'lucide-react'
import Header from './layout/Header'
import Footer from './layout/Footer'
import type { NavigationItem } from './layout/NavigationLinks'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Books', href: '/books', icon: BookOpen },
    { name: 'Discover', href: '/discover', icon: Star },
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        navigationItems={navigation}
        user={session?.user}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="content-container py-8 lg:py-12">
        {children}
      </main>

      <Footer />
    </div>
  )
} 