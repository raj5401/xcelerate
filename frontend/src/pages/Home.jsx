import { Link } from 'react-router-dom'
import { Atom, BookOpen, Video, MessageCircle, ClipboardList, ArrowRight, CheckCircle } from 'lucide-react'

const stats = [
  { value: '500+', label: 'Students' },
  { value: '95%',  label: 'Pass rate' },
  { value: '24/7', label: 'Doubt support' },
  { value: '6',    label: 'Exam categories' },
]

const courses = [
  { tag: 'Most popular', exam: 'JEE Main & Advanced', classes: ['Class 11', 'Class 12', 'Dropper'], color: 'bg-orange-50 border-brand-400' },
  { exam: 'NEET UG',     classes: ['Class 11', 'Class 12', 'Dropper'], color: 'bg-stone-50 border-stone-200' },
  { exam: 'KCET',        classes: ['Class 11', 'Class 12', 'Karnataka'], color: 'bg-stone-50 border-stone-200' },
  { exam: 'School boards', classes: ['CBSE', 'ICSE', 'Maharashtra', 'Karnataka'], color: 'bg-stone-50 border-stone-200' },
  { exam: 'Crash course', classes: ['Class 11', 'Class 12', 'Dropper'], color: 'bg-stone-50 border-stone-200' },
  { exam: 'Test series & PYQs', classes: ['JEE', 'NEET', 'KCET', 'Boards'], color: 'bg-stone-50 border-stone-200' },
]

const features = [
  { icon: Video,          label: 'Daily live classes on Google Meet' },
  { icon: BookOpen,       label: 'Handwritten PDF notes included' },
  { icon: MessageCircle,  label: 'WhatsApp doubt group — reply within 1hr' },
  { icon: ClipboardList,  label: 'Weekly tests + PYQ practice' },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-orange-50 to-white pt-16 pb-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-brand-500 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5">
              <Atom size={12} />
              JEE · NEET · KCET · All Boards
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-semibold leading-tight text-stone-900 mb-4 text-balance">
              Physics made simple,<br />
              <span className="text-brand-500 italic">results made certain</span>
            </h1>
            <p className="text-stone-500 text-lg mb-8 leading-relaxed max-w-lg">
              Live classes, handwritten notes and personal doubt solving — for Class 11, 12 and droppers targeting any exam.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
              >
                Explore courses <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="bg-white border border-stone-200 hover:border-stone-300 text-stone-700 font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Free demo class
              </Link>
            </div>
          </div>

          {/* Hero illustration block */}
          <div className="flex-shrink-0 w-64 h-56 bg-brand-500 rounded-3xl flex items-center justify-center shadow-xl shadow-brand-500/20">
            <Atom size={96} className="text-white/80" strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-stone-100">
          {stats.map(s => (
            <div key={s.label} className="p-6 text-center">
              <div className="text-2xl font-display font-semibold text-brand-500">{s.value}</div>
              <div className="text-sm text-stone-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Courses grid */}
      <section className="max-w-6xl mx-auto px-4 mt-20">
        <h2 className="text-2xl font-display font-semibold text-stone-900 mb-2">Explore by exam</h2>
        <p className="text-stone-500 text-sm mb-8">Pick your target — we have a batch ready for you</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <Link
              key={c.exam}
              to="/courses"
              className={`relative border rounded-2xl p-5 hover:shadow-md transition-all group ${c.color}`}
            >
              {c.tag && (
                <span className="absolute top-4 right-4 bg-brand-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {c.tag}
                </span>
              )}
              <h3 className="font-display font-semibold text-stone-800 mb-3">{c.exam}</h3>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.classes.map(cl => (
                  <span key={cl} className="text-xs border border-stone-200 bg-white text-stone-500 px-2 py-0.5 rounded-full">
                    {cl}
                  </span>
                ))}
              </div>
              <span className="text-brand-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Explore <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live batch CTA */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <div className="bg-brand-500 rounded-3xl p-8 md:p-10 text-white">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1">
              <div className="text-brand-100 text-sm font-medium mb-2">New batch — June 2026</div>
              <h2 className="text-2xl font-display font-semibold mb-4">
                Class 11 JEE / NEET / KCET<br />Limited seats available
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map(f => (
                  <div key={f.label} className="flex items-start gap-2 text-sm text-brand-100">
                    <f.icon size={15} className="mt-0.5 flex-shrink-0 text-white" />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/login"
                className="bg-white text-brand-500 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors block text-center whitespace-nowrap"
              >
                Book your seat →
              </Link>
              <p className="text-brand-200 text-xs mt-2 text-center">Early bird pricing available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher section */}
      <section className="max-w-6xl mx-auto px-4 mt-16 mb-4">
        <div className="flex flex-col md:flex-row items-center gap-6 bg-stone-50 rounded-2xl p-6 border border-stone-100">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-500 font-display font-semibold text-xl">XP</span>
          </div>
          <div>
            <h4 className="font-display font-semibold text-stone-800 mb-1">Your teacher</h4>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xl">
              Physics lecturer with 10+ years of experience. Taught 500+ students across JEE, NEET and KCET. Known for making complex concepts click the first time — concepts first, formulas second.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-1.5">
            {['JEE specialist', 'KCET expert', '500+ students'].map(b => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-stone-500">
                <CheckCircle size={12} className="text-green-500" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
