import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import api from '../utils/api'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    subject: '',
    class_level: '',
    search: '',
  })

  useEffect(() => {
    fetchCourses()
  }, [filters])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/courses', { params: filters })
      setCourses(data.courses || [])
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Explore Courses</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Course name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Math">Math</option>
              <option value="Biology">Biology</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Class</label>
            <select
              value={filters.class_level}
              onChange={(e) => setFilters({ ...filters, class_level: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="">All Classes</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No courses found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
              >
                <img
                  src={course.thumbnail || `https://via.placeholder.com/300x200?text=${course.subject}`}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg flex-1">{course.title}</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                      ₹{course.price}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{course.description?.substring(0, 100)}...</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{course.total_chapters} chapters</span>
                    <span>{course.total_videos} videos</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses
