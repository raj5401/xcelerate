import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const links = [
  { label: 'Courses',    to: '/courses' },
  { label: 'Mock Tests', to: '/mock-tests' },
]

export default function Navbar() {
  const [open,     setOpen]     = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const { pathname }            = useLocation()
  const { user, logout }        = useAuthStore()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight">
            <span className="text-indigo-600">X</span><span className="text-stone-900">celerate</span>
          </span>
          <span className="text-xs text-stone-400 font-medium hidden sm:block border-l border-stone-200 pl-2">PUC 11 & 12</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-base font-semibold transition-colors ${
                pathname === l.to
                  ? 'text-brand-500'
                  : 'text-stone-700 hover:text-brand-500'
              }`}>{l.label}</Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button onClick={() => setDropdown(d => !d)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-stone-700">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className={`text-stone-400 transition-transform ${dropdown ? 'rotate-180' : ''}`} />
              </button>

              {dropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdown(false)} />
                  <div className="absolute right-0 top-12 z-20 bg-white border border-stone-100 rounded-2xl shadow-lg py-1.5 w-52">
                    <div className="px-4 py-2.5 border-b border-stone-50">
                      <p className="text-sm font-semibold text-stone-800">{user.name}</p>
                      <p className="text-xs text-stone-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50">
                      <LayoutDashboard size={14} /> My dashboard
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50">
                        <User size={14} /> Admin panel
                      </Link>
                    )}
                    {user.role === 'teacher' && (
                      <Link to="/teacher" onClick={() => setDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50">
                        <User size={14} /> Teacher panel
                      </Link>
                    )}
                    <button onClick={() => { setDropdown(false); logout() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-base font-semibold text-stone-700 hover:text-brand-500 transition-colors">
                Login
              </Link>
              <Link to="/login"
                className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                Join now
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(o => !o)} className="md:hidden text-stone-600 p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-stone-100 px-4 py-4 flex flex-col gap-4">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="text-base font-semibold text-stone-700 hover:text-brand-500">{l.label}</Link>
          ))}
          {user ? (
            <>
              <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">{user.name}</p>
                  <p className="text-xs text-stone-400">{user.email}</p>
                </div>
              </div>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-stone-600">My dashboard</Link>
              <button onClick={() => { setOpen(false); logout() }} className="text-sm font-medium text-red-500 text-left">Sign out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}
              className="bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center">
              Join now
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
