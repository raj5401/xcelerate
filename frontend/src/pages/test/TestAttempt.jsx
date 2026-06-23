import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Loader, Flag } from 'lucide-react'
import api from '../../hooks/useApi'

// Question status colors for palette
const Q_STATUS = {
  answered:  'bg-green-500 text-white',
  skipped:   'bg-red-100 text-red-700 border border-red-200',
  visited:   'bg-amber-100 text-amber-700 border border-amber-200',
  unvisited: 'bg-white text-stone-500 border border-stone-200',
}

function useCountdown(seconds, onExpire) {
  const [remaining, setRemaining] = useState(seconds)
  const ref = useRef(null)

  useEffect(() => {
    if (seconds <= 0) return
    setRemaining(seconds)
    ref.current = setInterval(() => {
      setRemaining(s => {
        if (s <= 1) { clearInterval(ref.current); onExpire(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [seconds])

  const mm  = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss  = String(remaining % 60).padStart(2, '0')
  const pct = remaining / seconds * 100
  const urgent = remaining < 300 // last 5 mins

  return { display: `${mm}:${ss}`, pct, urgent, remaining }
}

export default function TestAttempt() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [test,     setTest]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [current,  setCurrent]  = useState(0)
  const [answers,  setAnswers]  = useState({})   // { qid: 'A'|'B'|'C'|'D' }
  const [visited,  setVisited]  = useState({})   // { qid: true }
  const [marked,   setMarked]   = useState({})   // flagged for review
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    api.get(`/tests/${id}`)
      .then(r => { setTest(r.data); setVisited({ [r.data.questions[0]?.id]: true }) })
      .catch(() => navigate('/mock-tests'))
      .finally(() => setLoading(false))
  }, [id])

  const submit = useCallback(async () => {
    if (submitted.current) return
    submitted.current = true
    setSubmitting(true)
    try {
      const res = await api.post(`/tests/${id}/submit`, { answers })
      navigate(`/test/${id}/result`, { state: { score: res.data.score, answers, test, justSubmitted: true } })
    } catch(e) {
      console.error(e)
      setSubmitting(false)
      submitted.current = false
    }
  }, [answers, id, test])

  const { display, pct, urgent } = useCountdown(
    test ? test.duration * 60 : 0,
    submit
  )

  if (loading || !test) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size={24} className="animate-spin text-brand-500" />
    </div>
  )

  const questions = test.questions || []
  const q = questions[current]
  if (!q) return null

  function selectAnswer(opt) {
    setAnswers(a => ({ ...a, [q.id]: opt }))
    setVisited(v => ({ ...v, [q.id]: true }))
  }

  function clearAnswer() {
    setAnswers(a => { const n = {...a}; delete n[q.id]; return n })
  }

  function goTo(idx) {
    setCurrent(idx)
    setVisited(v => ({ ...v, [questions[idx].id]: true }))
  }

  function getStatus(qid) {
    if (answers[qid]) return 'answered'
    if (marked[qid])  return 'skipped'
    if (visited[qid]) return 'visited'
    return 'unvisited'
  }

  const answeredCount = Object.keys(answers).length
  const skippedCount  = questions.length - answeredCount

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* Top bar */}
      <div className={`sticky top-0 z-40 transition-colors ${urgent ? 'bg-red-600' : 'bg-stone-900'}`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="text-white">
            <p className="text-xs text-stone-400">{test.title}</p>
            <p className="text-sm font-medium">{answeredCount}/{questions.length} answered</p>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Clock size={16} className={urgent ? 'text-red-200 animate-pulse' : 'text-stone-400'} />
              <span className={`font-mono text-xl font-bold ${urgent ? 'text-white' : 'text-white'}`}>
                {display}
              </span>
            </div>
            <div className="w-32 h-1 bg-stone-700 rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-red-300' : 'bg-brand-400'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Submit test
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 flex-1 w-full">

        {/* Question area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">
                Question {current + 1} of {questions.length}
              </span>
              <button onClick={() => setMarked(m => ({ ...m, [q.id]: !m[q.id] }))}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-colors ${
                  marked[q.id] ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-stone-200 text-stone-400 hover:border-stone-300'
                }`}>
                <Flag size={12} /> {marked[q.id] ? 'Marked' : 'Mark for review'}
              </button>
            </div>
            <p className="text-stone-800 font-medium leading-relaxed mb-6">{q.text}</p>

            <div className="space-y-3">
              {['A','B','C','D'].map(opt => {
                const val = q[`option_${opt.toLowerCase()}`]
                const selected = answers[q.id] === opt
                return (
                  <button key={opt} onClick={() => selectAnswer(opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      selected
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                    }`}>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-mono mr-3 flex-shrink-0
                      border-current opacity-60">{opt}</span>
                    {val}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={clearAnswer} className="text-sm text-stone-400 hover:text-stone-600 px-3 py-2 rounded-lg border border-stone-200 hover:border-stone-300">
              Clear response
            </button>
            <div className="flex gap-2">
              <button onClick={() => goTo(current - 1)} disabled={current === 0}
                className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900 disabled:opacity-30 px-3 py-2 rounded-lg border border-stone-200 hover:border-stone-300 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={15} /> Prev
              </button>
              <button onClick={() => goTo(current + 1)} disabled={current === questions.length - 1}
                className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900 disabled:opacity-30 px-3 py-2 rounded-lg border border-stone-200 hover:border-stone-300 disabled:cursor-not-allowed transition-colors">
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Question palette */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sticky top-20">
            <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-3">Question palette</h3>

            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((qq, i) => (
                <button key={qq.id} onClick={() => goTo(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    i === current ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                  } ${Q_STATUS[getStatus(qq.id)]}`}>
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs">
              {[
                { color: 'bg-green-500', label: `Answered (${answeredCount})` },
                { color: 'bg-amber-100 border border-amber-200', label: `Visited (${Object.keys(visited).length - answeredCount})` },
                { color: 'bg-white border border-stone-200', label: `Not visited (${questions.length - Object.keys(visited).length})` },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${l.color}`} />
                  <span className="text-stone-500">{l.label}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowConfirm(true)}
              className="w-full mt-4 bg-brand-500 text-white text-xs font-medium py-2.5 rounded-lg hover:bg-brand-600">
              Submit test
            </button>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <h3 className="font-display font-semibold text-stone-800">Submit test?</h3>
            </div>
            <div className="space-y-1.5 mb-5 text-sm text-stone-600">
              <p>Answered: <span className="font-medium text-green-700">{answeredCount}</span></p>
              <p>Unanswered: <span className="font-medium text-red-500">{skippedCount}</span></p>
              <p className="text-xs text-stone-400 mt-2">Once submitted, you cannot change your answers.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={submit} disabled={submitting}
                className="flex-1 bg-brand-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-brand-600 disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Yes, submit'}
              </button>
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 border border-stone-200 text-stone-600 text-sm py-2.5 rounded-xl hover:border-stone-300">
                Continue test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
