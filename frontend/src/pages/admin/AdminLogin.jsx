import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Atom, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function AdminLogin() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [show, setShow]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuthStore()
  const navigate              = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role !== 'admin') throw new Error('Admin access required')
      localStorage.setItem('adminToken', localStorage.getItem('token'))
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-500 rounded-2xl mb-4">
            <Atom size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-display font-semibold text-white">Admin login</h1>
          <p className="text-stone-400 text-sm mt-1">xcelerate Physics Tutorials</p>
        </div>

        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Email</label>
              <input type="email" required placeholder="admin@xcelerate.in"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-stone-900 border border-stone-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 placeholder:text-stone-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-stone-900 border border-stone-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 placeholder:text-stone-600 pr-10" />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-900/30 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
