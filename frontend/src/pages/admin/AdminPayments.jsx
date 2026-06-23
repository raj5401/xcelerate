import { useState, useEffect } from 'react'
import { Download, TrendingUp, TrendingDown, Clock, Loader } from 'lucide-react'
import api from '../../hooks/useApi'

const statusColor = {
  paid:    'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  failed:  'bg-red-50 text-red-600',
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  async function load() {
    try {
      const [p, s] = await Promise.all([api.get('/payments'), api.get('/payments/stats')])
      setPayments(p.data); setStats(s.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    try {
      await api.patch(`/payments/${id}`, { status })
      setPayments(p => p.map(x => x.id===id ? {...x, status} : x))
    } catch(e) { alert('Failed') }
  }

  const filtered = filter==='all' ? payments : payments.filter(p => p.status===filter)

  if (loading) return <div className="flex items-center justify-center h-64"><Loader size={20} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900">Payments</h1>
          <p className="text-sm text-stone-400 mt-0.5">{payments.length} total transactions</p>
        </div>
        <button onClick={() => {
          const csv = ['Student,Course,Amount,Status,Date',
            ...payments.map(p => `${p.student_name},${p.course_title},${p.amount},${p.status},${new Date(p.created_at).toLocaleDateString()}`)
          ].join('\n')
          const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv)
          a.download='payments.csv'; a.click()
        }} className="flex items-center gap-1.5 text-sm border border-stone-200 bg-white px-3 py-2 rounded-lg hover:border-stone-300">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-green-500" /><span className="text-xs text-stone-400">Total collected</span></div>
          <div className="text-2xl font-display font-semibold text-stone-900">₹{Number(stats?.total_revenue||0).toLocaleString()}</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Clock size={14} className="text-amber-500" /><span className="text-xs text-stone-400">Pending</span></div>
          <div className="text-2xl font-display font-semibold text-stone-900">₹{Number(stats?.pending||0).toLocaleString()}</div>
        </div>
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} className="text-red-400" /><span className="text-xs text-stone-400">Failed</span></div>
          <div className="text-2xl font-display font-semibold text-stone-900">{stats?.failed||0}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all','paid','pending','failed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg border capitalize ${filter===f ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-stone-200 text-stone-600'}`}>{f}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-medium">Student</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Course</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-stone-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-semibold">
                      {p.student_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">{p.student_name}</p>
                      <p className="text-xs text-stone-400">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-stone-500 text-xs">{p.course_title}</td>
                <td className="px-4 py-3 font-semibold text-stone-800">₹{Number(p.amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-stone-400 text-xs hidden md:table-cell">
                  {new Date(p.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  {p.status !== 'paid' && (
                    <button onClick={() => updateStatus(p.id, 'paid')}
                      className="text-xs text-green-600 hover:text-green-700 font-medium">Mark paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-10 text-stone-400 text-sm">No payments found</div>}
      </div>
    </div>
  )
}
