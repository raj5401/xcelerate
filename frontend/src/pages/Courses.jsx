import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Users, CheckCircle, Loader, ChevronRight } from 'lucide-react'
import api from '../hooks/useApi'
import { useAuthStore } from '../store/authStore'

const SUBJECT_META = {
  Physics:     { emoji: '⚛️', bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  Biology:     { emoji: '🧬', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  Mathematics: { emoji: '📐', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  Chemistry:   { emoji: '🧪', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
}

export default function Courses() {
  const [courses,     setCourses]     = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [enrolling,   setEnrolling]   = useState(null)
  const [classFilter, setClassFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [c, e] = await Promise.all([
          api.get('/courses'),
          user ? api.get('/courses/my/enrollments') : Promise.resolve({ data: [] })
        ])
        setCourses(c.data)
        setEnrollments(e.data.map(x => x.course_id || x.id))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  async function enroll(courseId) {
    if (!user) { navigate('/login'); return }
    setEnrolling(courseId)
    try {
      await api.post('/courses/enroll', { course_id: courseId })
      setEnrollments(e => [...e, courseId])
    } catch (err) {
      if (err.response?.data?.message === 'Already enrolled') {
        setEnrollments(e => [...e, courseId])
      } else {
        alert(err.response?.data?.message || 'Enrollment failed')
      }
    } finally { setEnrolling(null) }
  }

  const subjects = ['all', 'Physics', 'Biology', 'Mathematics', 'Chemistry']

  const filtered = courses.filter(c => {
    const classOk   = classFilter   === 'all' || c.class_level === classFilter
    const subjectOk = subjectFilter === 'all' || c.subject === subjectFilter
    return classOk && subjectOk
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold text-stone-900 mb-2">All Courses</h1>
        <p className="text-stone-500">PUC 11 & 12 — Physics, Biology, Mathematics, Chemistry</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        {/* Class filter */}
        <div>
          <p className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wide">Class</p>
          <div className="flex gap-2">
            {[['all', 'All Classes'], ['11', 'PUC 11'], ['12', 'PUC 12']].map(([val, label]) => (
              <button key={val} onClick={() => setClassFilter(val)}
                className={`text-sm px-4 py-1.5 rounded-full border transition-colors font-medium ${
                  classFilter === val
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-stone-200 text-stone-600 hover:border-indigo-300 bg-white'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* Subject filter */}
        <div>
          <p className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wide">Subject</p>
          <div className="flex gap-2 flex-wrap">
            {subjects.map(s => {
              const meta = SUBJECT_META[s]
              return (
                <button key={s} onClick={() => setSubjectFilter(s)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition-colors font-medium ${
                    subjectFilter === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-stone-200 text-stone-600 hover:border-indigo-300 bg-white'
                  }`}>
                  {meta ? `${meta.emoji} ${s}` : 'All Subjects'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-stone-400 mb-6">{filtered.length} courses found</p>

      {/* Course grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => {
          const meta     = SUBJECT_META[c.subject] || {}
          const enrolled = enrollments.includes(c.id)
          return (
            <div key={c.id} className={`border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all ${
              enrolled ? 'border-green-300' : (meta.border || 'border-stone-200')
            }`}>
              {/* Card header */}
              <div className={`p-5 ${meta.bg || 'bg-stone-50'}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{meta.emoji}</span>
                  {enrolled && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle size={11} /> Enrolled
                    </span>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
                  {c.subject} · PUC {c.class_level}
                </span>
                <h3 className="font-display font-bold text-stone-800 mt-2 text-lg leading-tight">{c.title}</h3>
              </div>

              {/* Card body */}
              <div className="p-5 bg-white">
                <p className="text-xs text-stone-500 mb-4 line-clamp-2">{c.description}</p>

                {/* Teacher */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-stone-100">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {c.teacher_name?.split(' ').slice(-1)[0]?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-700">{c.teacher_name}</p>
                    <p className="text-xs text-stone-400">{c.teacher_subject} Teacher</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-stone-400 mb-5">
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} /> {c.total_chapters} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {c.enrolled_count || 0} students
                  </span>
                </div>

                {/* Includes */}
                <div className="space-y-1.5 mb-5">
                  {['Live Google Meet classes', 'Chapter-wise notes', 'Mock tests', 'Doubt support'].map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-stone-500">
                      <CheckCircle size={10} className="text-green-500 flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>

                {/* Price + action */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-display font-bold text-stone-900">
                      ₹{Number(c.price).toLocaleString()}
                    </span>
                    <span className="text-xs text-stone-400 ml-1">/ course</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/courses/${c.id}`}
                      className="text-xs border border-stone-200 text-stone-600 px-3 py-2 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      Details
                    </Link>
                    {enrolled ? (
                      <Link to="/dashboard"
                        className="text-xs bg-green-600 text-white px-3 py-2 rounded-xl hover:bg-green-700 transition-colors font-medium">
                        Go to course
                      </Link>
                    ) : (
                      <button onClick={() => enroll(c.id)} disabled={enrolling === c.id}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-60">
                        {enrolling === c.id ? 'Enrolling...' : 'Enroll free'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg mb-2">No courses found</p>
          <p className="text-sm">Try changing the filters</p>
        </div>
      )}

      {/* Guest CTA */}
      {!user && (
        <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-display font-bold text-stone-800 mb-2">Create a free account to enroll</h3>
          <p className="text-stone-500 text-sm mb-5">Register in 2 minutes with OTP verification</p>
          <Link to="/login"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
            Get started <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  )
}
