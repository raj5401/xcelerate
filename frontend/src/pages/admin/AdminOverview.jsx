import { useState, useEffect } from 'react'
import { Users, BookOpen, CreditCard, TrendingUp, ArrowUpRight, Clock, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../hooks/useApi'

export default function AdminOverview() {
  const [students, setStudents] = useState([])
  const [courses,  setCourses]  = useState([])
  const [batches,  setBatches]  = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, c, b, p] = await Promise.all([
          api.get('/students'),
          api.get('/courses'),
          api.get('/courses/batches/all'),
          api.get('/payments/stats'),
        ])
        setStudents(s.data)
        setCourses(c.data)
        setBatches(b.data)
        setStats(p.data)
      } catch(err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={24} className="animate-spin text-brand-500" />
    </div>
  )

  const summaryStats = [
    { label: 'Total students',  value: students.length,                              icon: Users },
    { label: 'Active courses',  value: courses.length,                               icon: BookOpen },
    { label: 'Revenue',         value: `₹${Number(stats?.total_revenue||0).toLocaleString()}`, icon: CreditCard },
    { label: 'Active batches',  value: batches.filter(b=>b.status==='active').length, icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-stone-900">Good morning, Admin</h1>
        <p className="text-sm text-stone-400 mt-0.5">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
              <s.icon size={15} className="text-brand-500" />
            </div>
            <div className="text-2xl font-display font-semibold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
            <h2 className="text-sm font-semibold text-stone-800">Recent students</h2>
            <Link to="/admin/students" className="text-xs text-brand-500">View all →</Link>
          </div>
          <div className="divide-y divide-stone-50">
            {students.slice(0,5).map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                    {s.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{s.name}</p>
                    <p className="text-xs text-stone-400">{s.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  s.status==='active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>{s.status}</span>
              </div>
            ))}
            {students.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No students yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
            <h2 className="text-sm font-semibold text-stone-800">Active batches</h2>
            <Link to="/admin/batches" className="text-xs text-brand-500">Manage →</Link>
          </div>
          <div className="divide-y divide-stone-50">
            {batches.slice(0,4).map(b => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{b.name}</p>
                  <p className="text-xs text-stone-400">{b.students || 0} students · {b.schedule || 'No schedule'}</p>
                </div>
              </div>
            ))}
            {batches.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No batches yet</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Add student',  to: '/admin/students', color: 'bg-blue-50 text-blue-700' },
          { label: 'Upload notes', to: '/admin/notes',    color: 'bg-green-50 text-green-700' },
          { label: 'Create test',  to: '/admin/tests',    color: 'bg-purple-50 text-purple-700' },
          { label: 'Upload video', to: '/admin/videos',   color: 'bg-orange-50 text-orange-700' },
        ].map(a => (
          <Link key={a.label} to={a.to}
            className={`${a.color} rounded-xl p-3 text-sm font-medium text-center hover:opacity-80`}>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
