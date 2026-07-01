import { useState, useEffect } from 'react'
import { Settings, Users, KeyRound, Eye, EyeOff, CheckCircle, Loader, Plus, Trash2 } from 'lucide-react'
import api from '../../hooks/useApi'

export default function AdminSettings() {
  const [teachers,       setTeachers]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showForm,       setShowForm]       = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [showPass,       setShowPass]       = useState(false)
  const [success,        setSuccess]        = useState('')
  const [resetTarget,    setResetTarget]    = useState(null)
  const [newPassword,    setNewPassword]    = useState('')
  const [resetting,      setResetting]      = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', password: ''
  })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await api.get('/students?role=teacher')
      // Get teachers from users
      const all = await api.get('/students')
      // We'll get teachers via a separate approach
      setTeachers([])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function loadTeachers() {
    try {
      // Call auth/register style — we read from courses which have teacher info
      const res = await api.get('/courses')
      const seen = new Set()
      const teachers = []
      for (const c of res.data) {
        if (c.teacher_id && !seen.has(c.teacher_id)) {
          seen.add(c.teacher_id)
          teachers.push({
            id:      c.teacher_id,
            name:    c.teacher_name,
            subject: c.teacher_subject,
          })
        }
      }
      setTeachers(teachers)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTeachers() }, [])

  async function createTeacher(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.subject) return
    setSaving(true)
    try {
      await api.post('/auth/register', {
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
        role:     'teacher',
        subject:  form.subject,
      })
      setSuccess(`Teacher account created for ${form.name}`)
      setForm({ name: '', email: '', phone: '', subject: '', password: '' })
      setShowForm(false)
      loadTeachers()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { alert(err.response?.data?.message || 'Failed to create teacher') }
    finally { setSaving(false) }
  }

  async function resetPassword(teacherId) {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters'); return
    }
    setResetting(true)
    try {
      await api.patch(`/students/${teacherId}`, { password: newPassword })
      setSuccess('Password reset successfully')
      setResetTarget(null)
      setNewPassword('')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { alert(err.response?.data?.message || 'Failed to reset password') }
    finally { setResetting(false) }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-stone-900">Settings</h1>
        <p className="text-stone-500 text-sm mt-1">Manage teacher accounts and platform configuration</p>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
          <CheckCircle size={15} /> {success}
        </div>
      )}

      {/* ── TEACHER ACCOUNTS ──────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            <h2 className="font-semibold text-stone-800">Teacher Accounts</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{teachers.length}</span>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl transition-colors font-medium">
            <Plus size={12} /> Add teacher
          </button>
        </div>

        {/* Create teacher form */}
        {showForm && (
          <form onSubmit={createTeacher} className="p-5 border-b border-stone-100 bg-indigo-50">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Create teacher account</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Full name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Dr. Suresh Kumar" required
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="physics@xcelerate.com" required
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Subject *</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400">
                  <option value="">Select subject</option>
                  <option value="Physics">⚛️ Physics</option>
                  <option value="Biology">🧬 Biology</option>
                  <option value="Mathematics">📐 Mathematics</option>
                  <option value="Chemistry">🧪 Chemistry</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="9876543210"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-stone-500 mb-1 block">Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 characters" required
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400 pr-10" />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                {saving ? 'Creating...' : 'Create account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-stone-200 text-stone-600 text-sm px-5 py-2.5 rounded-xl hover:border-stone-300">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Teacher list */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader size={20} className="animate-spin text-indigo-500" /></div>
        ) : teachers.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">No teachers found</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {teachers.map(t => {
              const subjectEmoji = { Physics: '⚛️', Biology: '🧬', Mathematics: '📐', Chemistry: '🧪' }
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                      {subjectEmoji[t.subject] || '👤'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{t.name}</p>
                      <p className="text-xs text-indigo-600 font-medium">{t.subject} Teacher</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setResetTarget(resetTarget === t.id ? null : t.id)}
                    className="flex items-center gap-1.5 text-xs border border-stone-200 text-stone-600 hover:border-indigo-300 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors">
                    <KeyRound size={12} /> Reset password
                  </button>
                </div>
              )
            }).concat(
              // Password reset inline form
              resetTarget ? [
                <div key="reset-form" className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Reset password for selected teacher</p>
                  <div className="flex gap-2">
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                    <button onClick={() => resetPassword(resetTarget)} disabled={resetting}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                      {resetting ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setResetTarget(null); setNewPassword('') }}
                      className="border border-stone-200 text-stone-600 text-sm px-3 py-2 rounded-xl hover:border-stone-300">
                      Cancel
                    </button>
                  </div>
                </div>
              ] : []
            )}
          </div>
        )}
      </div>

      {/* ── PLATFORM INFO ──────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
          <Settings size={16} className="text-indigo-600" />
          <h2 className="font-semibold text-stone-800">Platform Info</h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            ['Platform name',  'Xcelerate'],
            ['Tagline',        'PUC 11 & 12 — Physics, Biology, Maths, Chemistry'],
            ['Contact email',  'admin@xcelerate.com'],
            ['Subjects',       'Physics · Biology · Mathematics · Chemistry'],
            ['Classes',        'PUC 11 and PUC 12'],
            ['Enrollment',     'Free (payment integration coming soon)'],
            ['OTP mode',       'Dev mode — OTP auto-filled in browser'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between py-2 border-b border-stone-50 last:border-0">
              <span className="text-sm text-stone-500">{label}</span>
              <span className="text-sm font-medium text-stone-700 text-right max-w-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
