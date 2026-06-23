import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, BookOpen, Video, MessageCircle, ClipboardList, Users, Star } from 'lucide-react'
import api from '../hooks/useApi'

const SUBJECT_META = {
  Physics:     { emoji: '⚛️', color: 'bg-blue-50 border-blue-200 text-blue-700',   btn: 'bg-blue-500 hover:bg-blue-600' },
  Biology:     { emoji: '🧬', color: 'bg-green-50 border-green-200 text-green-700', btn: 'bg-green-500 hover:bg-green-600' },
  Mathematics: { emoji: '📐', color: 'bg-purple-50 border-purple-200 text-purple-700', btn: 'bg-purple-500 hover:bg-purple-600' },
  Chemistry:   { emoji: '🧪', color: 'bg-orange-50 border-orange-200 text-orange-700', btn: 'bg-orange-500 hover:bg-orange-600' },
}

const features = [
  { icon: Video,         label: 'Live classes on Google Meet',      desc: 'Daily live sessions with your teacher' },
  { icon: BookOpen,      label: 'Chapter-wise PDF notes',           desc: 'Handwritten notes for every chapter' },
  { icon: ClipboardList, label: 'Mock tests with instant results',  desc: 'JEE/NEET style tests after each chapter' },
  { icon: MessageCircle, label: 'Doubt clearing per chapter',       desc: 'Ask doubts, get answers from teachers' },
]

const testimonials = [
  { name: 'Ravi Kumar',    class: 'PUC 11', quote: 'The chapter-wise tests really helped me track my progress. Best platform for PUC students!' },
  { name: 'Priya Sharma',  class: 'PUC 11', quote: 'Dr. Suresh\'s physics explanations are crystal clear. I finally understand Newton\'s laws!' },
  { name: 'Arjun Singh',   class: 'PUC 12', quote: 'Maths 12 calculus sessions were amazing. The doubt system is super fast.' },
]

export default function Home() {
  const [courses,    setCourses]    = useState([])
  const [classTab,   setClassTab]   = useState('11')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  // Group by subject for the selected class
  const subjects = ['Physics', 'Biology', 'Mathematics', 'Chemistry']
  const filtered = courses.filter(c => c.class_level === classTab)

  return (
    <div className="bg-white">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16 pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            🎓 PUC 11 & 12 · Physics · Biology · Maths · Chemistry
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight text-stone-900 mb-6">
            Learn from expert teachers,<br />
            <span className="text-indigo-600">ace your PUC exams</span>
          </h1>
          <p className="text-stone-500 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Xcelerate brings PUC 11 & 12 students live classes, chapter-wise notes, mock tests and personal doubt support — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/courses"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
              Browse courses <ArrowRight size={16} />
            </Link>
            <Link to="/login"
              className="bg-white border-2 border-stone-200 hover:border-indigo-300 text-stone-700 font-semibold px-7 py-3.5 rounded-xl transition-colors">
              Start for free
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-stone-500">
            {[['500+', 'Students enrolled'], ['4', 'Expert teachers'], ['8', 'Courses available'], ['95%', 'Student satisfaction']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-display font-bold text-stone-800">{val}</div>
                <div className="text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COURSES BY SUBJECT ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-stone-900 mb-3">Choose your subject & class</h2>
          <p className="text-stone-500">All subjects for PUC 1st and 2nd year — taught by experienced college lecturers</p>
        </div>

        {/* Class toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
            {['11', '12'].map(cl => (
              <button key={cl} onClick={() => setClassTab(cl)}
                className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  classTab === cl ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}>
                PUC {cl}
              </button>
            ))}
          </div>
        </div>

        {/* Subject cards */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="h-52 bg-stone-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {subjects.map(subject => {
              const course = filtered.find(c => c.subject === subject)
              const meta   = SUBJECT_META[subject]
              if (!course) return null
              return (
                <div key={subject} className={`border-2 rounded-2xl p-5 hover:shadow-lg transition-all group ${meta.color}`}>
                  <div className="text-4xl mb-3">{meta.emoji}</div>
                  <h3 className="font-display font-bold text-stone-800 text-lg mb-1">{subject}</h3>
                  <p className="text-xs text-stone-500 mb-3">PUC {classTab} · {course.total_chapters} chapters</p>
                  <p className="text-xs text-stone-600 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {course.teacher_name?.split(' ').pop()?.[0]}
                    </div>
                    <span className="text-xs text-stone-600">{course.teacher_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">₹{Number(course.price).toLocaleString()}</span>
                    <Link to={`/courses/${course.id}`}
                      className={`text-xs text-white font-semibold px-3 py-1.5 rounded-lg transition-colors ${meta.btn}`}>
                      View course
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/courses" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
            View all courses <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section className="bg-stone-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-stone-900 mb-3">Everything you need to succeed</h2>
            <p className="text-stone-500">Built specifically for PUC students in Karnataka</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.label} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-center hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <f.icon size={22} className="text-indigo-600" />
                </div>
                <h3 className="font-semibold text-stone-800 text-sm mb-1">{f.label}</h3>
                <p className="text-xs text-stone-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEACHERS ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-stone-900 mb-3">Meet your teachers</h2>
          <p className="text-stone-500">College lecturers with years of PUC teaching experience</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { name: 'Dr. Suresh Kumar',  subject: 'Physics',     exp: '12 years', emoji: '⚛️' },
            { name: 'Dr. Anita Rao',     subject: 'Biology',     exp: '10 years', emoji: '🧬' },
            { name: 'Prof. Rajan Mehta', subject: 'Mathematics', exp: '15 years', emoji: '📐' },
            { name: 'Dr. Kavya Nair',    subject: 'Chemistry',   exp: '8 years',  emoji: '🧪' },
          ].map(t => (
            <div key={t.name} className="bg-white border border-stone-100 rounded-2xl p-5 text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl mx-auto mb-3">
                {t.emoji}
              </div>
              <h3 className="font-semibold text-stone-800 mb-0.5">{t.name}</h3>
              <p className="text-sm text-indigo-600 font-medium mb-1">{t.subject}</p>
              <p className="text-xs text-stone-400">{t.exp} experience</p>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {[1,2,3,4,5].map(i => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="bg-indigo-600 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-white text-center mb-12">What students say</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <p className="text-indigo-100 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-indigo-200 text-xs">{t.class} Student</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-display font-bold text-stone-900 mb-4">Ready to start learning?</h2>
        <p className="text-stone-500 mb-8">Join 500+ PUC students already learning on Xcelerate</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/courses"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
            Browse all courses <ArrowRight size={16} />
          </Link>
          <Link to="/login"
            className="bg-white border-2 border-stone-200 hover:border-indigo-300 text-stone-700 font-semibold px-8 py-4 rounded-xl transition-colors">
            Create free account
          </Link>
        </div>
      </section>

    </div>
  )
}
