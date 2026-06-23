import { useState, useEffect } from 'react'
import { BookOpen, Video, ClipboardList, LogOut, PlayCircle, FileText, Loader, ArrowRight, Lock, Trophy, Clock, TrendingUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../hooks/useApi'

async function downloadNote(id, title) {
  try {
    const res = await api.get(`/files/notes/${id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a'); a.href = url; a.download = title + '.pdf'; a.click()
    window.URL.revokeObjectURL(url)
  } catch { alert('Download failed') }
}

export default function Dashboard() {
  const [tab,         setTab]         = useState('overview')
  const [enrollments, setEnroll]      = useState([])
  const [notes,       setNotes]       = useState([])
  const [tests,       setTests]       = useState([])
  const [courses,     setCourses]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const { user, logout }              = useAuthStore()
  const navigate                      = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [e, c] = await Promise.all([
          api.get('/courses/my/enrollments'),
          api.get('/courses'),
        ])
        setEnroll(e.data)
        setCourses(c.data)

        // Only load notes/tests if enrolled
        if (e.data.length > 0) {
          const [n, t] = await Promise.all([
            api.get('/files/notes'),
            api.get('/tests'),
          ])
          setNotes(n.data)
          setTests(t.data)
        }
      } catch(err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const isEnrolled = enrollments.length > 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size={24} className="animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-stone-900">
            Welcome, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {isEnrolled
              ? `Enrolled in ${enrollments.length} course${enrollments.length > 1 ? 's' : ''}`
              : 'Explore our courses and enroll to get started'}
          </p>
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors">
          <LogOut size={15} /> Sign out
        </button>
      </div>

      {/* NOT ENROLLED — show course discovery */}
      {!isEnrolled && (
        <div className="space-y-6">
          {/* CTA banner */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-display font-semibold mb-2">Start your physics journey</h2>
            <p className="text-brand-100 text-sm mb-4">Enroll in a course to access live classes, notes, mock tests and doubt support.</p>
            <div className="flex gap-4 text-sm mb-5">
              {['Live Google Meet classes','Handwritten PDF notes','Timed mock tests','WhatsApp doubt support'].map(f => (
                <span key={f} className="flex items-center gap-1.5 text-brand-100">
                  <span className="text-white">✓</span> {f}
                </span>
              ))}
            </div>
            <Link to="/courses" className="inline-flex items-center gap-2 bg-white text-brand-500 font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors text-sm">
              Browse courses <ArrowRight size={15}/>
            </Link>
          </div>

          {/* Course grid */}
          <div>
            <h2 className="text-base font-display font-semibold text-stone-800 mb-4">Available courses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 6).map(c => (
                <div key={c.id} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">{c.exam}</span>
                  <h3 className="font-semibold text-stone-800 text-sm mt-2 mb-1 leading-snug">{c.title}</h3>
                  <p className="text-xs text-stone-400 mb-3">{c.batch_class} · {c.chapters} chapters</p>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-stone-800">₹{Number(c.price).toLocaleString()}</span>
                    <Link to={`/courses`}
                      className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors">
                      Enroll now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ENROLLED — full dashboard */}
      {isEnrolled && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-brand-500"/>
                <span className="text-xs text-stone-400">Courses</span>
              </div>
              <div className="text-2xl font-display font-semibold text-stone-900">{enrollments.length}</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} className="text-brand-500"/>
                <span className="text-xs text-stone-400">Notes</span>
              </div>
              <div className="text-2xl font-display font-semibold text-stone-900">{notes.length}</div>
            </div>
            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={14} className="text-brand-500"/>
                <span className="text-xs text-stone-400">Tests</span>
              </div>
              <div className="text-2xl font-display font-semibold text-stone-900">{tests.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-stone-50 rounded-xl p-1 w-fit mb-6">
            {[['overview','My Courses'],['notes','Notes'],['tests','Mock Tests']].map(([k,label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                  tab === k ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}>{label}</button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-4">
              {enrollments.map(c => (
                <div key={c.id} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{c.exam}</span>
                      <h3 className="font-semibold text-stone-800 mt-2 text-sm leading-snug">{c.title}</h3>
                    </div>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
                  </div>
                  <p className="text-xs text-stone-400 mb-3 flex items-center gap-1">
                    <Clock size={11}/> {c.schedule || 'Schedule TBD'} · {c.batch_name || c.batch_class}
                  </p>
                  {c.meet_link ? (
                    <a href={c.meet_link} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 bg-brand-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-brand-600 transition-colors w-full">
                      <PlayCircle size={13}/> Join live class
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-2 bg-stone-50 text-stone-400 text-xs py-2 rounded-lg w-full">
                      <Clock size={13}/> Class link coming soon
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes tab */}
          {tab === 'notes' && (
            <div>
              {notes.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <FileText size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-sm">No notes uploaded yet. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map(n => (
                    <div key={n.id} className="bg-white border border-stone-100 rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                          <FileText size={15} className="text-red-400"/>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-800">{n.title}</p>
                          <p className="text-xs text-stone-400">{n.batch_name} · {n.size_kb ? `${(n.size_kb/1024).toFixed(1)} MB` : '—'}</p>
                        </div>
                      </div>
                      <button onClick={() => downloadNote(n.id, n.title)}
                        className="text-xs text-brand-500 font-medium hover:text-brand-600 flex items-center gap-1 px-3 py-1.5 border border-brand-100 rounded-lg hover:bg-brand-50 transition-colors">
                        <FileText size={12}/> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tests tab */}
          {tab === 'tests' && (
            <div>
              {tests.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <ClipboardList size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-sm">No tests available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map(t => (
                    <div key={t.id} className="bg-white border border-stone-100 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                          <Trophy size={15} className="text-purple-500"/>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-800">{t.title}</p>
                          <p className="text-xs text-stone-400">{t.exam} · {t.duration} min · {t.total_marks} marks · {t.question_count} questions</p>
                        </div>
                      </div>
                      <Link to={`/test/${t.id}/instructions`}
                        className="text-xs bg-brand-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-1">
                        Attempt <ArrowRight size={12}/>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
