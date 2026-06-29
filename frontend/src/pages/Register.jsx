import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Register = () => {
  const navigate = useNavigate()
  const { register, isLoading, error } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    class_level: '11',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Name required'
    if (!formData.email) newErrors.email = 'Email required'
    if (formData.password.length < 8) newErrors.password = 'Min 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords must match'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await register(formData)
      navigate(formData.role === 'student' ? '/dashboard' : '/teacher/dashboard')
    } catch (err) {
      setErrors({ submit: error })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-blue-600 text-white p-6 text-center">
          <h2 className="text-2xl font-bold">Join Xcelerate</h2>
          <p className="text-blue-100 mt-2">Start learning today</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="Your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                name="class_level"
                value={formData.class_level}
                onChange={handleChange}
                className="w-full border rounded px-4 py-2"
              >
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="Min 8 characters"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded px-4 py-2"
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {errors.submit && <p className="text-red-500 text-center">{errors.submit}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center pb-6 text-gray-600">
          Already have account? <a href="/login" className="text-blue-600 font-semibold">Login</a>
        </p>
      </div>
    </div>
  )
}

export default Register
