import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  Video, FileText, CreditCard, Settings, LogOut,
  Menu, X, Bell, ChevronRight, Atom, ChevronLeft
} from 'lucide-react'
import api from '../../hooks/useApi'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',  to: '/admin' },
  { icon: Users,           label: 'Students',  to: '/admin/students' },
  { icon: BookOpen,        label: 'Courses',   to: '/admin/courses' },
  { icon: Users,           label: 'Batches',   to: '/admin/batches' },
  { icon: ClipboardList,   label: 'Tests',     to: '/admin/tests' },
  { icon: Video,           label: 'Videos',    to: '/admin/videos' },
  { icon: FileText,        label: 'Notes',     to: '/admin/notes' },
  { icon: CreditCard,      label: 'Payments',  to: '/admin/payments' },
  { icon: Settings,        label: 'Settings',  to: '/admin/settings' },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [notifications,  setNotifications]  = useState([])
  const [showNotif,      setShowNotif]      = useState(false)
  const [notifCount,     setNotifCount]     = useState(0)
  const { pathname } = useLocation()
  const navigate     = useNavigate()

  // Load recent activity as notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.get('/students')
        const recent = res.data.slice(0, 5).map(s => ({
          id: s.id,
          msg: `${s.name} joined`,
          time: new Date(s.created_at).toLocaleDateString('en-IN'),
          read: false,
        }))
        setNotifications(recent)
        setNotifCount(recent.length)
      } catch(e) { /* silent */ }
    }
    loadNotifications()
  }, [])

  function logout() {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  function markAllRead() {
    setNotifCount(0)
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 bg-stone-900 flex flex-col transition-all duration-200 relative`}>

        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-stone-800">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Atom size={14} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-white font-semibold text-sm">
              <span className="text-brand-400 font-bold">X</span>celerate
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to))
            return (
              <Link key={item.to} to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-brand-500 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800'
                }`}>
                <item.icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-stone-800">
          <button onClick={logout}
            title={!sidebarOpen ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors">
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-stone-100 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle — WORKS */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-stone-50 transition-colors"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-stone-400">
              <span>Admin</span>
              <ChevronRight size={12} />
              <span className="text-stone-700 font-medium capitalize">
                {pathname.split('/').pop() || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications — WORKS */}
            <div className="relative">
              <button
                onClick={() => { setShowNotif(s => !s); if (notifCount > 0) markAllRead() }}
                className="relative p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors"
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {notifCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotif && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                  <div className="absolute right-0 top-11 z-20 bg-white border border-stone-100 rounded-2xl shadow-lg w-72 overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-50 flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-800">Notifications</span>
                      <button onClick={markAllRead} className="text-xs text-brand-500">Mark all read</button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-stone-400 text-sm">No notifications</p>
                    ) : (
                      <div className="divide-y divide-stone-50 max-h-64 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-brand-50' : ''}`}>
                            <p className="text-sm text-stone-700">{n.msg}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{n.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Admin avatar */}
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-brand-600 text-xs font-bold">A</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
