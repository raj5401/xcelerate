import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, ClipboardList, FileText, MessageCircle, ArrowRight, Loader, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../hooks/useApi'

export default function TeacherOverview() {
  const { user }  = useAuthStore()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [courses, batches, tests, notes, doubts] = await Promise.all([
          api.get('/courses'),
          api.get('/courses/batches/all'),
          api.get('/tests'),
          api.get('/files/notes'),
          api.get('/doubts'),
        ])
        // Filter teacher's own data
        const myCourses = courses.data.filter(c => c.teacher_id === user.id || c.teacher_name === user.name)
        const myBatches = batches.data
        const myTests   = tests.data.filter(t => t.teacher_id === user.id)
        const myNotes   = notes.data.filter(n => n.teacher_id === user.id)
        const openDoubts= doubts.data.filter(d => d.status === 'open')

        // Count students across my courses
        const totalStudents = myBatches.reduce((sum, b) => sum + Number(b.students || 0), 0)

        setData({ myCourses, myBatches, myTests, myNotes, openDoubts, totalStudents })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={24} className="animate-spin text-indigo-500" />
    </div>
  )

  const { myCourses, myBatches, myTests, myNotes, openDoubts, totalStudents } = data

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-stone-900">
          Good morning, {user?.name?.split(' ').slice(-1)[0]}! 👋
        </h1>
        <p className="text-stone-500 text-sm mt-1">{user?.subject} Teacher · Here's your overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'My Courses',    value: myCourses.length,      icon: BookOpen,      color: 'text-indigo-600', bg: 'bg-indigo-50',  to: '/teacher/courses' },
          { label: 'Students',      value: totalStudents,         icon: Users,         color: 'text-green-600',  bg: 'bg-green-50',   to: '/teacher/students' },
          { label: 'Tests Created', value: myTests.length,        icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50',  to: '/teacher/tests' },
          { label: 'Notes Uploaded',value: myNotes.length,        icon: FileText,      color: 'text-blue-600',   bg: 'bg-blue-50',    to: '/teacher/notes' },
          { label: 'Open Doubts',   value: openDoubts.length,     icon: MessageCircle, color: 'text-orange-600', bg: 'bg-orange-50',  to: '/teacher/doubts' },
        ].map(s => (
          <Link key={s.label} to={s.to}
            className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div className="text-2xl font-display font-bold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My courses */}
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">My Courses</h2>
            <Link to="/teacher/courses" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {myCourses.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">No courses assigned yet</p>
            ) : myCourses.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-stone-800">{c.title}</p>
                  <p className="text-xs text-stone-400">PUC {c.class_level} · {c.total_chapters} chapters · {c.enrolled_count || 0} students</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open doubts */}
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">
              Open Doubts
              {openDoubts.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{openDoubts.length}</span>
              )}
            </h2>
            <Link to="/teacher/doubts" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Answer all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {openDoubts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-stone-400">All doubts answered!</p>
              </div>
            ) : openDoubts.slice(0, 4).map(d => (
              <div key={d.id} className="px-5 py-3.5">
                <p className="text-sm text-stone-700 line-clamp-1">{d.question}</p>
                <p className="text-xs text-stone-400 mt-0.5">by {d.student_name} · {new Date(d.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tests */}
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">Recent Tests</h2>
            <Link to="/teacher/tests" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {myTests.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">No tests created yet</p>
            ) : myTests.slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-stone-800 line-clamp-1">{t.title}</p>
                  <p className="text-xs text-stone-400">{t.duration} min · {t.total_marks} marks · {t.question_count || 0} Qs</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  t.results_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {t.results_published ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Batches */}
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">My Batches</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {myBatches.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">No batches yet</p>
            ) : myBatches.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-stone-800">{b.name}</p>
                  <p className="text-xs text-stone-400">{b.schedule} · {b.students} students</p>
                </div>
                {b.meet_link && (
                  <a href={b.meet_link} target="_blank" rel="noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 border border-indigo-200 rounded-lg">
                    Join
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
