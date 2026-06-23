import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        <div>
          <div className="font-display font-semibold text-white text-lg mb-2">
            <span className="text-brand-400 italic">x</span>celerate Physics
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">
            Expert physics coaching for JEE, NEET, KCET and all boards. Class 11, 12 and droppers.
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm font-medium mb-3">Courses</h4>
          <ul className="space-y-2 text-sm">
            {['JEE Main & Advanced', 'NEET UG', 'KCET', 'CBSE / State boards', 'Crash course'].map(c => (
              <li key={c}>
                <Link to="/courses" className="hover:text-white transition-colors">{c}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-medium mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://wa.me/91XXXXXXXXXX" className="hover:text-white transition-colors">WhatsApp</a></li>
            <li><a href="mailto:hello@xceleratephysics.in" className="hover:text-white transition-colors">hello@xceleratephysics.in</a></li>
            <li><a href="#" className="hover:text-white transition-colors">YouTube channel</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-800 px-4 py-4 max-w-6xl mx-auto flex justify-between items-center text-xs text-stone-600">
        <span>© 2026 xcelerate Physics Tutorials</span>
        <span>Pune, Maharashtra</span>
      </div>
    </footer>
  )
}
