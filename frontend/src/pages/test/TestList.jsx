import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, BookOpen, Trophy, ChevronRight, Loader, Filter } from 'lucide-react'
import api from '../../hooks/useApi'

const examColors = {
  JEE:    'bg-purple-50 text-purple-700 border-purple-100',
  NEET:   'bg-green-50 text-green-700 border-green-100',
  KCET:   'bg-blue-50 text-blue-700 border-blue-100',
  Boards: 'bg-amber-50 text-amber-700 border-amber-100',
  All:    'bg-stone-50 text-stone-600 border-stone-200',
}

export default function TestList() {
  const [tests,   setTests]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/tests')
      .then(r => setTests(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? tests : tests.filter(t => t.exam === filter)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size={24} className="animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-semibold text-stone-900">Mock Tests</h1>
        <p className="text-stone-500 text-sm mt-1">
          {tests.length} tests available — JEE, NEET, KCET level questions
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['All', 'JEE', 'NEET', 'KCET', 'Boards'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p>No tests available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id}
              onClick={() => navigate(`/test/${t.id}/instructions`)}
              className="bg-white border border-stone-100 rounded-2xl p-5 hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${examColors[t.exam] || examColors.All}`}>
                      {t.exam}
                    </span>
                    {t.batch_class && (
                      <span className="text-xs text-stone-400">{t.batch_class}</span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-stone-800 mb-3">{t.title}</h3>
                  <div className="flex gap-5 text-xs text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={12} /> {t.question_count || 0} questions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> {t.duration} minutes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Trophy size={12} /> {t.total_marks} marks
                    </span>
                    <span className="text-stone-400">+{4}/−1 marking</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-stone-300 group-hover:text-brand-500 transition-colors mt-1 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
