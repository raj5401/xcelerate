import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, Clock, CheckCircle, Eye, Send, EyeOff, Loader, Medal } from 'lucide-react'
import api from '../../hooks/useApi'

export default function AdminTestSubmissions() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [test,       setTest]       = useState(null)
  const [submissions,setSubmissions]= useState([])
  const [loading,    setLoading]    = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [published,  setPublished]  = useState(false)

  async function load() {
    try {
      const [t, s] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/tests/${id}/submissions`),
      ])
      setTest(t.data)
      setSubmissions(s.data)
      setPublished(t.data.results_published || false)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function togglePublish() {
    setPublishing(true)
    try {
      if (published) {
        await api.post(`/tests/${id}/unpublish`)
        setPublished(false)
      } else {
        await api.post(`/tests/${id}/publish`)
        setPublished(true)
      }
    } catch(e) { alert('Failed') }
    finally { setPublishing(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={20} className="animate-spin text-brand-500"/>
    </div>
  )

  const submitted  = submissions.filter(s => s.status === 'submitted')
  const inProgress = submissions.filter(s => s.status === 'in_progress')
  const medals     = ['🥇','🥈','🥉']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/admin/tests')}
          className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 flex-shrink-0 mt-0.5">
          <ArrowLeft size={16}/>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-semibold text-stone-900">{test?.title}</h1>
          <p className="text-sm text-stone-400 mt-0.5">{test?.exam} · {test?.duration} min · {test?.total_marks} marks</p>
        </div>
        {/* Publish toggle */}
        <button
          onClick={togglePublish}
          disabled={publishing || submitted.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
            published
              ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {publishing ? <Loader size={14} className="animate-spin"/> :
            published ? <><EyeOff size={14}/> Unpublish results</> :
            <><Send size={14}/> Publish results</>
          }
        </button>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl p-4 flex items-center gap-3 ${
        published ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
      }`}>
        {published
          ? <><CheckCircle size={18} className="text-green-500 flex-shrink-0"/>
              <div>
                <p className="text-sm font-semibold text-green-800">Results published</p>
                <p className="text-xs text-green-600">Students can now see their scores and the leaderboard.</p>
              </div>
            </>
          : <><Clock size={18} className="text-amber-500 flex-shrink-0"/>
              <div>
                <p className="text-sm font-semibold text-amber-800">Results not published</p>
                <p className="text-xs text-amber-600">Students see "submitted" confirmation. Review below and click Publish when ready.</p>
              </div>
            </>
        }
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-display font-bold text-stone-900">{submitted.length}</div>
          <div className="text-xs text-stone-400 mt-0.5">Submitted</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-display font-bold text-amber-500">{inProgress.length}</div>
          <div className="text-xs text-stone-400 mt-0.5">In progress</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-display font-bold text-brand-500">
            {submitted.length > 0 ? Math.round(submitted.reduce((a,s) => a + Number(s.score), 0) / submitted.length) : 0}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">Avg score</div>
        </div>
      </div>

      {/* Submissions table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
            <Users size={14} className="text-brand-500"/> All submissions
          </h2>
          <button onClick={load} className="text-xs text-stone-400 hover:text-stone-600">Refresh</button>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Users size={28} className="mx-auto mb-2 opacity-20"/>
            <p className="text-sm">No submissions yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Rank</th>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Score</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Percentage</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {submissions.map((s, i) => {
                const pct = Math.round(Number(s.score) / Number(s.total_marks) * 100)
                return (
                  <tr key={s.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3">
                      {s.status === 'submitted' ? (
                        i < 3
                          ? <span className="text-xl">{medals[i]}</span>
                          : <span className="text-sm font-bold text-stone-500">#{s.rank}</span>
                      ) : <span className="text-xs text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                          {s.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-stone-800">{s.name}</p>
                          <p className="text-xs text-stone-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {s.status === 'submitted' ? (
                        <div>
                          <span className="font-display font-semibold text-stone-800">{s.score}</span>
                          <span className="text-stone-400 text-xs">/{s.total_marks}</span>
                          <div className="w-24 h-1.5 bg-stone-100 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${pct}%` }}/>
                          </div>
                        </div>
                      ) : <span className="text-stone-300 text-xs">Not submitted</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {s.status === 'submitted'
                        ? <span className={`text-sm font-semibold ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        s.status === 'submitted' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
                      }`}>{s.status === 'submitted' ? 'Submitted' : 'In progress'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400 hidden lg:table-cell">
                      {s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Publish CTA if not published */}
      {!published && submitted.length > 0 && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">{submitted.length} student{submitted.length !== 1 ? 's' : ''} have submitted</p>
            <p className="text-xs text-stone-500 mt-0.5">Review scores above and publish when ready</p>
          </div>
          <button onClick={togglePublish} disabled={publishing}
            className="flex items-center gap-2 bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-600 disabled:opacity-60">
            {publishing ? <Loader size={14} className="animate-spin"/> : <Send size={14}/>}
            Publish results
          </button>
        </div>
      )}
    </div>
  )
}
