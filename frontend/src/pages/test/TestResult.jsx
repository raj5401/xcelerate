import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { Trophy, CheckCircle, XCircle, MinusCircle, BarChart2, Loader, Medal, Clock, Lock } from 'lucide-react'
import api from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

export default function TestResult() {
  const { id }       = useParams()
  const { state }    = useLocation()
  const navigate     = useNavigate()
  const { user }     = useAuthStore()
  const [test,       setTest]       = useState(state?.test || null)
  const [leaderboard,setLeaderboard]= useState([])
  const [loading,    setLoading]    = useState(true)
  const [published,  setPublished]  = useState(false)
  const [tab,        setTab]        = useState('result')

  const score   = state?.score ?? null
  const answers = state?.answers ?? {}
  const justSubmitted = state?.justSubmitted ?? false

  useEffect(() => {
    async function load() {
      try {
        // Load test info
        if (!test) {
          const t = await api.get(`/tests/${id}`)
          setTest(t.data)
        }
        // Try to load results — will 403 if not published
        const l = await api.get(`/tests/${id}/results`)
        setLeaderboard(l.data)
        setPublished(true)
      } catch(e) {
        if (e.response?.data?.not_published) {
          setPublished(false)
        }
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-brand-500" />
    </div>
  )

  // Just submitted — show success screen
  if (justSubmitted && !published) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-display font-semibold text-stone-900 mb-3">
          Test submitted successfully!
        </h1>
        <p className="text-stone-500 mb-2">
          Your answers have been recorded for <strong>{test?.title}</strong>.
        </p>
        <p className="text-stone-400 text-sm mb-8">
          Results will be published by your teacher after evaluation. You'll be able to see your score, detailed answers and leaderboard once results are released.
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Results pending</span>
          </div>
          <p className="text-sm text-amber-700">
            Your teacher will review submissions and publish results. Check back later or visit your dashboard to see when results are available.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/mock-tests" className="flex-1 text-center border border-stone-200 text-stone-600 text-sm font-medium py-3 rounded-xl hover:border-stone-300">
            More tests
          </Link>
          <Link to="/dashboard" className="flex-1 text-center bg-brand-500 text-white text-sm font-medium py-3 rounded-xl hover:bg-brand-600">
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Results not published yet — student checking results page
  if (!published && user?.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-stone-50 rounded-full mb-6">
          <Lock size={36} className="text-stone-300" />
        </div>
        <h1 className="text-2xl font-display font-semibold text-stone-900 mb-3">
          Results not published yet
        </h1>
        <p className="text-stone-500 mb-8">
          Your teacher is reviewing the submissions. Results for <strong>{test?.title}</strong> will be published soon.
        </p>
        <Link to="/dashboard" className="bg-brand-500 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-brand-600 inline-block">
          Back to dashboard
        </Link>
      </div>
    )
  }

  // Results published — show full result
  const questions    = test?.questions || []
  const correct      = questions.filter(q => answers[q.id] === q.correct).length
  const wrong        = questions.filter(q => answers[q.id] && answers[q.id] !== q.correct).length
  const skipped      = questions.length - correct - wrong
  const totalMarks   = test?.total_marks || 100
  const displayScore = score ?? leaderboard.find(r => r.email === user?.email)?.score ?? 0
  const percentage   = Math.round(displayScore / totalMarks * 100)
  const myRank       = leaderboard.findIndex(r => r.email === user?.email) + 1

  function getGrade() {
    if (percentage >= 90) return { label: 'Excellent! 🏆', color: 'text-green-600', bg: 'bg-green-50' }
    if (percentage >= 75) return { label: 'Very Good! 🎯', color: 'text-blue-600',  bg: 'bg-blue-50'  }
    if (percentage >= 60) return { label: 'Good 👍',        color: 'text-amber-600', bg: 'bg-amber-50' }
    if (percentage >= 40) return { label: 'Keep Practising 💪', color: 'text-orange-600', bg: 'bg-orange-50' }
    return { label: 'Needs Improvement 📖', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const grade = getGrade()
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Score hero */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${grade.bg} rounded-2xl mb-4`}>
          <Trophy size={28} className={grade.color} />
        </div>
        <h1 className="text-3xl font-display font-bold text-stone-900 mb-1">
          {displayScore} <span className="text-stone-400 text-xl font-normal">/ {totalMarks}</span>
        </h1>
        <p className={`text-lg font-semibold ${grade.color} mb-1`}>{grade.label}</p>
        <p className="text-stone-400 text-sm">{test?.title}</p>
        {myRank > 0 && (
          <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
            <Medal size={12}/> Rank #{myRank} out of {leaderboard.length}
          </div>
        )}
      </div>

      {/* Stats */}
      {questions.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Score',   value: `${percentage}%`,  color: 'text-stone-900' },
            { label: 'Correct', value: correct,            color: 'text-green-600' },
            { label: 'Wrong',   value: wrong,              color: 'text-red-500' },
            { label: 'Skipped', value: skipped,            color: 'text-stone-400' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-3 text-center shadow-sm">
              <div className={`text-xl font-display font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-50 rounded-xl p-1 mb-5">
        {[['leaderboard','Leaderboard'], questions.length > 0 ? ['result','Answer Review'] : null].filter(Boolean).map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
              tab === k ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}>{label}</button>
        ))}
      </div>

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50">
            <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <BarChart2 size={15} className="text-brand-500"/> Leaderboard · {leaderboard.length} students
            </h3>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-center py-8 text-stone-400 text-sm">No results yet</p>
          ) : (
            <div className="divide-y divide-stone-50">
              {leaderboard.map((r, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-3 ${r.email === user?.email ? 'bg-brand-50' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-stone-300 text-white' :
                    i === 2 ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>{i < 3 ? medals[i] : i+1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-800">
                      {r.name} {r.email === user?.email && <span className="text-brand-500 text-xs">(you)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${Math.round(r.score/totalMarks*100)}%` }}/>
                      </div>
                      <span className="text-xs text-stone-400">{Math.round(r.score/totalMarks*100)}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-semibold text-stone-800">{r.score}</p>
                    <p className="text-xs text-stone-400">/{totalMarks}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Answer review */}
      {tab === 'result' && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, i) => {
            const chosen  = answers[q.id]
            const isRight = chosen === q.correct
            const isWrong = chosen && !isRight
            return (
              <div key={q.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${
                isRight ? 'border-green-100' : isWrong ? 'border-red-100' : 'border-stone-100'
              }`}>
                <div className="flex items-start gap-2 mb-3">
                  {isRight ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0"/>
                    : isWrong ? <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0"/>
                    : <MinusCircle size={16} className="text-stone-300 mt-0.5 flex-shrink-0"/>}
                  <p className="text-sm font-medium text-stone-800">Q{i+1}. {q.text}</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 ml-5">
                  {['A','B','C','D'].map(opt => {
                    const val = q[`option_${opt.toLowerCase()}`]
                    const isCorrectOpt = opt === q.correct
                    const isChosenOpt  = opt === chosen
                    return (
                      <div key={opt} className={`text-xs px-3 py-1.5 rounded-lg ${
                        isCorrectOpt ? 'bg-green-100 text-green-800 font-medium'
                          : isChosenOpt ? 'bg-red-100 text-red-700'
                          : 'text-stone-400'
                      }`}>
                        <span className="font-mono mr-1">{opt}.</span>{val}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Link to="/mock-tests" className="flex-1 text-center border border-stone-200 text-stone-600 text-sm font-medium py-3 rounded-xl hover:border-stone-300">
          Back to tests
        </Link>
        <Link to="/dashboard" className="flex-1 text-center bg-brand-500 text-white text-sm font-medium py-3 rounded-xl hover:bg-brand-600">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
