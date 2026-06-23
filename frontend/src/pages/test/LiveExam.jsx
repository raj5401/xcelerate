import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Users, Trophy, Lock, Loader, ChevronRight, Calendar, AlertCircle } from 'lucide-react'
import api from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'
import { format, differenceInSeconds, isPast, isFuture } from 'date-fns'

function Countdown({ targetDate, onStart }) {
  const [diff, setDiff] = useState(differenceInSeconds(new Date(targetDate), new Date()))

  useEffect(() => {
    const t = setInterval(() => {
      const d = differenceInSeconds(new Date(targetDate), new Date())
      setDiff(d)
      if (d <= 0) { clearInterval(t); onStart() }
    }, 1000)
    return () => clearInterval(t)
  }, [targetDate])

  if (diff <= 0) return null

  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60

  return (
    <div className="flex items-center justify-center gap-3">
      {[
        { val: h, label: 'Hours' },
        { val: m, label: 'Minutes' },
        { val: s, label: 'Seconds' },
      ].map(({ val, label }) => (
        <div key={label} className="text-center">
          <div className="bg-stone-900 text-white font-mono text-3xl font-bold w-16 h-16 rounded-xl flex items-center justify-center">
            {String(val).padStart(2, '0')}
          </div>
          <p className="text-xs text-stone-400 mt-1">{label}</p>
        </div>
      ))}
    </div>
  )
}

function Leaderboard({ testId, totalMarks }) {
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(true)
  const { user }                = useAuthStore()

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/tests/${testId}/results`)
        setResults(res.data)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
    // Refresh every 30 seconds
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [testId])

  if (loading) return <div className="flex justify-center py-8"><Loader size={20} className="animate-spin text-brand-500"/></div>

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
        <h3 className="font-display font-semibold text-stone-800 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500"/> Live Leaderboard
        </h3>
        <span className="text-xs text-stone-400">{results.length} submissions · auto-refreshes</span>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-10 text-stone-400">
          <Trophy size={28} className="mx-auto mb-2 opacity-20"/>
          <p className="text-sm">No submissions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-50">
          {results.map((r, i) => {
            const isMe = r.email === user?.email
            const pct  = Math.round(r.score / totalMarks * 100)
            return (
              <div key={i} className={`flex items-center gap-4 px-5 py-3 ${isMe ? 'bg-brand-50' : ''}`}>
                <div className="w-8 text-center flex-shrink-0">
                  {i < 3
                    ? <span className="text-xl">{medals[i]}</span>
                    : <span className="text-sm font-bold text-stone-400">#{i+1}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 flex items-center gap-1.5">
                    {r.name}
                    {isMe && <span className="text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded font-medium">You</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="text-xs text-stone-400 flex-shrink-0">{pct}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-stone-800">{r.score}</p>
                  <p className="text-xs text-stone-400">/{totalMarks}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LiveExam() {
  const [tests,   setTests]   = useState([])
  const [loading, setLoading] = useState(true)
  const { user }              = useAuthStore()
  const navigate              = useNavigate()
  const [now,     setNow]     = useState(new Date())

  useEffect(() => {
    api.get('/tests/scheduled')
      .then(r => setTests(r.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false))

    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function getStatus(test) {
    if (!test.scheduled_at) return 'open'
    const start = new Date(test.scheduled_at)
    const end   = new Date(start.getTime() + test.duration * 60 * 1000)
    if (isFuture(start)) return 'upcoming'
    if (isPast(end))     return 'ended'
    return 'live'
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-brand-500"/>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-semibold text-stone-900">Live Exams</h1>
        <p className="text-stone-500 text-sm mt-1">Scheduled tests — all students write at the same time</p>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-20"/>
          <p className="font-medium">No scheduled exams right now</p>
          <p className="text-sm mt-1">Check back later or browse practice tests</p>
          <button onClick={() => navigate('/mock-tests')}
            className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium">
            Browse practice tests →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {tests.map(test => {
            const status = getStatus(test)
            const start  = test.scheduled_at ? new Date(test.scheduled_at) : null
            const end    = start ? new Date(start.getTime() + test.duration * 60 * 1000) : null

            return (
              <div key={test.id} className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Status bar */}
                <div className={`px-5 py-2 text-xs font-semibold flex items-center gap-2 ${
                  status === 'live'     ? 'bg-green-500 text-white' :
                  status === 'upcoming' ? 'bg-amber-50 text-amber-700' :
                  status === 'ended'    ? 'bg-stone-100 text-stone-500' :
                  'bg-brand-50 text-brand-700'
                }`}>
                  {status === 'live'     && <><span className="w-2 h-2 bg-white rounded-full animate-pulse"/> LIVE NOW</>}
                  {status === 'upcoming' && <><Clock size={12}/> UPCOMING</>}
                  {status === 'ended'    && 'EXAM ENDED'}
                  {status === 'open'     && 'OPEN TEST'}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-display font-semibold text-stone-900">{test.title}</h2>
                      <p className="text-sm text-stone-500 mt-0.5">{test.exam} · {test.batch_class} · {test.question_count} questions</p>
                    </div>
                    <div className="flex gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1"><Clock size={11}/> {test.duration} min</span>
                      <span className="flex items-center gap-1"><Trophy size={11}/> {test.total_marks} marks</span>
                    </div>
                  </div>

                  {/* Upcoming — show countdown */}
                  {status === 'upcoming' && start && (
                    <div className="mb-6">
                      <p className="text-sm text-stone-500 text-center mb-4">
                        Exam starts at <strong>{format(start, 'dd MMM yyyy, hh:mm a')}</strong>
                      </p>
                      <Countdown targetDate={start} onStart={() => setNow(new Date())} />
                      {!user && (
                        <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <AlertCircle size={14} className="text-amber-500 flex-shrink-0"/>
                          <p className="text-xs text-amber-700">Login before the exam starts to avoid missing it.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live — show join button */}
                  {status === 'live' && (
                    <div className="mb-4">
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4 text-center">
                        <p className="text-green-700 font-semibold mb-1">Exam is LIVE!</p>
                        <p className="text-xs text-green-600">
                          Ends at {end ? format(end, 'hh:mm a') : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => user ? navigate(`/test/${test.id}/instructions`) : navigate('/login')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {user ? <>Join exam now <ChevronRight size={16}/></> : <><Lock size={14}/> Login to join</>}
                      </button>
                    </div>
                  )}

                  {/* Open test — regular start */}
                  {status === 'open' && (
                    <button
                      onClick={() => user ? navigate(`/test/${test.id}/instructions`) : navigate('/login')}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mb-4 flex items-center justify-center gap-2"
                    >
                      {user ? 'Start test' : <><Lock size={13}/> Login to attempt</>}
                    </button>
                  )}

                  {/* Leaderboard — show for live and ended */}
                  {(status === 'live' || status === 'ended' || status === 'open') && (
                    <Leaderboard testId={test.id} totalMarks={test.total_marks} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
