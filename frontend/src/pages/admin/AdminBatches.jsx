import { useState, useEffect } from 'react'
import { Plus, Users, Clock, Video, Edit, Trash2, Loader, X, ExternalLink, Copy, Check } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
import api from '../../hooks/useApi'

// Days of week for recurring schedule
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const TIMES = ['5:00 AM','6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM',
  '7:00 PM','8:00 PM','9:00 PM','10:00 PM']

function buildScheduleString(days, time) {
  if (!days.length || !time) return ''
  return `${days.join('/')} ${time}`
}

function MeetLinkHelper({ value, onChange }) {
  const [copied, setCopied] = useState(false)

  function openMeet() {
    // Open Google Meet new meeting in a tab
    window.open('https://meet.google.com/new', '_blank')
  }

  function openCalendar() {
    // Open Google Calendar new event — pre-fills with video conference
    window.open('https://calendar.google.com/calendar/r/eventedit?add=video', '_blank')
  }

  function copy() {
    if (value) {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-stone-600">Google Meet link</label>

      {/* Helper button */}
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={openMeet}
          className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
          <ExternalLink size={11}/> Create Meet link
        </button>
      </div>

      <p className="text-xs text-stone-400">
        👆 Click above to create a Meet link → copy it from Google Meet → paste below
      </p>

      <div className="relative">
        <input type="url"
          placeholder="https://meet.google.com/abc-defg-hij"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 pr-10"
        />
        {value && (
          <button type="button" onClick={copy}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
            {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
          </button>
        )}
      </div>

      {value && (
        <a href={value} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline">
          <Video size={11}/> Test link →
        </a>
      )}
    </div>
  )
}

function SchedulePicker({ value, onChange }) {
  const [selectedDays, setSelectedDays] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [startDate,    setStartDate]    = useState(null)

  // Parse existing value on load
  useEffect(() => {
    if (value && !selectedDays.length) {
      // Try to parse "Mon/Wed/Fri 6PM" format
      const parts = value.split(' ')
      if (parts.length >= 2) {
        const days = parts[0].split('/')
        const time = parts.slice(1).join(' ')
        setSelectedDays(days.filter(d => DAYS.includes(d)))
        setSelectedTime(time)
      }
    }
  }, [])

  function toggleDay(day) {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]
    // Sort by DAYS order
    const sorted = DAYS.filter(d => updated.includes(d))
    setSelectedDays(sorted)
    onChange(buildScheduleString(sorted, selectedTime), startDate)
  }

  function handleTime(t) {
    setSelectedTime(t)
    onChange(buildScheduleString(selectedDays, t), startDate)
  }

  function handleDate(date) {
    setStartDate(date)
    onChange(buildScheduleString(selectedDays, selectedTime), date)
  }

  return (
    <div className="space-y-3">
      {/* Days */}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-2">Class days</label>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(day => (
            <button key={day} type="button" onClick={() => toggleDay(day)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                selectedDays.includes(day)
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
              }`}>{day}</button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-2">Class time (IST)</label>
        <select value={selectedTime} onChange={e => handleTime(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
          <option value="">Select time</option>
          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Start date */}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-2">Batch start date</label>
        <DatePicker
          selected={startDate}
          onChange={handleDate}
          minDate={new Date()}
          dateFormat="dd MMM yyyy"
          placeholderText="Select start date"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
        />
      </div>

      {/* Preview */}
      {selectedDays.length > 0 && selectedTime && (
        <div className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
          <p className="text-xs text-brand-700 font-medium">
            📅 {buildScheduleString(selectedDays, selectedTime)}
            {startDate && ` · Starting ${format(startDate, 'dd MMM yyyy')}`}
          </p>
        </div>
      )}
    </div>
  )
}

export default function AdminBatches() {
  const [batches,  setBatches]  = useState([])
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState({ name:'', course_id:'', exam:'JEE', schedule:'', meet_link:'', start_date:null })
  const [saving,   setSaving]   = useState(false)

  async function load() {
    try {
      const [b, c] = await Promise.all([
        api.get('/courses/batches/all'),
        api.get('/courses'),
      ])
      setBatches(b.data || [])
      setCourses(c.data || [])
    } catch(e) {
      console.error('Batch load error:', e.response?.data || e.message)
    }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function handleSchedule(scheduleStr, startDate) {
    setForm(f => ({ ...f, schedule: scheduleStr, start_date: startDate }))
  }

  async function save(e) {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        name:       form.name,
        course_id:  form.course_id,
        exam:       form.exam,
        schedule:   form.schedule,
        meet_link:  form.meet_link,
        start_date: form.start_date ? format(form.start_date, 'yyyy-MM-dd') : null,
      }
      if (editing) await api.patch(`/courses/batches/${editing}`, payload)
      else await api.post('/courses/batches', payload)
      setShowForm(false); setEditing(null)
      setForm({ name:'', course_id:'', exam:'JEE', schedule:'', meet_link:'', start_date:null })
      load()
    } catch(e) { alert(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function deleteBatch(id) {
    if (!confirm('Delete this batch?')) return
    try { await api.delete(`/courses/batches/${id}`); load() }
    catch(e) { alert('Failed') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader size={20} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900">Batches</h1>
          <p className="text-sm text-stone-400 mt-0.5">{batches.length} batches</p>
        </div>
        <button onClick={() => { setShowForm(o=>!o); setEditing(null); setForm({ name:'', course_id:'', exam:'JEE', schedule:'', meet_link:'', start_date:null }) }}
          className="flex items-center gap-1.5 text-sm bg-brand-500 text-white px-3 py-2 rounded-lg hover:bg-brand-600">
          <Plus size={14} /> New batch
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-stone-800">{editing ? 'Edit batch' : 'New batch'}</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-stone-400" /></button>
          </div>

          <form onSubmit={save} className="space-y-5">
            {/* Batch name */}
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Batch name *</label>
              <input type="text" required placeholder="e.g. JEE Class 12 — June 2026"
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>

            {/* Course */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Course</label>
                <select value={form.course_id} onChange={e => setForm(f=>({...f,course_id:e.target.value}))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Exam</label>
                <select value={form.exam} onChange={e => setForm(f=>({...f,exam:e.target.value}))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                  {['JEE','NEET','KCET','Boards','Crash'].map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>

            {/* Schedule picker */}
            <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
              <SchedulePicker
                value={form.schedule}
                onChange={handleSchedule}
              />
            </div>

            {/* Meet link helper */}
            <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
              <MeetLinkHelper
                value={form.meet_link}
                onChange={v => setForm(f=>({...f,meet_link:v}))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving}
                className="bg-brand-500 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Update batch' : 'Create batch'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-stone-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Batch cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map(b => (
          <div key={b.id} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status==='active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {b.status}
              </span>
              <div className="flex gap-1">
                <button onClick={() => {
                  setEditing(b.id)
                  setForm({ name:b.name, course_id:b.course_id||'', exam:b.exam||'JEE', schedule:b.schedule||'', meet_link:b.meet_link||'', start_date:null })
                  setShowForm(true)
                }} className="p-1 text-stone-400 hover:text-brand-500"><Edit size={13} /></button>
                <button onClick={() => deleteBatch(b.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
            <h3 className="font-semibold text-stone-800 text-sm mb-1">{b.name}</h3>
            {b.course_title && <p className="text-xs text-stone-400 mb-3">{b.course_title}</p>}
            <div className="space-y-1.5 text-xs text-stone-500">
              <div className="flex items-center gap-2"><Users size={11} /> {b.students||0} students</div>
              <div className="flex items-center gap-2"><Clock size={11} /> {b.schedule||'No schedule set'}</div>
              <div className="flex items-center gap-2"><Video size={11} />
                {b.meet_link
                  ? <a href={b.meet_link} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline truncate">Join Meet →</a>
                  : <span className="text-stone-300">No Meet link yet</span>}
              </div>
            </div>
          </div>
        ))}
        {batches.length === 0 && (
          <div className="col-span-3 text-center py-10 text-stone-400 text-sm">
            No batches yet. Create your first batch above.
          </div>
        )}
      </div>
    </div>
  )
}
