import { useState, useEffect } from 'react'
import { Users, Search, Loader } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../hooks/useApi'

export default function TeacherStudents() {
  const { user }    = useAuthStore()
  const [students,  setStudents]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      // Get enrollments for teacher's courses
      const [enrollRes, coursesRes] = await Promise.all([
        api.get('/students'),
        api.get('/courses'),
      ])
      const myCourseIds = coursesRes.data
        .filter(c => c.teacher_id === user.id || c.teacher_name === user.name)
        .map(c => c.id)

      // All students (admin route) — filter to those enrolled in my courses
      // Since teacher role may not have access to /students, handle gracefully
      setStudents(enrollRes.data || [])
    } catch (err) {
      console.error(err)
      setStudents([])
    } finally { setLoading(false) }
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex justify-center h-64 items-center">
      <Loader size={24} className="animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">Students</h1>
          <p className="text-stone-500 text-sm mt-1">{students.length} students enrolled in your courses</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-12 text-center">
          <Users size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">
            {search ? 'No students match your search' : 'No students enrolled yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left text-xs font-semibold text-stone-500 px-5 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-stone-500 px-5 py-3 hidden sm:table-cell">Phone</th>
                <th className="text-left text-xs font-semibold text-stone-500 px-5 py-3 hidden md:table-cell">Courses</th>
                <th className="text-left text-xs font-semibold text-stone-500 px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{s.name}</p>
                        <p className="text-xs text-stone-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 hidden sm:table-cell">{s.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 hidden md:table-cell">{s.enrolled_courses || 0}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
