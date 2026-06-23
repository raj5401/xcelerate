import { useState, useEffect, useRef } from 'react'
import { Clock, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'

// Sample questions
const questions = [
  {
    id: 1,
    text: 'A ball is thrown vertically upward with velocity 20 m/s. The maximum height reached is:',
    options: ['10 m', '20 m', '40 m', '80 m'],
    correct: 1,
  },
  {
    id: 2,
    text: 'The SI unit of electric field intensity is:',
    options: ['N/C', 'V/m²', 'C/N', 'N·m/C'],
    correct: 0,
  },
  {
    id: 3,
    text: 'Which of the following has the highest frequency?',
    options: ['Radio waves', 'Microwaves', 'X-rays', 'Infrared rays'],
    correct: 2,
  },
  {
    id: 4,
    text: 'The work done in moving a charge Q through potential difference V is:',
    options: ['Q/V', 'QV', 'V/Q', 'Q²V'],
    correct: 1,
  },
  {
    id: 5,
    text: 'A body moving in a circle at constant speed has:',
    options: ['Constant velocity', 'Zero acceleration', 'Centripetal acceleration', 'No net force'],
    correct: 2,
  },
]

const TOTAL_SECONDS = 10 * 60 // 10 minutes for demo

function useTimer(start, onExpire) {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)
  const ref = useRef(null)

  useEffect(() => {
    if (!start) return
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(ref.current); onExpire(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [start])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const pct = (seconds / TOTAL_SECONDS) * 100
  return { display: `${mm}:${ss}`, pct, seconds }
}

export default function MockTest() {
  const [stage, setStage]     = useState('intro')   // intro | test | result
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timerOn, setTimerOn] = useState(false)
  const { display, pct, seconds } = useTimer(timerOn, () => setStage('result'))

  function startTest() {
    setStage('test')
    setTimerOn(true)
  }

  function pick(qid, idx) {
    setAnswers(a => ({ ...a, [qid]: idx }))
  }

  function submit() {
    setStage('result')
    setTimerOn(false)
  }

  const score = questions.filter(q => answers[q.id] === q.correct).length

  if (stage === 'intro') return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl mb-6">
        <Clock size={28} className="text-brand-500" />
      </div>
      <h1 className="text-3xl font-display font-semibold text-stone-900 mb-3">Physics mock test</h1>
      <p className="text-stone-500 mb-2">JEE / NEET level — Class 11 & 12</p>
      <div className="flex justify-center gap-6 text-sm text-stone-500 mb-8">
        <span>5 questions</span>
        <span>·</span>
        <span>10 minutes</span>
        <span>·</span>
        <span>+4 / −1 marking</span>
      </div>
      <button
        onClick={startTest}
        className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
      >
        Start test
      </button>
    </div>
  )

  if (stage === 'result') return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2 text-center">Result</h1>
      <div className="text-center mb-10">
        <div className="text-6xl font-display font-bold text-brand-500 mb-1">{score}/{questions.length}</div>
        <p className="text-stone-500">{score >= 4 ? 'Excellent!' : score >= 2 ? 'Good effort!' : 'Keep practising!'}</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const chosen = answers[q.id]
          const correct = q.correct
          const isRight = chosen === correct
          return (
            <div key={q.id} className={`border rounded-xl p-4 ${isRight ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}>
              <p className="text-sm font-medium text-stone-800 mb-3">Q{i+1}. {q.text}</p>
              {q.options.map((opt, idx) => (
                <div key={idx} className={`text-xs px-3 py-1.5 rounded-lg mb-1 ${
                  idx === correct ? 'bg-green-100 text-green-800 font-medium' :
                  idx === chosen && !isRight ? 'bg-red-100 text-red-700' : 'text-stone-500'
                }`}>
                  {idx === correct ? '✓ ' : idx === chosen ? '✗ ' : '  '}{opt}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => { setStage('intro'); setAnswers({}); setCurrent(0) }}
        className="mt-8 w-full bg-brand-500 text-white font-medium py-3 rounded-xl hover:bg-brand-600 transition-colors"
      >
        Try again
      </button>
    </div>
  )

  const q = questions[current]
  const urgent = seconds < 60

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Timer bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-stone-500">Question {current + 1} of {questions.length}</span>
          <span className={`flex items-center gap-1.5 text-sm font-mono font-medium ${urgent ? 'text-red-500' : 'text-stone-700'}`}>
            {urgent && <AlertCircle size={14} />}
            {display}
          </span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-red-400' : 'bg-brand-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-stone-100 rounded-2xl p-6 mb-4 shadow-sm">
        <p className="font-medium text-stone-800 leading-relaxed">{q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => pick(q.id, idx)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
              answers[q.id] === idx
                ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
            }`}
          >
            <span className="inline-block w-6 font-mono text-stone-400 mr-2">{String.fromCharCode(65 + idx)}.</span>
            {opt}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrent(c => c - 1)}
          disabled={current === 0}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="flex items-center gap-1 text-sm text-stone-700 hover:text-stone-900 transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={submit}
            className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
          >
            Submit test
          </button>
        )}
      </div>
    </div>
  )
}
