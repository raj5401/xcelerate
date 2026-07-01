import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronDown, ChevronUp, Plus, Loader, Users, FileText, ClipboardList } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../hooks/useApi'

const SUBJECT_META = {
  Physics:     { emoji: '⚛️', bg: 'bg-blue-50',   border: 'border-blue-200',   color: 'text-blue-600' },
  Biology:     { emoji: '🧬', bg: 'bg-green-50',  border: 'border-green-200',  color: 'text-green-600' },
  Mathematics: { emoji: '📐', bg: 'bg-purple-50', border: 'border-purple-200', color: 'text-purple-600' },
  Chemistry:   { emoji: '🧪', bg: 'bg-orange-50', border: 'border-orange-200', color: 'text-orange-600' },
}

export default function TeacherCourses() {
  const { user }    = useAuthStore()
  const [courses,   setCourses]   = useState([])
  const [chapters,  setChapters]  = useState({}) // courseId -> []
  const [expanded,  setExpanded]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [showChapterForm, setShowChapterForm] = useState(null) // courseId
  const [chapterForm, setChapterForm] = useState({ title: '', description: '' })
  const [savingChapter, setSavingChapter] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await api.get('/courses')
      const mine = res.data.filter(c => c.teacher_id === user.id || c.teacher_name === user.name)
      setCourses(mine)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function loadChapters(courseId) {
    if (chapters[courseId]) return
    try {
      const res = await api.get(`/courses/${courseId}/chapters`)
      setChapters(c => ({ ...c, [courseId]: res.data }))
    } catch (err) { console.error(err) }
  }

  async function addChapter(e, courseId) {
    e.preventDefault()
    if (!chapterForm.title.trim()) return
    setSavingChapter(true)
    try {
      const existing = chapters[courseId] || []
      const res = await api.post(`/courses/${courseId}/chapters`, {
        title:       chapterForm.title,
        description: chapterForm.description,
        order_num:   existing.length + 1,
      })
      setChapters(c => ({ ...c, [courseId]: [...(c[courseId] || []), res.data] }))
      setCourses(cs => cs.map(c => c.id === courseId ? { ...c, total_chapters: (c.total_chapters || 0) + 1 } : c))
      setChapterForm({ title: '', description: '' })
      setShowChapterForm(null)
    } catch (err) { alert(err.response?.data?.message || 'Failed to add chapter') }
    finally { setSavingChapter(false) }
  }

  if (loading) return (
    <div className="flex justify-center h-64 items-center">
      <Loader size={24} className="animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-stone-900">My Courses</h1>
        <p className="text-stone-500 text-sm mt-1">
          {courses.length} course{courses.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-12 text-center">
          <BookOpen size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">No courses assigned yet. Contact admin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(c => {
            const meta   = SUBJECT_META[c.subject] || {}
            const isOpen = expanded === c.id
            const chs    = chapters[c.id] || []

            return (
              <div key={c.id} className={`border-2 rounded-2xl overflow-hidden ${meta.border || 'border-stone-200'}`}>
                {/* Course header */}
                <div className={`${meta.bg || 'bg-stone-50'} p-5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{meta.emoji}</span>
                      <div>
                        <p className={`text-xs font-bold ${meta.color}`}>{c.subject} · PUC {c.class_level}</p>
                        <h3 className="font-display font-bold text-stone-800 text-lg leading-tight">{c.title}</h3>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2 max-w-xl">{c.description}</p>
                      </div>
                    </div>
                    <button onClick={() => {
                      setExpanded(isOpen ? null : c.id)
                      if (!isOpen) loadChapters(c.id)
                    }} className="text-stone-400 hover:text-stone-600 transition-colors p-1 flex-shrink-0">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-5 mt-4 text-xs text-stone-500">
                    <span className="flex items-center gap-1.5"><BookOpen size={12} /> {c.total_chapters || 0} chapters</span>
                    <span className="flex items-center gap-1.5"><Users size={12} /> {c.enrolled_count || 0} students</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.color} border ${meta.border}`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                {/* Expanded: chapters list + add chapter */}
                {isOpen && (
                  <div className="bg-white p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-stone-700">Chapters ({chs.length})</h4>
                      <button onClick={() => setShowChapterForm(showChapterForm === c.id ? null : c.id)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Plus size={11} /> Add chapter
                      </button>
                    </div>

                    {/* Add chapter form */}
                    {showChapterForm === c.id && (
                      <form onSubmit={e => addChapter(e, c.id)}
                        className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 space-y-2">
                        <input value={chapterForm.title}
                          onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Chapter title (e.g. Chapter 3 — Laws of Motion)"
                          required
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                        <input value={chapterForm.description}
                          onChange={e => setChapterForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Short description (optional)"
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                        <div className="flex gap-2">
                          <button type="submit" disabled={savingChapter}
                            className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                            {savingChapter ? 'Saving...' : 'Add chapter'}
                          </button>
                          <button type="button" onClick={() => setShowChapterForm(null)}
                            className="text-xs text-stone-500 px-3 py-2 hover:text-stone-700">Cancel</button>
                        </div>
                      </form>
                    )}

                    {/* Chapter list */}
                    {chs.length === 0 ? (
                      <p className="text-xs text-stone-400 py-4 text-center">No chapters yet. Add your first chapter above.</p>
                    ) : (
                      <div className="space-y-2">
                        {chs.map((ch, i) => (
                          <div key={ch.id} className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 hover:bg-stone-100 transition-colors">
                            <span className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-stone-700">{ch.title}</p>
                              {ch.description && <p className="text-xs text-stone-400 truncate">{ch.description}</p>}
                            </div>
                            <div className="flex gap-2 text-xs text-stone-400 flex-shrink-0">
                              <span className="flex items-center gap-1"><FileText size={10} /> Notes</span>
                              <span className="flex items-center gap-1"><ClipboardList size={10} /> Tests</span>
                            </div>
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
