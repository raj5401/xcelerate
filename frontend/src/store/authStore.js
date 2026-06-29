import { create } from 'zustand'
import api from '../utils/api'

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      set({ user: data.user, token: data.token })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      set({ error: message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', formData)
      set({ user: data.user, token: data.token })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      set({ error: message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      set({ token, user: JSON.parse(user) })
    }
  },
}))

export default useAuthStore
