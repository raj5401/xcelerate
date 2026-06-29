const router = require('express').Router()
const { pool } = require('../db')
const { auth, studentOnly, teacherOrAdmin } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /api/users/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await pool.query(
    'SELECT id, name, email, phone, role, subject, bio, avatar_url, is_verified FROM users WHERE id=$1',
    [req.params.id]
  )
  if (!user.rows.length) return res.status(404).json({ success: false, message: 'User not found' })
  res.json({ success: true, user: user.rows[0] })
}))

// GET /api/users/teachers/list
router.get('/teachers/list', asyncHandler(async (req, res) => {
  const { subject, class_level } = req.query
  let query = 'SELECT id, name, email, subject, bio, avatar_url, experience_years FROM users WHERE role=$1'
  const params = ['teacher']

  if (subject) {
    query += ' AND subject=$' + (params.length + 1)
    params.push(subject)
  }

  const teachers = await pool.query(query, params)
  res.json({ success: true, teachers: teachers.rows })
}))

// GET /api/users/:id/enrollments (Student's enrollments)
router.get('/:id/enrollments', auth, asyncHandler(async (req, res) => {
  const enrollments = await pool.query(
    `SELECT e.*, c.title, c.subject, c.class_level, c.thumbnail, u.name as teacher_name
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN users u ON u.id = c.teacher_id
     WHERE e.user_id=$1 AND e.status='active'
     ORDER BY e.enrolled_at DESC`,
    [req.params.id]
  )
  res.json({ success: true, enrollments: enrollments.rows })
}))

// GET /api/users/:id/analytics (Student analytics)
router.get('/:id/analytics', auth, asyncHandler(async (req, res) => {
  const analytics = await pool.query(
    'SELECT * FROM student_analytics WHERE user_id=$1',
    [req.params.id]
  )
  res.json({ success: true, analytics: analytics.rows })
}))

module.exports = router
