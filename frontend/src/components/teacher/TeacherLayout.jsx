import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ClipboardList, FileText,
  MessageCircle, Users, Menu, X, LogOut, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const SUBJECT_META = {
  Physics:     { emoji: '⚛️', color: 'text-blue-600' },
  Biology:     { emoji: '🧬', color: 'text-green-600' },
  Mathematics: { emoji: '📐', color: 'text-purple-600' },
  Chemistry:   { emoji: '🧪', color: 'text-orange-600' },
}

const navItems = [
  { label: 'Overview',  to: '/teacher',          icon: LayoutDashboard },
  { label: 'My Courses',to: '/teacher/courses',  icon: BookOpen },
  { label: 'Tests',     to: '/teacher/tests',    icon: ClipboardList },
  { label: 'Notes',     to: '/teacher/notes',    icon: FileText },
  { label: 'Doubts',    to: '/teacher/doubts',   icon: MessageCircle },
  { label: 'Students',  to: '/teacher/students', icon: Users },
]

export default function TeacherLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname }  = useLocation()
  const { user, logout } = useAuthStore()
  const navigate      = useNavigate()
  const meta          = SUBJECT_META[user?.subject] || {}

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className="w-60 bg-white border-r border-stone-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-stone-100">
        <Link to="/" className="font-display text-xl font-bold">
          <span className="text-indigo-600">X</span><span className="text-stone-900">celerate</span>
        </Link>
        <p className="text-xs text-stone-400 mt-0.5">Teacher Portal</p>
      </div>

      {/* Teacher info */}
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl flex-shrink-0">
            {meta.emoji || '👤'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{user?.name}</p>
            <p className={`text-xs font-medium ${meta.color || 'text-indigo-600'}`}>{user?.subject} Teacher</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.to
          return (
            <Link key={item.to} to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}>
              <item.icon size={16} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-stone-100">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-60 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-60 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden bg-white border-b border-stone-200 px-4 h-14 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-stone-600" />
          </button>
          <span className="font-display font-bold text-stone-900">
            <span className="text-indigo-600">X</span>celerate
          </span>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
            {user?.name?.[0]}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
