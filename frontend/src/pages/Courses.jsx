import { useState, useEffect } from 'react'
import { ArrowRight, Clock, Users, BookOpen, Lock, CheckCircle, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import { useAuthStore } from '../store/authStore'

export default function Courses() {
  const [courses,     setCourses]     = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [enrolling,   setEnrolling]   = useState(null)
  const [active,      setActive]      = useState('All')
  const { user }                      = useAuthStore()
  const navigate                      = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [c, e] = await Promise.all([
          api.get('/courses'),
          user ? api.get('/courses/my/enrollments') : Promise.resolve({ data: [] })
        ])
        setCourses(c.data)
        setEnrollments(e.data.map(x => x.id))
      } catch(err) { console.error(err) }
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
      navigate('/dashboard')
    } catch(err) {
      alert(err.response?.data?.message || 'Enrollment failed')
    } finally { setEnrolling(null) }
  }

  const tabs    = ['All', 'JEE', 'NEET', 'KCET', 'Boards', 'Crash']
  const filtered = active === 'All' ? courses : courses.filter(c => c.exam === active)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">All courses</h1>
      <p className="text-stone-500 mb-8">Choose your exam and batch. Live classes start June 2026.</p>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {tabs.map(t => (
          <button key={t} onClick={() => setActive(t)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              active === t
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
            }`}>{t}</button>
        ))}
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(c => {
          const enrolled = enrollments.includes(c.id)
          return (
            <div key={c.id} className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${
              enrolled ? 'border-green-200 bg-green-50/30' : 'border-stone-100'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs bg-brand-50 text-brand-600 border border-brand-100 px-2 py-0.5 rounded-full font-medium">
                  {c.exam}
                </span>
                {enrolled && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle size={12}/> Enrolled
                  </span>
                )}
              </div>

              <h3 className="font-display font-semibold text-stone-800 mb-1 leading-snug">{c.title}</h3>
              <p className="text-xs text-stone-400 mb-4">{c.batch_class}</p>

              <div className="flex gap-4 text-xs text-stone-400 mb-5">
                <span className="flex items-center gap-1"><Clock size={11}/> 10 months</span>
                <span className="flex items-center gap-1"><Users size={11}/> {c.enrolled || 0} students</span>
                <span className="flex items-center gap-1"><BookOpen size={11}/> {c.chapters} chapters</span>
              </div>

              {/* What's included */}
              <div className="bg-stone-50 rounded-xl p-3 mb-4 space-y-1.5">
                {['Live classes on Google Meet','Handwritten PDF notes','Mock tests + PYQs','WhatsApp doubt support'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-stone-500">
                    <CheckCircle size={11} className="text-green-500 flex-shrink-0"/> {f}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-display font-bold text-stone-800">
                  ₹{Number(c.price).toLocaleString()}
                  <span className="text-xs font-normal text-stone-400 ml-1">/course</span>
                </span>
                {enrolled ? (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-xl font-medium">
                    ✓ Enrolled
                  </span>
                ) : (
                  <button
                    onClick={() => enroll(c.id)}
                    disabled={enrolling === c.id}
                    className="bg-stone-900 hover:bg-brand-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    {enrolling === c.id ? 'Enrolling...' : <><Lock size={11}/> Enroll now</>}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!user && (
        <div className="mt-8 bg-brand-50 border border-brand-100 rounded-2xl p-6 text-center">
          <p className="text-stone-700 font-medium mb-2">Create a free account to enroll</p>
          <p className="text-stone-500 text-sm mb-4">Registration takes 2 minutes. OTP verification included.</p>
          <a href="/login" className="inline-flex items-center gap-2 bg-brand-500 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-brand-600 text-sm">
            Create account <ArrowRight size={14}/>
          </a>
        </div>
      )}
    </div>
  )
}
