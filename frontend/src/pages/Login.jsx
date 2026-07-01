import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Atom, CheckCircle, XCircle, Mail } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../hooks/useApi'

const PASSWORD_RULES = [
  { label: 'At least 6 characters',       test: p => p.length >= 6 },
  { label: 'One uppercase letter (A-Z)',   test: p => /[A-Z]/.test(p) },
  { label: 'One number (0-9)',             test: p => /[0-9]/.test(p) },
  { label: 'One special character (!@#$)', test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

const BLOCKED_DOMAINS = ['mailinator.com','guerrillamail.com','tempmail.com','throwaway.email','sharklasers.com','yopmail.com','trashmail.com','dispostable.com','fakeinbox.com','maildrop.cc']

function validateEmail(email) {
  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!basic) return 'Enter a valid email address'
  const domain = email.split('@')[1]?.toLowerCase()
  if (BLOCKED_DOMAINS.includes(domain)) return 'Temporary email addresses are not allowed'
  return null
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/[\s\-]/g, ''))
}

export default function Login() {
  const [mode,    setMode]    = useState('login')
  // register steps: 'form' | 'otp'
  const [step,    setStep]    = useState('form')
  const [show,    setShow]    = useState(false)
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', password:'' })
  const [otp,     setOtp]     = useState('')
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const { login, register }   = useAuthStore()
  const navigate              = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]:'' })) }

  function validateForm() {
    const e = {}
    if (!form.name?.trim() || form.name.trim().length < 2) e.name = 'Enter your full name'
    const emailErr = validateEmail(form.email)
    if (emailErr) e.email = emailErr
    if (!validatePhone(form.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    if (!form.password) e.password = 'Password is required'
    else if (!PASSWORD_RULES.every(r => r.test(form.password)))
      e.password = 'Password does not meet all requirements'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Step 1: validate form then send OTP
  async function sendOTP(e) {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const res = await api.post('/otp/send', { email: form.email, name: form.name })
      setStep('otp')
      setOtpSent(true)
      // Dev mode: auto-fill OTP
      if (res.data.dev_otp) {
        setOtp(res.data.dev_otp)
      }
      // 60 second resend timer
      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0 } return t - 1 })
      }, 1000)
    } catch(err) {
      setErrors({ api: err.response?.data?.message || 'Failed to send OTP' })
    } finally { setLoading(false) }
  }

  // Step 2: verify OTP first, then register
  async function verifyAndRegister(e) {
    e.preventDefault()
    if (!otp || otp.length !== 6) { setErrors({ otp: 'Enter the 6-digit OTP' }); return }
    setLoading(true)
    try {
      // Step 1: verify OTP
      await api.post('/otp/verify', { email: form.email, otp })
      // Step 2: create account (OTP already verified)
      const user = await register(form.name, form.email, form.phone, form.password)
      navigate('/dashboard')
    } catch(err) {
      setErrors({ otp: err.response?.data?.message || 'Invalid OTP. Please try again.' })
    } finally { setLoading(false) }
  }

  async function loginSubmit(e) {
    e.preventDefault()
    const e2 = {}
    if (!form.email) e2.email = 'Email is required'
    if (!form.password) e2.password = 'Password is required'
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard')
    } catch(err) {
      setErrors({ api: err.response?.data?.message || 'Login failed' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-500 rounded-2xl mb-4">
            <Atom size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-stone-900">
            {mode === 'login' ? 'Welcome back' : step === 'otp' ? 'Verify your email' : 'Create your account'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {mode === 'login' ? 'Sign in to access your classes'
              : step === 'otp' ? `OTP sent to ${form.email}`
              : 'Join xcelerate Physics today'}
          </p>
        </div>

        <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">

          {/* Mode toggle — only show on form step */}
          {step === 'form' && (
            <div className="flex bg-stone-50 rounded-xl p-1 mb-6">
              {['login','register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setErrors({}) }}
                  className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
                    mode === m ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
                  }`}>
                  {m === 'login' ? 'Sign in' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={loginSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Email <span className="text-red-400">*</span></label>
                <input type="email" placeholder="yourname@gmail.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.email ? 'border-red-300 bg-red-50' : 'border-stone-200 focus:border-brand-400'}`} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none pr-10 transition-colors ${errors.password ? 'border-red-300 bg-red-50' : 'border-stone-200 focus:border-brand-400'}`} />
                  <button type="button" onClick={() => setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              {errors.api && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3"><p className="text-red-600 text-xs">{errors.api}</p></div>}
              <button type="submit" disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

          {/* REGISTER STEP 1 — Form */}
          {mode === 'register' && step === 'form' && (
            <form onSubmit={sendOTP} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Full name <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. Arjun Sharma" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-stone-200 focus:border-brand-400'}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Email address <span className="text-red-400">*</span></label>
                <input type="email" placeholder="yourname@gmail.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.email ? 'border-red-300 bg-red-50' : 'border-stone-200 focus:border-brand-400'}`} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Mobile number <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 border border-stone-200 rounded-xl text-sm text-stone-500 bg-stone-50">🇮🇳 +91</span>
                  <input type="tel" placeholder="98765 43210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
                    maxLength={10}
                    className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.phone ? 'border-red-300 bg-red-50' : 'border-stone-200 focus:border-brand-400'}`} />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                <p className="text-xs text-stone-400 mt-1">Used for WhatsApp doubt support</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} placeholder="Min 6 chars, uppercase, number, special"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none pr-10 transition-colors ${errors.password ? 'border-red-300 bg-red-50' : 'border-stone-200 focus:border-brand-400'}`} />
                  <button type="button" onClick={() => setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    {PASSWORD_RULES.map(r => {
                      const passed = r.test(form.password)
                      return (
                        <div key={r.label} className="flex items-center gap-1.5">
                          {passed ? <CheckCircle size={12} className="text-green-500 flex-shrink-0"/> : <XCircle size={12} className="text-stone-300 flex-shrink-0"/>}
                          <span className={`text-xs ${passed ? 'text-green-600' : 'text-stone-400'}`}>{r.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {errors.api && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3"><p className="text-red-600 text-xs">{errors.api}</p></div>}

              <button type="submit" disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                <Mail size={15}/> {loading ? 'Sending OTP...' : 'Send verification OTP'}
              </button>

              <p className="text-xs text-stone-400 text-center">
                A 6-digit OTP will be sent to your email to verify your account.
              </p>
            </form>
          )}

          {/* REGISTER STEP 2 — OTP */}
          {mode === 'register' && step === 'otp' && (
            <form onSubmit={verifyAndRegister} noValidate className="space-y-5">
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-2xl mb-3">
                  <Mail size={24} className="text-green-500"/>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">
                  We sent a 6-digit OTP to<br/>
                  <strong className="text-stone-800">{form.email}</strong>
                </p>
                <p className="text-xs text-stone-400 mt-1">Check your inbox and spam folder</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 text-center">Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setErrors({}) }}
                  className={`w-full border rounded-xl px-4 py-4 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none transition-colors ${
                    errors.otp ? 'border-red-300 bg-red-50' : 'border-stone-200 focus:border-brand-400'
                  }`}
                />
                {errors.otp && <p className="text-xs text-red-500 mt-1 text-center">{errors.otp}</p>}
              </div>

              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm">
                {loading ? 'Verifying...' : 'Verify & create account'}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs text-stone-400">Resend OTP in {resendTimer}s</p>
                ) : (
                  <button type="button" onClick={() => { setStep('form'); setOtp(''); setErrors({}) }}
                    className="text-xs text-brand-500 hover:text-brand-600">
                    ← Change email or resend OTP
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
