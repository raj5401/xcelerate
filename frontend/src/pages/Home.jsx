import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Award, Zap } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Learn PCMB Online with
            <span className="text-blue-600"> Xcelerate</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master Physics, Chemistry, Math & Biology with expert teachers. Learn at your own pace, take tests, and track your progress.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/courses"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Explore Courses
            </Link>
            <Link
              to="/register"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Xcelerate?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: BookOpen, title: 'Expert Teachers', desc: 'Learn from qualified educators' },
            { icon: Users, title: '60+ Students', desc: 'Collaborative learning community' },
            { icon: Award, title: 'Certifications', desc: 'Earn verified certificates' },
            { icon: Zap, title: 'Live Classes', desc: 'Interactive sessions with Q&A' },
          ].map((feature, i) => {
            const Icon = feature.icon
            return (
              <div key={i} className="text-center p-6 border rounded-lg hover:shadow-lg transition">
                <Icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold">60+</div>
            <p className="text-blue-100">Active Students</p>
          </div>
          <div>
            <div className="text-4xl font-bold">8</div>
            <p className="text-blue-100">Comprehensive Courses</p>
          </div>
          <div>
            <div className="text-4xl font-bold">4</div>
            <p className="text-blue-100">Expert Teachers</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
