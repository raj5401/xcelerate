import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, BookOpen, AlertCircle, CheckCircle, Trophy, Loader, Lock } from 'lucide-react'
import api from '../../hooks/useApi'
import { useAuthStore } from '../../store/authStore'

export default function TestInstructions() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const [test,     setTest]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [starting, setStarting] = useState(false)
  const [agreed,   setAgreed]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    api.get(`/tests/${id}`)
      .then(r => setTest(r.data))
      .catch(() => navigate('/mock-tests'))
      .finally(() => setLoading(false))
  }, [id])

  async function startTest() {
    if (!user) { navigate('/login'); return }
    setStarting(true)
    setError('')
    try {
      await api.post(`/tests/${id}/start`)
      navigate(`/test/${id}/attempt`)
    } catch(e) {
      const msg = e.response?.data?.message || 'Failed to start test'
      setError(msg)
      setStarting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-brand-500" />
    </div>
  )
  if (!test) return null

  const questions = test.questions || []

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-50 rounded-2xl mb-4">
          <BookOpen size={24} className="text-brand-500" />
        </div>
        <h1 className="text-2xl font-display font-semibold text-stone-900 mb-1">{test.title}</h1>
        <p className="text-stone-500 text-sm">{test.exam} · {test.batch_class}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: BookOpen, label: 'Questions', value: questions.length },
          { icon: Clock,    label: 'Duration',  value: `${test.duration} min` },
          { icon: Trophy,   label: 'Max marks', value: test.total_marks },
        ].map(s => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-4 text-center shadow-sm">
            <s.icon size={16} className="text-brand-500 mx-auto mb-1.5" />
            <div className="text-lg font-display font-semibold text-stone-800">{s.value}</div>
            <div className="text-xs text-stone-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-stone-100 rounded-2xl p-5 mb-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">Instructions</h2>
        <div className="space-y-2.5">
          {[
            `This test has ${questions.length} questions to be completed in ${test.duration} minutes.`,
            'Each correct answer carries +4 marks. Each wrong answer carries −1 mark.',
            'Unanswered questions carry 0 marks.',
            'You can navigate between questions using the question palette.',
            'Timer starts as soon as you click "Start Test".',
            'Test will auto-submit when the timer reaches zero.',
            'You can submit early by clicking the "Submit Test" button.',
            'Once submitted, answers cannot be changed.',
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              {rule}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={14} className="text-amber-600" />
          <span className="text-sm font-medium text-amber-800">Marking scheme</span>
        </div>
        <div className="flex gap-6 text-sm">
          <span className="text-green-700 font-medium">Correct: +4</span>
          <span className="text-red-600 font-medium">Wrong: −1</span>
          <span className="text-stone-500">Skipped: 0</span>
        </div>
      </div>

      {/* Not logged in warning */}
      {!user && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center gap-2">
          <Lock size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">You must be logged in to attempt this test.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 accent-brand-500" />
        <span className="text-sm text-stone-600">
          I have read all instructions and agree to attempt this test honestly without any external help.
        </span>
      </label>

      <button
        onClick={user ? startTest : () => navigate('/login')}
        disabled={!agreed || starting}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
      >
        {starting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader size={15} className="animate-spin" /> Starting test...
          </span>
        ) : !user ? 'Login to start test' : `Start Test — ${test.duration} minutes`}
      </button>
    </div>
  )
}
