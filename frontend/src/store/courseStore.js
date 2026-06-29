import { create } from 'zustand'
import api from '../utils/api'

const useCourseStore = create((set) => ({
  courses: [],
  selectedCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/courses', { params: filters })
      set({ courses: data.courses })
      return data.courses
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch courses' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  fetchCourseDetail: async (courseId) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get(`/courses/${courseId}`)
      set({ selectedCourse: data.course })
      return data.course
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch course' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  createCourse: async (courseData) => {
    try {
      const { data } = await api.post('/courses', courseData)
      set((state) => ({ courses: [...state.courses, data.course] }))
      return data.course
    } catch (err) {
      throw err
    }
  },
}))

export default useCourseStore
