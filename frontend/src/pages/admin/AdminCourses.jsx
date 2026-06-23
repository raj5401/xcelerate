import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, BookOpen, Loader, X, Check } from 'lucide-react'
import api from '../../hooks/useApi'

export default function AdminCourses() {
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState({ title:'', exam:'JEE', batch_class:'Class 11', price:'', chapters:'' })
  const [saving,   setSaving]   = useState(false)

  async function load() {
    try {
      const res = await api.get('/courses')
      setCourses(res.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function startEdit(c) {
    setEditing(c.id)
    setForm({ title: c.title, exam: c.exam, batch_class: c.batch_class, price: c.price, chapters: c.chapters })
    setShowForm(true)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/courses/${editing}`, form)
      } else {
        await api.post('/courses', form)
      }
      setShowForm(false); setEditing(null)
      setForm({ title:'', exam:'JEE', batch_class:'Class 11', price:'', chapters:'' })
      load()
    } catch(e) { alert(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function deleteCourse(id) {
    if (!confirm('Deactivate this course?')) return
    try { await api.delete(`/courses/${id}`); load() }
    catch(e) { alert('Failed') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader size={20} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900">Courses</h1>
          <p className="text-sm text-stone-400 mt-0.5">{courses.length} courses</p>
        </div>
        <button onClick={() => { setShowForm(o=>!o); setEditing(null); setForm({ title:'', exam:'JEE', batch_class:'Class 11', price:'', chapters:'' }) }}
          className="flex items-center gap-1.5 text-sm bg-brand-500 text-white px-3 py-2 rounded-lg hover:bg-brand-600">
          <Plus size={14} /> Add course
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-800">{editing ? 'Edit course' : 'New course'}</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-stone-400" /></button>
          </div>
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Course title *</label>
              <input type="text" required placeholder="e.g. JEE Main & Advanced — Class 12"
                value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Exam</label>
              <select value={form.exam} onChange={e => setForm(f=>({...f,exam:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                {['JEE','NEET','KCET','Boards','Crash'].map(e => <option key={e}>{e}</option>)}
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
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Price (₹) *</label>
              <input type="number" required placeholder="4999"
                value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Chapters</label>
              <input type="number" placeholder="20"
                value={form.chapters} onChange={e => setForm(f=>({...f,chapters:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-brand-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Update' : 'Save course'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-stone-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c.id} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{c.exam}</span>
              <div className="flex gap-1">
                <button onClick={() => startEdit(c)} className="p-1 text-stone-400 hover:text-brand-500"><Edit size={13} /></button>
                <button onClick={() => deleteCourse(c.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
            <h3 className="font-semibold text-stone-800 text-sm mb-3 leading-snug">{c.title}</h3>
            <div className="space-y-1.5 text-xs text-stone-500">
              <div className="flex items-center gap-2"><Users size={11} /> {c.enrolled||0} students</div>
              <div className="flex items-center gap-2"><BookOpen size={11} /> {c.chapters} chapters</div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-50 flex items-center justify-between">
              <span className="text-base font-display font-semibold text-stone-800">₹{Number(c.price).toLocaleString()}</span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{c.status}</span>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="col-span-3 text-center py-10 text-stone-400 text-sm">No courses yet</p>}
      </div>
    </div>
  )
}
