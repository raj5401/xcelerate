import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Login = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()
  const [email, setEmail] = useState('student1@xcelerate.com')
  const [password, setPassword] = useState('student123')
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await login(email, password)
      const dashboardUrl = data.user.role === 'admin' ? '/admin/dashboard' :
                          data.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      navigate(dashboardUrl)
    } catch (err) {
      setSubmitError(error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-blue-600 text-white p-6 text-center">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-blue-100 mt-2">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-4 py-2"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-4 py-2"
              placeholder="Your password"
            />
          </div>

          {submitError && <p className="text-red-500 text-center">{submitError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 text-center mb-4">Demo Credentials:</p>
          <p className="text-xs text-gray-500"><strong>Student:</strong> student1@xcelerate.com / student123</p>
          <p className="text-xs text-gray-500"><strong>Teacher:</strong> physics@xcelerate.com / teacher123</p>
          <p className="text-xs text-gray-500"><strong>Admin:</strong> admin@xcelerate.com / admin123</p>
        </div>

        <p className="text-center pb-6 text-gray-600">
          Don't have account? <Link to="/register" className="text-blue-600 font-semibold">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
