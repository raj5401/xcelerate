import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, ChevronUp, Loader, ClipboardList, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../hooks/useApi'

const EMPTY_Q = { text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct: 'A', marks: 4, negative: 1 }

export default function TeacherTests() {
  const { user }     = useAuthStore()
  const [tests,      setTests]      = useState([])
  const [courses,    setCourses]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState(null)
  const [questions,  setQuestions]  = useState({})  // testId -> []
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const [form, setForm] = useState({
    title: '', course_id: '', class_level: '', duration: 60, total_marks: 40, scheduled_at: ''
  })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [t, c] = await Promise.all([api.get('/tests'), api.get('/courses')])
      setTests(t.data.filter(x => x.teacher_id === user.id))
      setCourses(c.data.filter(c => c.teacher_id === user.id || c.teacher_name === user.name))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function loadQuestions(testId) {
    if (questions[testId]) return
    try {
      const res = await api.get(`/tests/${testId}/questions-admin`)
      setQuestions(q => ({ ...q, [testId]: res.data }))
    } catch (err) { console.error(err) }
  }

  async function createTest(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/tests', {
        ...form,
        subject:     user.subject,
        class_level: form.class_level,
        course_id:   form.course_id || null,
        scheduled_at: form.scheduled_at || null,
      })
      setTests(t => [res.data, ...t])
      setForm({ title: '', course_id: '', class_level: '', duration: 60, total_marks: 40, scheduled_at: '' })
      setShowForm(false)
    } catch (err) { alert(err.response?.data?.message || 'Failed to create test') }
    finally { setSaving(false) }
  }

  async function deleteTest(id) {
    if (!confirm('Delete this test?')) return
    try {
      await api.delete(`/tests/${id}`)
      setTests(t => t.filter(x => x.id !== id))
    } catch (err) { alert('Failed to delete') }
  }

  async function togglePublish(test) {
    try {
      const endpoint = test.results_published ? `/tests/${test.id}/unpublish` : `/tests/${test.id}/publish`
      await api.post(endpoint)
      setTests(t => t.map(x => x.id === test.id ? { ...x, results_published: !x.results_published } : x))
    } catch (err) { alert('Failed to update') }
  }

  async function addQuestion(testId) {
    const newQ = { ...EMPTY_Q }
    const updated = [...(questions[testId] || []), { ...newQ, _new: true, _id: Date.now() }]
    setQuestions(q => ({ ...q, [testId]: updated }))
  }

  async function saveQuestion(testId, idx) {
    const q = questions[testId][idx]
    if (!q.text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
      alert('Fill all question fields'); return
    }
    try {
      const res = await api.post(`/tests/${testId}/questions`, { questions: [q] })
      // reload questions
      const fresh = await api.get(`/tests/${testId}/questions-admin`)
      setQuestions(prev => ({ ...prev, [testId]: fresh.data }))
    } catch (err) { alert('Failed to save question') }
  }

  async function deleteQuestion(testId, qid) {
    try {
      await api.delete(`/tests/${testId}/questions/${qid}`)
      setQuestions(q => ({ ...q, [testId]: q[testId].filter(x => x.id !== qid) }))
    } catch (err) { alert('Failed to delete question') }
  }

  function updateQuestion(testId, idx, field, value) {
    setQuestions(prev => {
      const updated = [...prev[testId]]
      updated[idx] = { ...updated[idx], [field]: value }
      return { ...prev, [testId]: updated }
    })
  }

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader size={24} className="animate-spin text-indigo-500" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">Tests</h1>
          <p className="text-stone-500 text-sm mt-1">{tests.length} tests created</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={15} /> New test
        </button>
      </div>

      {/* Create test form */}
      {showForm && (
        <form onSubmit={createTest} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-stone-800 mb-4">Create new test</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-500 mb-1 block">Test title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Physics 11 — Chapter 2 Test"
                required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Course (optional)</label>
              <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">No specific course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Class level *</label>
              <select value={form.class_level} onChange={e => setForm(f => ({ ...f, class_level: e.target.value }))}
                required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">Select class</option>
                <option value="11">PUC 11</option>
                <option value="12">PUC 12</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Duration (minutes) *</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                min="10" max="300" required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Total marks *</label>
              <input type="number" value={form.total_marks} onChange={e => setForm(f => ({ ...f, total_marks: e.target.value }))}
                min="10" required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Schedule (optional)</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {saving ? 'Creating...' : 'Create test'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-stone-200 text-stone-600 text-sm px-5 py-2.5 rounded-xl hover:border-stone-300 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Test list */}
      {tests.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-12 text-center">
          <ClipboardList size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">No tests yet. Create your first test above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(t => {
            const isOpen = expanded === t.id
            const qs     = questions[t.id] || []
            return (
              <div key={t.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Test header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={15} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{t.title}</p>
                      <p className="text-xs text-stone-400">
                        PUC {t.class_level} · {t.duration} min · {t.total_marks} marks · {t.question_count || qs.length} Qs
                        {t.scheduled_at && ` · ${new Date(t.scheduled_at).toLocaleDateString('en-IN')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => togglePublish(t)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                        t.results_published
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}>
                      {t.results_published ? <><Eye size={11}/> Published</> : <><EyeOff size={11}/> Draft</>}
                    </button>
                    <Link to={`/admin/tests/${t.id}/submissions`}
                      className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      Submissions
                    </Link>
                    <button onClick={() => {
                      setExpanded(isOpen ? null : t.id)
                      if (!isOpen) loadQuestions(t.id)
                    }} className="text-stone-400 hover:text-stone-600 transition-colors p-1">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => deleteTest(t.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Questions panel */}
                {isOpen && (
                  <div className="border-t border-stone-100 p-5 bg-stone-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-stone-700">Questions ({qs.length})</h4>
                      <button onClick={() => addQuestion(t.id)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Plus size={11} /> Add question
                      </button>
                    </div>

                    {qs.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-4">No questions yet. Add questions above.</p>
                    ) : (
                      <div className="space-y-4">
                        {qs.map((q, idx) => (
                          <div key={q.id || q._id} className={`bg-white rounded-xl border p-4 ${q._new ? 'border-indigo-300' : 'border-stone-200'}`}>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <span className="text-xs font-bold text-stone-400">Q{idx + 1}</span>
                              {!q._new && (
                                <button onClick={() => deleteQuestion(t.id, q.id)}
                                  className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            {q._new ? (
                              // Editable new question
                              <div className="space-y-2">
                                <textarea value={q.text} onChange={e => updateQuestion(t.id, idx, 'text', e.target.value)}
                                  placeholder="Question text..." rows={2}
                                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
                                <div className="grid grid-cols-2 gap-2">
                                  {['a','b','c','d'].map(opt => (
                                    <div key={opt} className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-stone-400 w-4 uppercase">{opt}</span>
                                      <input value={q[`option_${opt}`]} onChange={e => updateQuestion(t.id, idx, `option_${opt}`, e.target.value)}
                                        placeholder={`Option ${opt.toUpperCase()}`}
                                        className="flex-1 border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400" />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-stone-500">Correct:</span>
                                    <select value={q.correct} onChange={e => updateQuestion(t.id, idx, 'correct', e.target.value)}
                                      className="border border-stone-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-400">
                                      {['A','B','C','D'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-stone-500">Marks:</span>
                                    <input type="number" value={q.marks} onChange={e => updateQuestion(t.id, idx, 'marks', e.target.value)}
                                      className="w-12 border border-stone-200 rounded-lg px-2 py-1 text-xs focus:outline-none" />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-stone-500">-ve:</span>
                                    <input type="number" value={q.negative} onChange={e => updateQuestion(t.id, idx, 'negative', e.target.value)}
                                      className="w-12 border border-stone-200 rounded-lg px-2 py-1 text-xs focus:outline-none" />
                                  </div>
                                  <button onClick={() => saveQuestion(t.id, idx)}
                                    className="ml-auto text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Read-only saved question
                              <div>
                                <p className="text-sm text-stone-800 mb-2">{q.text}</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {['a','b','c','d'].map(opt => (
                                    <div key={opt} className={`text-xs px-2 py-1 rounded-lg ${
                                      q.correct === opt.toUpperCase()
                                        ? 'bg-green-100 text-green-700 font-medium'
                                        : 'text-stone-500'
                                    }`}>
                                      <span className="font-bold uppercase mr-1">{opt}.</span> {q[`option_${opt}`]}
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-stone-400 mt-2">+{q.marks} / -{q.negative}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
