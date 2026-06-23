import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, FileText, ClipboardList, PlayCircle, Clock,
  ArrowRight, Trophy, MessageCircle, Loader, CheckCircle,
  Video, Send, ChevronDown, ChevronUp, LogOut
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../hooks/useApi'

const SUBJECT_META = {
  Physics:     { emoji: '⚛️', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  Biology:     { emoji: '🧬', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  Mathematics: { emoji: '📐', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  Chemistry:   { emoji: '🧪', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
}

async function downloadNote(id, title) {
  try {
    const res = await api.get(`/files/notes/${id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url; a.download = title + '.pdf'; a.click()
    window.URL.revokeObjectURL(url)
  } catch { alert('Download failed') }
}

export default function Dashboard() {
  const { user, logout }    = useAuthStore()
  const navigate            = useNavigate()

  const [tab,         setTab]         = useState('courses')
  const [enrollments, setEnrollments] = useState([])
  const [notes,       setNotes]       = useState([])
  const [tests,       setTests]       = useState([])
  const [doubts,      setDoubts]      = useState([])
  const [courses,     setCourses]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [expandedCourse, setExpandedCourse] = useState(null)

  // Doubt form
  const [doubtCourseId,  setDoubtCourseId]  = useState('')
  const [doubtQuestion,  setDoubtQuestion]  = useState('')
  const [submittingDoubt, setSubmittingDoubt] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [user])

  async function load() {
    try {
      const [e, c] = await Promise.all([
        api.get('/courses/my/enrollments'),
        api.get('/courses'),
      ])
      setEnrollments(e.data)
      setCourses(c.data)
      if (e.data.length > 0) {
        const [n, t, d] = await Promise.all([
          api.get('/files/notes'),
          api.get('/tests'),
          api.get('/doubts'),
        ])
        setNotes(n.data)
        setTests(t.data)
        setDoubts(d.data)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function submitDoubt(e) {
    e.preventDefault()
    if (!doubtQuestion.trim() || !doubtCourseId) return
    setSubmittingDoubt(true)
    try {
      const res = await api.post('/doubts', { course_id: Number(doubtCourseId), question: doubtQuestion })
      setDoubts(d => [{ ...res.data, student_name: user.name }, ...d])
      setDoubtQuestion('')
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit doubt') }
    finally { setSubmittingDoubt(false) }
  }

  const isEnrolled = enrollments.length > 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size={24} className="animate-spin text-indigo-500" />
    </div>
  )

  // ── NOT ENROLLED ──────────────────────────────────────────────
  if (!isEnrolled) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold text-stone-900 mb-2">
        Welcome, {user?.name?.split(' ')[0]}! 👋
      </h1>
      <p className="text-stone-500 mb-8">You're not enrolled in any course yet. Pick a subject to get started.</p>

      <div className="bg-indigo-600 rounded-2xl p-6 text-white mb-8">
        <h2 className="text-lg font-bold mb-1">Start learning today</h2>
        <p className="text-indigo-200 text-sm mb-4">Enroll in any course — free during development</p>
        <Link to="/courses"
          className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 text-sm transition-colors">
          Browse courses <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {courses.slice(0, 8).map(c => {
          const meta = SUBJECT_META[c.subject] || {}
          return (
            <Link key={c.id} to={`/courses/${c.id}`}
              className={`border-2 rounded-2xl p-4 hover:shadow-md transition-all ${meta.border} ${meta.bg}`}>
              <div className="text-2xl mb-2">{meta.emoji}</div>
              <p className={`text-xs font-bold mb-1 ${meta.color}`}>{c.subject} · PUC {c.class_level}</p>
              <p className="text-sm font-semibold text-stone-700 leading-tight">{c.title}</p>
              <p className="text-xs text-stone-500 mt-1">₹{Number(c.price).toLocaleString()}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )

  // ── ENROLLED DASHBOARD ────────────────────────────────────────
  const myTests = tests.filter(t =>
    enrollments.some(e => e.subject === t.subject && e.class_level === t.class_level)
    || tests.length > 0
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {enrollments.length} course{enrollments.length > 1 ? 's' : ''} enrolled
          </p>
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen,      label: 'Courses',   value: enrollments.length,   color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: FileText,      label: 'Notes',     value: notes.length,         color: 'text-green-600',  bg: 'bg-green-50' },
          { icon: ClipboardList, label: 'Tests',     value: tests.length,         color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: MessageCircle, label: 'Doubts',    value: doubts.length,        color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon size={15} className={s.color} />
            </div>
            <div className="text-2xl font-display font-bold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {[
          ['courses', 'My Courses'],
          ['notes',   'Notes'],
          ['tests',   'Mock Tests'],
          ['doubts',  'Doubts'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === k ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}>{label}</button>
        ))}
      </div>

      {/* ── COURSES TAB ──────────────────────────────────────── */}
      {tab === 'courses' && (
        <div className="space-y-4">
          {enrollments.map(c => {
            const meta    = SUBJECT_META[c.subject] || {}
            const isOpen  = expandedCourse === c.id
            const courseNotes = notes.filter(n => n.course_id === c.id)
            const courseTests = tests.filter(t => t.course_id === c.id)

            return (
              <div key={c.id} className={`border-2 rounded-2xl overflow-hidden ${meta.border || 'border-stone-200'}`}>
                {/* Course header */}
                <div className={`${meta.bg || 'bg-stone-50'} p-5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div>
                        <p className={`text-xs font-bold ${meta.color}`}>{c.subject} · PUC {c.class_level}</p>
                        <h3 className="font-display font-bold text-stone-800 text-base">{c.title}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {c.batch_name} · {c.schedule || 'Schedule TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Active
                      </span>
                      <button onClick={() => setExpandedCourse(isOpen ? null : c.id)}
                        className="text-stone-400 hover:text-stone-600 transition-colors">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Live class button */}
                  <div className="mt-4">
                    {c.meet_link ? (
                      <a href={c.meet_link} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                        <PlayCircle size={13} /> Join live class
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 bg-stone-200 text-stone-500 text-xs px-4 py-2 rounded-lg">
                        <Clock size={13} /> Live link coming soon
                      </span>
                    )}
                    <Link to={`/courses/${c.course_id || c.id}`}
                      className="ml-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-2">
                      View chapters <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="bg-white p-5 grid sm:grid-cols-2 gap-4">
                    {/* Notes for this course */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <FileText size={12} /> Notes ({courseNotes.length})
                      </h4>
                      {courseNotes.length === 0 ? (
                        <p className="text-xs text-stone-400">No notes uploaded yet</p>
                      ) : (
                        <div className="space-y-2">
                          {courseNotes.slice(0, 3).map(n => (
                            <div key={n.id} className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2">
                              <p className="text-xs font-medium text-stone-700 truncate flex-1">{n.title}</p>
                              <button onClick={() => downloadNote(n.id, n.title)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2 flex-shrink-0">
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tests for this course */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <ClipboardList size={12} /> Tests ({courseTests.length})
                      </h4>
                      {courseTests.length === 0 ? (
                        <p className="text-xs text-stone-400">No tests available yet</p>
                      ) : (
                        <div className="space-y-2">
                          {courseTests.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2">
                              <p className="text-xs font-medium text-stone-700 truncate flex-1">{t.title}</p>
                              <Link to={`/test/${t.id}/instructions`}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2 flex-shrink-0">
                                Attempt
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── NOTES TAB ────────────────────────────────────────── */}
      {tab === 'notes' && (
        <div>
          {notes.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notes uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map(n => {
                const enrollment = enrollments.find(e => e.id === n.course_id || e.course_id === n.course_id)
                const meta = enrollment ? (SUBJECT_META[enrollment.subject] || {}) : {}
                return (
                  <div key={n.id} className="bg-white border border-stone-100 rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg || 'bg-red-50'}`}>
                        <FileText size={15} className={meta.color || 'text-red-400'} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{n.title}</p>
                        <p className="text-xs text-stone-400">
                          {enrollment?.title || 'Course'} · {n.size_kb ? `${(n.size_kb / 1024).toFixed(1)} MB` : '—'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => downloadNote(n.id, n.title)}
                      className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors">
                      <FileText size={12} /> Download
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TESTS TAB ────────────────────────────────────────── */}
      {tab === 'tests' && (
        <div>
          {tests.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tests available yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map(t => {
                const meta = SUBJECT_META[t.subject] || {}
                const now  = new Date()
                const scheduled = t.scheduled_at ? new Date(t.scheduled_at) : null
                const isUpcoming = scheduled && scheduled > now
                return (
                  <div key={t.id} className="bg-white border border-stone-100 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${meta.bg || 'bg-purple-50'} flex items-center justify-center`}>
                        <span className="text-lg">{meta.emoji || '📝'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{t.title}</p>
                        <p className="text-xs text-stone-400">
                          {t.subject} · PUC {t.class_level} · {t.duration} min · {t.total_marks} marks · {t.question_count} Qs
                        </p>
                        {isUpcoming && (
                          <p className="text-xs text-amber-600 font-medium mt-0.5">
                            🕐 Starts {new Date(t.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    {isUpcoming ? (
                      <span className="text-xs bg-amber-50 text-amber-600 px-3 py-2 rounded-xl font-medium border border-amber-100">
                        Upcoming
                      </span>
                    ) : (
                      <Link to={`/test/${t.id}/instructions`}
                        className="text-xs bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1">
                        Attempt <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DOUBTS TAB ───────────────────────────────────────── */}
      {tab === 'doubts' && (
        <div className="space-y-6">
          {/* Ask a doubt */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <MessageCircle size={16} className="text-indigo-600" /> Ask a doubt
            </h3>
            <form onSubmit={submitDoubt} className="space-y-3">
              <select value={doubtCourseId} onChange={e => setDoubtCourseId(e.target.value)}
                required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-indigo-400">
                <option value="">Select course</option>
                {enrollments.map(e => (
                  <option key={e.id} value={e.course_id || e.id}>
                    {e.subject} — {e.title}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input value={doubtQuestion} onChange={e => setDoubtQuestion(e.target.value)}
                  placeholder="Type your doubt here..."
                  required
                  className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                <button type="submit" disabled={submittingDoubt}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  <Send size={13} /> {submittingDoubt ? 'Sending...' : 'Ask'}
                </button>
              </div>
            </form>
          </div>

          {/* Doubt list */}
          {doubts.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No doubts yet. Ask your first doubt above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doubts.map(d => (
                <div key={d.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${
                  d.status === 'answered' ? 'border-green-200' : 'border-stone-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-stone-800 flex-1">{d.question}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-3 flex-shrink-0 ${
                      d.status === 'answered'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {d.status === 'answered' ? '✓ Answered' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mb-3">
                    Asked by {d.student_name || 'You'} · {new Date(d.created_at).toLocaleDateString('en-IN')}
                  </p>
                  {d.answer && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-2">
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        Answer by {d.answered_by_name || 'Teacher'}:
                      </p>
                      <p className="text-sm text-stone-700 leading-relaxed">{d.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
