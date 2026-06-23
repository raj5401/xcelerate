import { create } from 'zustand'
import api from '../hooks/useApi'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user:  JSON.parse(localStorage.getItem('user') || 'null'),

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    set({ token: res.data.token, user: res.data.user })
    return res.data.user
  },

  register: async (name, email, phone, password) => {
    const res = await api.post('/auth/register', { name, email, phone, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    set({ token: res.data.token, user: res.data.user })
    return res.data.user
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('user')
    set({ token: null, user: null })
    window.location.href = '/login'
  },
}))
