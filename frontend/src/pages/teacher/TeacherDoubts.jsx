import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle, Send, Loader } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../hooks/useApi'

export default function TeacherDoubts() {
  const { user }    = useAuthStore()
  const [doubts,    setDoubts]  = useState([])
  const [loading,   setLoading] = useState(true)
  const [filter,    setFilter]  = useState('open')
  const [answers,   setAnswers] = useState({})
  const [saving,    setSaving]  = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await api.get('/doubts')
      setDoubts(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function submitAnswer(doubtId) {
    const answer = answers[doubtId]?.trim()
    if (!answer) return
    setSaving(doubtId)
    try {
      const res = await api.patch(`/doubts/${doubtId}/answer`, { answer })
      setDoubts(d => d.map(x => x.id === doubtId
        ? { ...x, answer, status: 'answered', answered_by_name: user.name, answered_at: new Date().toISOString() }
        : x
      ))
      setAnswers(a => { const n = { ...a }; delete n[doubtId]; return n })
    } catch (err) { alert('Failed to submit answer') }
    finally { setSaving(null) }
  }

  const filtered = doubts.filter(d => filter === 'all' || d.status === filter)

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader size={24} className="animate-spin text-indigo-500" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">Student Doubts</h1>
          <p className="text-stone-500 text-sm mt-1">
            {doubts.filter(d => d.status === 'open').length} open · {doubts.filter(d => d.status === 'answered').length} answered
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit mb-6">
        {[['open', 'Open'], ['answered', 'Answered'], ['all', 'All']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === val ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-12 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">
            {filter === 'open' ? 'No open doubts! All caught up.' : 'No doubts here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(d => (
            <div key={d.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${
              d.status === 'open' ? 'border-amber-200' : 'border-green-200'
            }`}>
              {/* Question */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    d.status === 'open' ? 'bg-amber-50' : 'bg-green-50'
                  }`}>
                    <MessageCircle size={14} className={d.status === 'open' ? 'text-amber-600' : 'text-green-600'} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-800">{d.question}</p>
                    <p className="text-xs text-stone-400 mt-1">
                      by {d.student_name} · {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-3 ${
                  d.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  {d.status === 'open' ? 'Unanswered' : '✓ Answered'}
                </span>
              </div>

              {/* Existing answer */}
              {d.answer && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">Your answer:</p>
                  <p className="text-sm text-stone-700 leading-relaxed">{d.answer}</p>
                </div>
              )}

              {/* Answer form (only for open doubts) */}
              {d.status === 'open' && (
                <div className="flex gap-2 mt-3">
                  <input
                    value={answers[d.id] || ''}
                    onChange={e => setAnswers(a => ({ ...a, [d.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && submitAnswer(d.id)}
                    placeholder="Type your answer..."
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => submitAnswer(d.id)}
                    disabled={saving === d.id || !answers[d.id]?.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    <Send size={13} /> {saving === d.id ? 'Saving...' : 'Answer'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
