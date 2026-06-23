import { useState, useEffect } from 'react'
import { Search, Plus, Download, MoreVertical, Loader, X } from 'lucide-react'
import api from '../../hooks/useApi'

const statusColor = {
  active:   'bg-green-50 text-green-700',
  pending:  'bg-amber-50 text-amber-700',
  inactive: 'bg-stone-100 text-stone-500',
}

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ name:'', email:'', phone:'', password:'student123' })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filter !== 'all') params.status = filter
      const res = await api.get('/students', { params })
      setStudents(res.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, filter])

  async function addStudent(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/students', form)
      setShowForm(false)
      setForm({ name:'', email:'', phone:'', password:'student123' })
      load()
    } catch(e) {
      setError(e.response?.data?.message || 'Failed to add student')
    } finally { setSaving(false) }
  }

  async function deleteStudent(id) {
    if (!confirm('Delete this student?')) return
    try {
      await api.delete(`/students/${id}`)
      setStudents(s => s.filter(x => x.id !== id))
    } catch(e) { alert('Failed to delete') }
  }

  async function toggleStatus(student) {
    const newStatus = student.status === 'active' ? 'inactive' : 'active'
    try {
      await api.patch(`/students/${student.id}`, { status: newStatus })
      setStudents(s => s.map(x => x.id === student.id ? { ...x, status: newStatus } : x))
    } catch(e) { alert('Failed to update') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900">Students</h1>
          <p className="text-sm text-stone-400 mt-0.5">{students.length} total enrolled</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const csv = ['Name,Email,Phone,Status', ...students.map(s => `${s.name},${s.email},${s.phone||''},${s.status}`)].join('\n')
            const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
            a.download = 'students.csv'; a.click()
          }} className="flex items-center gap-1.5 text-sm border border-stone-200 bg-white px-3 py-2 rounded-lg hover:border-stone-300">
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowForm(o => !o)}
            className="flex items-center gap-1.5 text-sm bg-brand-500 text-white px-3 py-2 rounded-lg hover:bg-brand-600">
            <Plus size={14} /> Add student
          </button>
        </div>
      </div>

      {/* Add student form */}
      {showForm && (
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-800">Add new student</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-stone-400" /></button>
          </div>
          <form onSubmit={addStudent} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Full name *</label>
              <input type="text" required placeholder="Student name"
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Email *</label>
              <input type="email" required placeholder="student@email.com"
                value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Phone</label>
              <input type="tel" placeholder="9876543210"
                value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Default password</label>
              <input type="text" placeholder="student123"
                value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            {error && <p className="md:col-span-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-brand-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-60">
                {saving ? 'Saving...' : 'Add student'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-stone-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="text" placeholder="Search students..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-brand-400" />
        </div>
        {['all','active','pending','inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-3 py-2 rounded-lg border capitalize transition-colors ${
              filter===f ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-stone-200 text-stone-600'
            }`}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={20} className="animate-spin text-brand-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-stone-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-semibold">
                        {s.name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-stone-800">{s.name}</p>
                        <p className="text-xs text-stone-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs hidden md:table-cell">{s.phone||'—'}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs hidden lg:table-cell">
                    {new Date(s.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(s)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${statusColor[s.status]}`}>
                      {s.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteStudent(s.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && students.length === 0 && (
          <div className="text-center py-10 text-stone-400 text-sm">No students found</div>
        )}
      </div>
    </div>
  )
}
