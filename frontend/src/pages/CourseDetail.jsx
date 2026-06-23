import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BookOpen, Users, Clock, CheckCircle, ChevronDown, ChevronUp, ArrowRight, Loader, Video, FileText, Star } from 'lucide-react'
import api from '../hooks/useApi'
import { useAuthStore } from '../store/authStore'

const SUBJECT_META = {
  Physics:     { emoji: '⚛️', bg: 'from-blue-500 to-indigo-600' },
  Biology:     { emoji: '🧬', bg: 'from-green-500 to-emerald-600' },
  Mathematics: { emoji: '📐', bg: 'from-purple-500 to-violet-600' },
  Chemistry:   { emoji: '🧪', bg: 'from-orange-500 to-red-500' },
}

export default function CourseDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()

  const [course,    setCourse]    = useState(null)
  const [enrolled,  setEnrolled]  = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [openChap,  setOpenChap]  = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [c, e] = await Promise.all([
          api.get(`/courses/${id}`),
          user ? api.get('/courses/my/enrollments') : Promise.resolve({ data: [] })
        ])
        setCourse(c.data)
        setEnrolled(e.data.some(x => (x.course_id || x.id) === Number(id)))
      } catch { navigate('/courses') }
      finally { setLoading(false) }
    }
    load()
  }, [id, user])

  async function enroll() {
    if (!user) { navigate('/login'); return }
    setEnrolling(true)
    try {
      await api.post('/courses/enroll', { course_id: Number(id) })
      setEnrolled(true)
    } catch (err) {
      if (err.response?.data?.message === 'Already enrolled') setEnrolled(true)
      else alert(err.response?.data?.message || 'Enrollment failed')
    } finally { setEnrolling(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-indigo-500" />
    </div>
  )
  if (!course) return null

  const meta     = SUBJECT_META[course.subject] || { emoji: '📚', bg: 'from-indigo-500 to-purple-600' }
  const chapters = course.chapters || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── LEFT: Course info ─────────────────────────────── */}
        <div className="lg:col-span-2">

          {/* Hero banner */}
          <div className={`bg-gradient-to-br ${meta.bg} rounded-2xl p-8 text-white mb-6`}>
            <div className="text-5xl mb-3">{meta.emoji}</div>
            <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              {course.subject} · PUC {course.class_level}
            </span>
            <h1 className="text-2xl font-display font-bold mt-3 mb-2">{course.title}</h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-xl">{course.description}</p>
            <div className="flex gap-5 mt-5 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><BookOpen size={14}/> {course.total_chapters} chapters</span>
              <span className="flex items-center gap-1.5"><Users size={14}/> {course.enrolled_count || 0} students</span>
              <span className="flex items-center gap-1.5"><Clock size={14}/> Full year</span>
            </div>
          </div>

          {/* What you'll get */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-display font-bold text-stone-800 mb-4">What's included</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['Live Google Meet classes', `${course.total_chapters} sessions`],
                ['Chapter-wise PDF notes',   'Handwritten & downloadable'],
                ['Mock tests per chapter',   'JEE/NEET style MCQs'],
                ['Doubt clearing',           'Ask questions, get answers'],
                ['Batch schedule',           'Morning & evening options'],
                ['Full year access',         'Revisit anytime'],
              ].map(([label, sub]) => (
                <div key={label} className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-stone-700">{label}</p>
                    <p className="text-xs text-stone-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter list */}
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-stone-100">
              <h2 className="font-display font-bold text-stone-800">Course content</h2>
              <p className="text-xs text-stone-400 mt-1">{chapters.length} chapters</p>
            </div>
            <div className="divide-y divide-stone-100">
              {chapters.map((ch, i) => (
                <div key={ch.id}>
                  <button onClick={() => setOpenChap(openChap === i ? -1 : i)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-stone-700">{ch.title}</span>
                    </div>
                    {openChap === i ? <ChevronUp size={15} className="text-stone-400" /> : <ChevronDown size={15} className="text-stone-400" />}
                  </button>
                  {openChap === i && (
                    <div className="px-6 pb-4 bg-stone-50">
                      <div className="flex gap-4 text-xs text-stone-500 py-2">
                        <span className="flex items-center gap-1"><Video size={11} /> Video lecture</span>
                        <span className="flex items-center gap-1"><FileText size={11} /> Notes PDF</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} /> Chapter test</span>
                      </div>
                      {!enrolled && (
                        <p className="text-xs text-stone-400 italic">Enroll to access chapter content</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Teacher card */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-stone-800 mb-4">Your teacher</h2>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
                {meta.emoji}
              </div>
              <div>
                <h3 className="font-semibold text-stone-800">{course.teacher_name}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-2">{course.teacher_subject} Teacher</p>
                <p className="text-sm text-stone-500 leading-relaxed">{course.teacher_bio}</p>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-xs text-stone-400 ml-1">5.0 rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Enroll card (sticky) ───────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-br ${meta.bg} p-6 text-white text-center`}>
              <div className="text-4xl mb-2">{meta.emoji}</div>
              <p className="text-white/80 text-sm">PUC {course.class_level} {course.subject}</p>
            </div>
            <div className="p-6">
              <div className="text-center mb-5">
                <span className="text-3xl font-display font-bold text-stone-900">
                  ₹{Number(course.price).toLocaleString()}
                </span>
                <p className="text-xs text-stone-400 mt-1">One-time · Full year access</p>
              </div>

              {enrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold py-3 rounded-xl">
                    <CheckCircle size={16} /> You're enrolled
                  </div>
                  <Link to="/dashboard"
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                    Go to dashboard <ArrowRight size={15} />
                  </Link>
                </div>
              ) : (
                <button onClick={enroll} disabled={enrolling}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {enrolling ? 'Enrolling...' : <><ArrowRight size={15} /> Enroll now — Free</>}
                </button>
              )}

              <div className="mt-5 space-y-2.5">
                {[
                  'Live classes on Google Meet',
                  `${course.total_chapters} chapter notes included`,
                  'Chapter-wise mock tests',
                  'Doubt support',
                  'Full year access',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-stone-500">
                    <CheckCircle size={12} className="text-green-500 flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
