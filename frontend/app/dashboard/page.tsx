'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import { dashboardApi, Dashboard } from '@/lib/api'
import { BookOpen, Target, TrendingUp, Star, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useBookModal } from '@/contexts/BookModalContext'
import { 
  Button, 
  Card, 
  Badge, 
  LoadingSpinner,
  BookCard,
  StatCard,
  ProgressCard,
  RecommendationCard
} from '@/components/ui'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { openBookModal } = useBookModal()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  const { data: dashboard, isLoading, error } = useQuery<Dashboard>(
    ['dashboard', session?.user?.id],
    () => dashboardApi.get(),
    {
      enabled: !!session?.user?.id && !!session?.accessToken,
      refetchOnWindowFocus: false,
    }
  )

  if (status === 'loading' || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Loading your dashboard..." />
        </div>
      </Layout>
    )
  }

  if (error || !dashboard) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-8">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <h2 className="heading-md mb-6">WELCOME TO BOOKSHELF AI!</h2>
            <p className="text-body mb-8">Start by adding some books to your library to see your personalized dashboard.</p>
            <Button size="lg" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
              <Link href="/search">Search for Books</Link>
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const { user, stats, recent_readings, current_books, recent_recommendations } = dashboard

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-12">
          <h1 className="heading-lg mb-4">WELCOME BACK, {user.name?.toUpperCase()}!</h1>
          <p className="text-body text-gray-600">Here's your reading progress and personalized recommendations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={BookOpen}
            label="BOOKS READ"
            value={stats.total_books}
          />
          
          <StatCard
            icon={Target}
            label="THIS YEAR"
            value={stats.books_this_year}
            subtitle={`GOAL: ${stats.reading_goal}`}
          />
          
          <StatCard
            icon={Clock}
            label="CURRENTLY READING"
            value={stats.currently_reading}
          />
          
          <StatCard
            icon={Star}
            label="AVG RATING"
            value={stats.average_rating ? `${stats.average_rating}★` : 'N/A'}
          />
        </div>

        {/* Reading Goal Progress */}
        <ProgressCard
          title="READING GOAL PROGRESS"
          progress={stats.goal_progress}
          description={`${stats.books_this_year} of ${stats.reading_goal} books read this year`}
          className="mb-12"
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Currently Reading */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="heading-sm">CURRENTLY READING</h3>
              <Link href="/books" className="btn-ghost">
                View All
              </Link>
            </div>
            {current_books.length > 0 ? (
              <div className="space-y-4">
                {current_books.slice(0, 3).map((reading) => (
                  <BookCard
                    key={reading.id}
                    book={reading.book}
                    reading={{
                      status: reading.status,
                      progress_pages: reading.progress_pages,
                      total_pages: reading.total_pages
                    }}
                    onClick={() => openBookModal(null, reading.book.id)}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <Card variant="flat" padding="lg">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <p className="text-body text-gray-500 mb-4">No books currently being read</p>
                  <Button variant="ghost" size="sm">
                    <Link href="/search">Find a book to read</Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="heading-sm">AI RECOMMENDATIONS</h3>
              <Link href="/recommendations" className="btn-ghost">
                View All
              </Link>
            </div>
            {recent_recommendations.length > 0 ? (
              <div className="space-y-4">
                {recent_recommendations.slice(0, 2).map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onClick={() => openBookModal(null, rec.book.id)}
                  />
                ))}
              </div>
            ) : (
              <Card variant="flat" padding="lg">
                <div className="text-center">
                  <Star className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <p className="text-body text-gray-500 mb-2">No recommendations yet</p>
                  <p className="text-caption text-gray-400 mb-6">
                    Add and rate some books to get AI recommendations
                  </p>
                  <Button variant="ghost" size="sm">
                    <Link href="/search">Add books to your library</Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <Card variant="default" padding="lg" className="mt-12">
          <h3 className="heading-sm mb-6">RECENT ACTIVITY</h3>
          {recent_readings.length > 0 ? (
            <div className="space-y-4">
              {recent_readings.slice(0, 5).map((reading) => (
                <div key={reading.id} className="flex items-center space-x-4 py-4 border-b-2 border-gray-200 last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-black flex items-center justify-center">
                      {reading.status === 'finished' ? (
                        <CheckCircle className="h-5 w-5 text-black" />
                      ) : reading.status === 'currently_reading' ? (
                        <Clock className="h-5 w-5 text-black" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-black" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-black">
                      <button
                        onClick={() => openBookModal(null, reading.book.id)}
                        className="font-serif font-bold hover:underline transition-colors"
                      >
                        {reading.book.title}
                      </button> by {reading.book.author}
                    </p>
                    <p className="text-caption text-gray-600">
                      {reading.status === 'finished' ? 'FINISHED READING' : 
                       reading.status === 'currently_reading' ? 'STARTED READING' : 
                       'ADDED TO WANT TO READ'}
                    </p>
                  </div>
                  {reading.rating && (
                    <Badge variant="rating" size="sm" color="black" rating={reading.rating} />
                  )}
                </div>
              ))}
            </div>
                      ) : (
              <Card variant="flat" padding="lg">
                <div className="text-center">
                  <p className="text-body text-gray-500">No recent activity</p>
                </div>
              </Card>
            )}
          </Card>
      </div>
    </Layout>
  )
} 