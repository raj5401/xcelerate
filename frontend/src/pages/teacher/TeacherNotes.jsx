import { useState, useEffect } from 'react'
import { FileText, Upload, Trash2, Loader, Plus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../hooks/useApi'

export default function TeacherNotes() {
  const { user }   = useAuthStore()
  const [notes,    setNotes]    = useState([])
  const [courses,  setCourses]  = useState([])
  const [chapters, setChapters] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', course_id: '', chapter_id: '', file: null })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [n, c] = await Promise.all([api.get('/files/notes'), api.get('/courses')])
      setNotes(n.data.filter(x => x.teacher_id === user.id))
      setCourses(c.data.filter(c => c.teacher_id === user.id || c.teacher_name === user.name))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function onCourseChange(courseId) {
    setForm(f => ({ ...f, course_id: courseId, chapter_id: '' }))
    if (!courseId) { setChapters([]); return }
    try {
      const res = await api.get(`/courses/${courseId}/chapters`)
      setChapters(res.data)
    } catch { setChapters([]) }
  }

  async function upload(e) {
    e.preventDefault()
    if (!form.file || !form.title) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file',       form.file)
      fd.append('title',      form.title)
      fd.append('course_id',  form.course_id)
      fd.append('chapter_id', form.chapter_id)
      const res = await api.post('/files/notes/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setNotes(n => [{ ...res.data, teacher_id: user.id }, ...n])
      setForm({ title: '', course_id: '', chapter_id: '', file: null })
      setShowForm(false)
    } catch (err) { alert(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return
    try {
      await api.delete(`/files/notes/${id}`)
      setNotes(n => n.filter(x => x.id !== id))
    } catch { alert('Failed to delete') }
  }

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader size={24} className="animate-spin text-indigo-500" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">Notes</h1>
          <p className="text-stone-500 text-sm mt-1">{notes.length} notes uploaded</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={15} /> Upload note
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={upload} className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-stone-800 mb-4">Upload new note</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-500 mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Kinematics — Complete Notes"
                required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Course</label>
              <select value={form.course_id} onChange={e => onCourseChange(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Chapter</label>
              <select value={form.chapter_id} onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value }))}
                disabled={!form.course_id}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 disabled:opacity-50">
                <option value="">Select chapter</option>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-500 mb-1 block">PDF file *</label>
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
                <input type="file" accept=".pdf" id="note-file" className="hidden"
                  onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} />
                <label htmlFor="note-file" className="cursor-pointer">
                  {form.file ? (
                    <p className="text-sm font-medium text-indigo-600">{form.file.name}</p>
                  ) : (
                    <>
                      <Upload size={20} className="text-stone-400 mx-auto mb-2" />
                      <p className="text-sm text-stone-500">Click to select PDF file</p>
                      <p className="text-xs text-stone-400 mt-1">Max 50MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
              {uploading ? <><Loader size={13} className="animate-spin" /> Uploading...</> : <><Upload size={13} /> Upload</>}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-stone-200 text-stone-600 text-sm px-5 py-2.5 rounded-xl hover:border-stone-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-12 text-center">
          <FileText size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">No notes uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="bg-white border border-stone-100 rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={15} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{n.title}</p>
                  <p className="text-xs text-stone-400">
                    {n.course_title || 'No course'} · {n.chapter_title || 'No chapter'} · {n.size_kb ? `${(n.size_kb / 1024).toFixed(1)} MB` : '—'} · {n.downloads || 0} downloads
                  </p>
                </div>
              </div>
              <button onClick={() => deleteNote(n.id)}
                className="text-stone-300 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
