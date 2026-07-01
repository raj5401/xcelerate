import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock, BookOpen, Trophy, ChevronRight, Loader,
  Lock, ArrowRight, Users, CheckCircle, Medal
} from 'lucide-react'
import api from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

const SUBJECT_META = {
  Physics:     { emoji: '⚛️', bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  Biology:     { emoji: '🧬', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  Mathematics: { emoji: '📐', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  Chemistry:   { emoji: '🧪', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
}

function MedalIcon({ rank }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="text-xs font-bold text-stone-400 w-6 text-center">#{rank}</span>
}

export default function TestList() {
  const { user }    = useAuthStore()
  const navigate    = useNavigate()
  const [tests,     setTests]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [subject,   setSubject]   = useState('All')
  const [classLevel,setClassLevel]= useState('All')
  const [selected,  setSelected]  = useState(null)   // expanded test id
  const [leaderboard, setLeaderboard] = useState({}) // testId -> []
  const [loadingLb,   setLoadingLb]   = useState(null)

  useEffect(() => {
    api.get('/tests')
      .then(r => setTests(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function toggleTest(t) {
    if (selected === t.id) { setSelected(null); return }
    setSelected(t.id)
    // Load leaderboard if results are published
    if (t.results_published && !leaderboard[t.id]) {
      setLoadingLb(t.id)
      try {
        const res = await api.get(`/tests/${t.id}/results`)
        setLeaderboard(lb => ({ ...lb, [t.id]: res.data.slice(0, 5) }))
      } catch { /* results not available */ }
      finally { setLoadingLb(null) }
    }
  }

  function handleAttempt(t) {
    if (!user) { navigate('/login'); return }
    navigate(`/test/${t.id}/instructions`)
  }

  const subjects    = ['All', 'Physics', 'Biology', 'Mathematics', 'Chemistry']
  const classLevels = ['All', '11', '12']

  const filtered = tests.filter(t => {
    const subjectOk = subject === 'All' || t.subject === subject
    const classOk   = classLevel === 'All' || t.class_level === classLevel
    return subjectOk && classOk
  })

  const upcoming = filtered.filter(t => t.scheduled_at && new Date(t.scheduled_at) > new Date())
  const available = filtered.filter(t => !t.scheduled_at || new Date(t.scheduled_at) <= new Date())

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-stone-900 mb-2">Mock Tests</h1>
        <p className="text-stone-500">
          Chapter-wise tests for PUC 11 & 12 — Physics, Biology, Maths, Chemistry.
          {user ? '' : ' Login to attempt tests and track your scores.'}
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { value: tests.length,                              label: 'Tests available', icon: BookOpen },
          { value: tests.reduce((s,t) => s + Number(t.question_count||0), 0), label: 'Total questions', icon: CheckCircle },
          { value: tests.filter(t => t.results_published).length, label: 'Results published', icon: Trophy },
        ].map(s => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex justify-center mb-1">
              <s.icon size={16} className="text-indigo-500" />
            </div>
            <div className="text-2xl font-display font-bold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <p className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wide">Subject</p>
          <div className="flex gap-1.5 flex-wrap">
            {subjects.map(s => {
              const meta = SUBJECT_META[s]
              return (
                <button key={s} onClick={() => setSubject(s)}
                  className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    subject === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-indigo-300'
                  }`}>
                  {meta ? `${meta.emoji} ${s}` : s}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <p className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wide">Class</p>
          <div className="flex gap-1.5">
            {classLevels.map(cl => (
              <button key={cl} onClick={() => setClassLevel(cl)}
                className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${
                  classLevel === cl
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-indigo-300'
                }`}>
                {cl === 'All' ? 'All Classes' : `PUC ${cl}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming tests */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={14} /> Upcoming Tests
          </h2>
          <div className="space-y-2">
            {upcoming.map(t => {
              const meta = SUBJECT_META[t.subject] || {}
              return (
                <div key={t.id} className={`border-2 ${meta.border || 'border-stone-200'} rounded-xl px-5 py-3.5 flex items-center justify-between ${meta.bg || 'bg-stone-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{t.title}</p>
                      <p className="text-xs text-stone-500">
                        {t.subject} · PUC {t.class_level} · {t.duration} min · {t.total_marks} marks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-amber-600">
                      🕐 {new Date(t.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-stone-400">
                      {new Date(t.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available tests */}
      <div>
        {available.length > 0 && (
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Trophy size={14} /> Available Tests ({available.length})
          </h2>
        )}

        {available.length === 0 && upcoming.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-100 rounded-2xl">
            <BookOpen size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">No tests match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {available.map(t => {
              const meta    = SUBJECT_META[t.subject] || {}
              const isOpen  = selected === t.id
              const lb      = leaderboard[t.id] || []

              return (
                <div key={t.id} className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
                  isOpen ? (meta.border || 'border-indigo-200') : 'border-stone-100 hover:border-stone-200'
                } shadow-sm hover:shadow-md`}>

                  {/* Test row */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => toggleTest(t)}>

                    {/* Subject icon */}
                    <div className={`w-12 h-12 rounded-xl ${meta.bg || 'bg-stone-50'} flex items-center justify-center flex-shrink-0 text-2xl`}>
                      {meta.emoji || '📝'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${meta.badge || 'bg-stone-100 text-stone-600'}`}>
                          {t.subject}
                        </span>
                        <span className="text-xs text-stone-400">PUC {t.class_level}</span>
                        {t.results_published && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            ✓ Results out
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-semibold text-stone-800 truncate">{t.title}</h3>
                      <div className="flex gap-4 text-xs text-stone-400 mt-1">
                        <span className="flex items-center gap-1"><BookOpen size={11}/> {t.question_count || 0} Qs</span>
                        <span className="flex items-center gap-1"><Clock size={11}/> {t.duration} min</span>
                        <span className="flex items-center gap-1"><Trophy size={11}/> {t.total_marks} marks</span>
                        <span className="text-stone-300">+4 / −1</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user ? (
                        <button
                          onClick={e => { e.stopPropagation(); handleAttempt(t) }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
                          Attempt <ArrowRight size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); navigate('/login') }}
                          className="border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
                          <Lock size={11}/> Login to attempt
                        </button>
                      )}
                      <ChevronRight size={16} className={`text-stone-300 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded: leaderboard + details */}
                  {isOpen && (
                    <div className={`border-t border-stone-100 p-5 ${meta.bg || 'bg-stone-50'}`}>
                      <div className="grid sm:grid-cols-2 gap-6">

                        {/* Test details */}
                        <div>
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">Test details</h4>
                          <div className="space-y-2">
                            {[
                              ['Subject',        t.subject],
                              ['Class',          `PUC ${t.class_level}`],
                              ['Duration',       `${t.duration} minutes`],
                              ['Total marks',    `${t.total_marks} marks`],
                              ['Questions',      `${t.question_count || 0} questions`],
                              ['Marking scheme', '+4 correct, −1 wrong, 0 skipped'],
                            ].map(([label, value]) => (
                              <div key={label} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                                <span className="text-xs text-stone-400">{label}</span>
                                <span className="text-xs font-semibold text-stone-700">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Leaderboard */}
                        <div>
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <Trophy size={12} /> Leaderboard
                          </h4>
                          {!t.results_published ? (
                            <div className="bg-white rounded-xl p-4 text-center">
                              <Lock size={20} className="text-stone-300 mx-auto mb-2" />
                              <p className="text-xs text-stone-400">Results will be published after the test</p>
                            </div>
                          ) : loadingLb === t.id ? (
                            <div className="flex justify-center py-4">
                              <Loader size={16} className="animate-spin text-indigo-500" />
                            </div>
                          ) : lb.length === 0 ? (
                            <div className="bg-white rounded-xl p-4 text-center">
                              <p className="text-xs text-stone-400">No attempts yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lb.map((entry, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5">
                                  <MedalIcon rank={i + 1} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-stone-800 truncate">{entry.name}</p>
                                    <p className="text-xs text-stone-400">{entry.attempted} answered</p>
                                  </div>
                                  <span className="text-sm font-bold text-indigo-600">
                                    {entry.score}/{t.total_marks}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* CTA for non-logged users */}
                          {!user && (
                            <Link to="/login"
                              className="mt-3 flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                              Login to attempt this test <ArrowRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Guest CTA */}
      {!user && filtered.length > 0 && (
        <div className="mt-10 bg-indigo-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-display font-bold mb-2">Ready to test your knowledge?</h3>
          <p className="text-indigo-200 text-sm mb-5">Create a free account to attempt tests, track your scores and see your rank</p>
          <Link to="/login"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
            Get started free <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  )
}
