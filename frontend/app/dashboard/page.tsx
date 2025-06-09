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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
          <div className="loading-brutalist">
            <div className="w-32 h-32 border-8 border-black bg-white flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-black" />
            </div>
          </div>
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
            <Link href="/search" className="btn-primary inline-flex items-center space-x-2">
              <span>Search for Books</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
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
          <div className="card-flat">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="ml-6">
                <p className="text-caption text-gray-600 mb-1">BOOKS READ</p>
                <p className="text-4xl font-black font-serif">{stats.total_books}</p>
              </div>
            </div>
          </div>

          <div className="card-flat">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center">
                <Target className="h-8 w-8" />
              </div>
              <div className="ml-6">
                <p className="text-caption text-gray-600 mb-1">THIS YEAR</p>
                <p className="text-4xl font-black font-serif">{stats.books_this_year}</p>
                <p className="text-caption text-gray-500">GOAL: {stats.reading_goal}</p>
              </div>
            </div>
          </div>

          <div className="card-flat">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center">
                <Clock className="h-8 w-8" />
              </div>
              <div className="ml-6">
                <p className="text-caption text-gray-600 mb-1">CURRENTLY READING</p>
                <p className="text-4xl font-black font-serif">{stats.currently_reading}</p>
              </div>
            </div>
          </div>

          <div className="card-flat">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center">
                <Star className="h-8 w-8" />
              </div>
              <div className="ml-6">
                <p className="text-caption text-gray-600 mb-1">AVG RATING</p>
                <p className="text-4xl font-black font-serif">
                  {stats.average_rating ? `${stats.average_rating}★` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Goal Progress */}
        <div className="card mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-sm">READING GOAL PROGRESS</h3>
            <span className="text-caption">{stats.goal_progress.toFixed(1)}% COMPLETE</span>
          </div>
          <div className="progress-bar mb-4">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(stats.goal_progress, 100)}%` }}
            ></div>
          </div>
          <p className="text-body text-gray-600">
            {stats.books_this_year} of {stats.reading_goal} books read this year
          </p>
        </div>

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
              <div className="space-y-6">
                {current_books.slice(0, 3).map((reading) => (
                  <div key={reading.id} className="flex items-center space-x-4 p-4 border-2 border-black">
                    <div className="flex-shrink-0">
                      {reading.book.cover_url ? (
                        <Image
                          src={reading.book.cover_url}
                          alt={reading.book.title}
                          width={48}
                          height={64}
                          className="book-cover"
                          style={{ width: '48px', height: 'auto' }}
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-200 border-2 border-black flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-bold text-lg text-black truncate">
                        {reading.book.title}
                      </p>
                      <p className="text-caption text-gray-600">{reading.book.author}</p>
                      {reading.total_pages && (
                        <div className="mt-3">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${(reading.progress_pages / reading.total_pages) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-caption text-gray-500 mt-2">
                            {reading.progress_pages} / {reading.total_pages} PAGES
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-black">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <p className="text-body text-gray-500 mb-4">No books currently being read</p>
                <Link href="/search" className="btn-ghost">
                  Find a book to read
                </Link>
              </div>
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
              <div className="space-y-6">
                {recent_recommendations.slice(0, 2).map((rec) => (
                  <div key={rec.id} className="border-4 border-black p-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {rec.book.cover_url ? (
                          <Image
                            src={rec.book.cover_url}
                            alt={rec.book.title}
                            width={40}
                            height={56}
                            className="book-cover"
                            style={{ width: '40px', height: 'auto' }}
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-gray-200 border-2 border-black flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-bold text-black">{rec.book.title}</p>
                        <p className="text-caption text-gray-600 mb-3">{rec.book.author}</p>
                        <p className="text-sm text-gray-700 line-clamp-3 mb-3">{rec.reason}</p>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-black mr-2" />
                          <span className="text-caption">
                            {Math.round(rec.confidence_score * 100)}% MATCH
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-black">
                <Star className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <p className="text-body text-gray-500 mb-2">No recommendations yet</p>
                <p className="text-caption text-gray-400 mb-6">
                  Add and rate some books to get AI recommendations
                </p>
                <Link href="/search" className="btn-ghost">
                  Add books to your library
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mt-12">
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
                      <span className="font-serif font-bold">{reading.book.title}</span> by {reading.book.author}
                    </p>
                    <p className="text-caption text-gray-600">
                      {reading.status === 'finished' ? 'FINISHED READING' : 
                       reading.status === 'currently_reading' ? 'STARTED READING' : 
                       'ADDED TO WANT TO READ'}
                    </p>
                  </div>
                  {reading.rating && (
                    <div className="flex items-center space-x-2 px-3 py-1 border-2 border-black">
                      <Star className="h-4 w-4 text-black" />
                      <span className="font-mono font-bold">{reading.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-black">
              <p className="text-body text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 