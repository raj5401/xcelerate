import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Plus, Clock, BookOpen, Trash2, Loader, X, Edit, ChevronDown, ChevronUp, Check, Calendar, Eye, Send } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../hooks/useApi'

// ── Question Editor ───────────────────────────────────────────
function QuestionEditor({ testId, onClose }) {
  const [questions, setQuestions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [newQs,     setNewQs]     = useState([])
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/tests/${testId}/questions-admin`)
        setQuestions(res.data || [])
      } catch { setQuestions([]) }
      finally { setLoading(false) }
    }
    load()
  }, [testId])

  function addNewQ() {
    setNewQs(q => [...q, { text:'', option_a:'', option_b:'', option_c:'', option_d:'', correct:'A', marks:4, negative:1 }])
  }
  function setNewQ(i, k, v) { setNewQs(q => q.map((x, idx) => idx === i ? { ...x, [k]: v } : x)) }
  function removeNewQ(i) { setNewQs(q => q.filter((_, idx) => idx !== i)) }

  async function saveNewQuestions() {
    if (!newQs.length) return
    if (newQs.find(q => !q.text || !q.option_a || !q.option_b || !q.option_c || !q.option_d)) {
      alert('Fill all fields'); return
    }
    setSaving(true)
    try {
      await api.post(`/tests/${testId}/questions`, { questions: newQs })
      const res = await api.get(`/tests/${testId}/questions-admin`)
      setQuestions(res.data || [])
      setNewQs([])
    } catch(e) { alert(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function deleteQuestion(qid) {
    if (!confirm('Delete?')) return
    try {
      await api.delete(`/tests/${testId}/questions/${qid}`)
      setQuestions(q => q.filter(x => x.id !== qid))
    } catch { alert('Failed') }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader size={18} className="animate-spin text-brand-500"/></div>

  return (
    <div className="bg-white border border-brand-200 rounded-2xl shadow-sm overflow-hidden mt-2">
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 bg-brand-50">
        <h3 className="text-sm font-semibold text-stone-800">Questions · {questions.length} added</h3>
        <button onClick={onClose}><X size={15} className="text-stone-400"/></button>
      </div>
      <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
        {/* Existing */}
        {questions.map((q, i) => (
          <div key={q.id} className="border border-stone-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-stone-50"
              onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-mono bg-stone-100 text-stone-500 px-2 py-0.5 rounded flex-shrink-0">Q{i+1}</span>
                <p className="text-sm text-stone-700 truncate">{q.text}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-green-600 font-medium">+{q.marks||4}/-{q.negative||1}</span>
                <button onClick={e => { e.stopPropagation(); deleteQuestion(q.id) }}
                  className="p-1 text-stone-300 hover:text-red-500"><Trash2 size={12}/></button>
                {expanded === q.id ? <ChevronUp size={13} className="text-stone-400"/> : <ChevronDown size={13} className="text-stone-400"/>}
              </div>
            </div>
            {expanded === q.id && (
              <div className="px-4 pb-3 border-t border-stone-50 bg-stone-50">
                <p className="text-sm text-stone-700 py-2">{q.text}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['a','b','c','d'].map(opt => (
                    <div key={opt} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
                      q.correct === opt.toUpperCase() ? 'bg-green-100 text-green-800 font-medium' : 'bg-white text-stone-500 border border-stone-100'
                    }`}>
                      {q.correct === opt.toUpperCase() && <Check size={9}/>}
                      <span className="font-mono">{opt.toUpperCase()}.</span> {q[`option_${opt}`]}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* New questions */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Add new questions</span>
          <button onClick={addNewQ}
            className="flex items-center gap-1 text-xs bg-brand-50 text-brand-600 border border-brand-100 px-3 py-1.5 rounded-lg hover:bg-brand-100">
            <Plus size={11}/> Add question
          </button>
        </div>

        {newQs.length === 0 && questions.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-xl">
            <p className="text-sm text-stone-400">Click "Add question" to start</p>
          </div>
        )}

        {newQs.map((q, i) => (
          <div key={i} className="border border-brand-100 rounded-xl p-4 bg-brand-50/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-600">New Q{questions.length + i + 1}</span>
              <button onClick={() => removeNewQ(i)}><X size={13} className="text-stone-400 hover:text-red-500"/></button>
            </div>
            <textarea required placeholder="Question text..." rows={2} value={q.text}
              onChange={e => setNewQ(i,'text',e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none bg-white"/>
            <div className="grid grid-cols-2 gap-2">
              {['a','b','c','d'].map(opt => (
                <div key={opt} className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold w-5 flex-shrink-0 ${q.correct === opt.toUpperCase() ? 'text-green-600' : 'text-stone-400'}`}>{opt.toUpperCase()}.</span>
                  <input type="text" placeholder={`Option ${opt.toUpperCase()}`} value={q[`option_${opt}`]}
                    onChange={e => setNewQ(i,`option_${opt}`,e.target.value)}
                    className="flex-1 border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400 bg-white"/>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-stone-500">Correct:</label>
                <div className="flex gap-1">
                  {['A','B','C','D'].map(opt => (
                    <button key={opt} type="button" onClick={() => setNewQ(i,'correct',opt)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                        q.correct === opt ? 'bg-green-500 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:border-green-300'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-stone-500">+Marks:</label>
                <input type="number" min="1" value={q.marks} onChange={e => setNewQ(i,'marks',+e.target.value)}
                  className="w-12 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none bg-white"/>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-stone-500">-Neg:</label>
                <input type="number" min="0" max="4" step="0.25" value={q.negative} onChange={e => setNewQ(i,'negative',+e.target.value)}
                  className="w-12 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none bg-white"/>
              </div>
            </div>
          </div>
        ))}

        {newQs.length > 0 && (
          <button onClick={saveNewQuestions} disabled={saving}
            className="w-full bg-brand-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-brand-600 disabled:opacity-60">
            {saving ? 'Saving...' : `Save ${newQs.length} question(s)`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main AdminTests component ─────────────────────────────────
export default function AdminTests() {
  const [tests,    setTests]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [editTest, setEditTest] = useState(null)
  const [form,     setForm]     = useState({
    title:'', exam:'JEE', batch_class:'Class 12', duration:60, total_marks:100, scheduled_at:null
  })
  const [saving,   setSaving]   = useState(false)

  async function load() {
    try { const res = await api.get('/tests'); setTests(res.data) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function startEdit(t) {
    setEditTest(t)
    setForm({
      title: t.title, exam: t.exam, batch_class: t.batch_class,
      duration: t.duration, total_marks: t.total_marks,
      scheduled_at: t.scheduled_at ? new Date(t.scheduled_at) : null
    })
    setShowForm(true)
  }

  async function saveTest(e) {
    e.preventDefault(); setSaving(true)
    try {
      // Browser date is already in local timezone (IST)
      // toISOString() converts to UTC — correct behavior
      const payload = { ...form, scheduled_at: form.scheduled_at ? form.scheduled_at.toISOString() : null }
      if (editTest) await api.patch(`/tests/${editTest.id}`, payload)
      else await api.post('/tests', payload)
      setShowForm(false); setEditTest(null)
      setForm({ title:'', exam:'JEE', batch_class:'Class 12', duration:60, total_marks:100, scheduled_at:null })
      load()
    } catch(e) { alert(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function deleteTest(id) {
    if (!confirm('Deactivate this test?')) return
    try { await api.delete(`/tests/${id}`); load() }
    catch { alert('Failed') }
  }

  async function togglePublish(test) {
    try {
      if (test.results_published) await api.post(`/tests/${test.id}/unpublish`)
      else await api.post(`/tests/${test.id}/publish`)
      load()
    } catch { alert('Failed') }
  }

  function getScheduleStatus(t) {
    if (!t.scheduled_at) return { label: 'Open', color: 'bg-blue-50 text-blue-700' }
    const d = new Date(t.scheduled_at)
    // Display in IST
    const istStr = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })
    if (d > new Date()) return { label: `Starts ${istStr} IST`, color: 'bg-amber-50 text-amber-700' }
    return { label: `Started ${istStr} IST`, color: 'bg-green-50 text-green-700' }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader size={20} className="animate-spin text-brand-500"/></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900">Mock Tests</h1>
          <p className="text-sm text-stone-400 mt-0.5">{tests.length} tests · JEE scoring (+4/−1)</p>
        </div>
        <button onClick={() => { setShowForm(o=>!o); setEditTest(null); setForm({ title:'', exam:'JEE', batch_class:'Class 12', duration:60, total_marks:100, scheduled_at:null }) }}
          className="flex items-center gap-1.5 text-sm bg-brand-500 text-white px-3 py-2 rounded-lg hover:bg-brand-600">
          <Plus size={14}/> Create test
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-800">{editTest ? 'Edit test' : 'New test'}</h3>
            <button onClick={() => { setShowForm(false); setEditTest(null) }}><X size={16} className="text-stone-400"/></button>
          </div>
          <form onSubmit={saveTest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Test title *</label>
              <input type="text" required placeholder="e.g. Units & Measurements — JEE 2026"
                value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"/>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Exam</label>
                <select value={form.exam} onChange={e => setForm(f=>({...f,exam:e.target.value}))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                  {['JEE','NEET','KCET','Boards','All'].map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Class</label>
                <select value={form.batch_class} onChange={e => setForm(f=>({...f,batch_class:e.target.value}))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                  {['Class 11','Class 12','Dropper','All'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Duration (min)</label>
                <input type="number" min="10" value={form.duration}
                  onChange={e => setForm(f=>({...f,duration:+e.target.value}))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Total marks</label>
                <input type="number" min="10" value={form.total_marks}
                  onChange={e => setForm(f=>({...f,total_marks:+e.target.value}))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"/>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <label className="block text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                <Calendar size={12}/> Schedule test (optional)
              </label>
              <DatePicker
                selected={form.scheduled_at}
                onChange={date => setForm(f=>({...f,scheduled_at:date}))}
                showTimeSelect timeFormat="HH:mm" timeIntervals={15}
                dateFormat="dd MMM yyyy, hh:mm aa"
                placeholderText="Leave blank → available immediately"
                minDate={new Date()}
                isClearable
                timeCaption="Time (IST)"
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 bg-white"
              />
              <p className="text-xs text-amber-600 mt-1.5">
                {form.scheduled_at
                  ? `⏰ Scheduled: ${format(form.scheduled_at, 'dd MMM yyyy, hh:mm aa')} (your local time = IST on your device)`
                  : 'Test will be visible to students immediately after creating'}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">Note: Select time in IST. Server converts automatically.</p>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-brand-500 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-60">
                {saving ? 'Saving...' : editTest ? 'Update test' : 'Create test'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditTest(null) }}
                className="text-sm px-4 py-2 rounded-lg border border-stone-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Question editor */}
      {editing && (
        <QuestionEditor testId={editing} onClose={() => { setEditing(null); load() }}/>
      )}

      {/* Tests list */}
      <div className="space-y-3">
        {tests.map(t => {
          const sched = getScheduleStatus(t)
          return (
            <div key={t.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${editing === t.id ? 'border-brand-200' : 'border-stone-100'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{t.exam}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sched.color}`}>{sched.label}</span>
                      {t.results_published && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Eye size={9}/> Results published
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-stone-800">{t.title}</h3>
                    <div className="flex gap-4 text-xs text-stone-400 mt-1">
                      <span className="flex items-center gap-1"><Clock size={10}/> {t.duration} min</span>
                      <span>{t.total_marks} marks</span>
                      <span className={Number(t.question_count) > 0 ? 'text-green-600 font-medium' : 'text-stone-400'}>
                        {t.question_count || 0} questions
                      </span>
                      {Number(t.submitted_count) > 0 && (
                        <span className="text-brand-500 font-medium">{t.submitted_count} submitted</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {/* Publish / Unpublish */}
                    <button onClick={() => togglePublish(t)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        t.results_published
                          ? 'border-stone-200 text-stone-500 hover:border-red-200 hover:text-red-500'
                          : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      }`}>
                      <Send size={11}/>
                      {t.results_published ? 'Unpublish' : 'Publish results'}
                    </button>

                    {/* View submissions */}
                    <Link to={`/admin/tests/${t.id}/submissions`}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-600 transition-colors">
                      <Eye size={11}/> Submissions
                    </Link>

                    {/* Edit test details */}
                    <button onClick={() => startEdit(t)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
                      <Edit size={11}/> Edit
                    </button>

                    {/* Edit questions */}
                    <button onClick={() => setEditing(editing === t.id ? null : t.id)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        editing === t.id ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-200 text-stone-600 hover:border-brand-300 hover:text-brand-600'
                      }`}>
                      <BookOpen size={11}/>
                      {editing === t.id ? 'Close' : 'Questions'}
                    </button>

                    <button onClick={() => deleteTest(t.id)}
                      className="p-1.5 text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Question editor inline */}
              {editing === t.id && (
                <div className="px-4 pb-4">
                  <QuestionEditor testId={t.id} onClose={() => { setEditing(null); load() }}/>
                </div>
              )}
            </div>
          )
        })}
        {tests.length === 0 && <div className="text-center py-10 text-stone-400 text-sm">No tests yet</div>}
      </div>
    </div>
  )
}
