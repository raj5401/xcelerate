const router = require('express').Router()
const { pool } = require('../db')
const { auth, studentOnly, adminOnly } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const { sendNotification } = require('../utils/emailService')

// GET /api/enrollments (Student's enrollments)
router.get('/', auth, asyncHandler(async (req, res) => {
  const enrollments = await pool.query(
    `SELECT e.*, c.title, c.subject, c.thumbnail, c.price, b.name as batch_name, u.name as teacher_name
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN batches b ON b.id = e.batch_id
     LEFT JOIN users u ON u.id = c.teacher_id
     WHERE e.user_id=$1
     ORDER BY e.enrolled_at DESC`,
    [req.user.id]
  )
  res.json({ success: true, enrollments: enrollments.rows })
}))

// POST /api/enrollments (Enroll in course)
router.post('/', auth, studentOnly, asyncHandler(async (req, res) => {
  const { course_id, batch_id, payment_id } = req.body
  if (!course_id) return res.status(400).json({ success: false, message: 'course_id required' })

  // Check if already enrolled
  const existing = await pool.query(
    'SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2',
    [req.user.id, course_id]
  )
  if (existing.rows.length) return res.status(409).json({ success: false, message: 'Already enrolled in this course' })

  // Check course capacity
  const course = await pool.query('SELECT max_students FROM courses WHERE id=$1', [course_id])
  if (!course.rows.length) return res.status(404).json({ success: false, message: 'Course not found' })

  const enrolled = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id=$1', [course_id])
  if (enrolled.rows[0].count >= course.rows[0].max_students) {
    return res.status(409).json({ success: false, message: 'Course is full' })
  }

  const result = await pool.query(
    `INSERT INTO enrollments (user_id, course_id, batch_id, payment_id, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, course_id, batch_id || null, payment_id || null, 'active']
  )

  // Send notification
  const student = await pool.query('SELECT name, email FROM users WHERE id=$1', [req.user.id])
  try {
    await sendNotification(student.rows[0].email, 'Enrollment Successful', `You have successfully enrolled in the course!`)
  } catch (err) {
    console.error('Notification failed:', err)
  }

  res.status(201).json({ success: true, message: 'Enrolled successfully', enrollment: result.rows[0] })
}))

// GET /api/enrollments/:courseId/students (Get enrolled students - Teacher/Admin)
router.get('/:courseId/students', auth, asyncHandler(async (req, res) => {
  const students = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, e.enrolled_at, e.progress_percent
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     WHERE e.course_id=$1
     ORDER BY e.enrolled_at DESC`,
    [req.params.courseId]
  )
  res.json({ success: true, students: students.rows })
}))

// PATCH /api/enrollments/:id (Update enrollment status)
router.patch('/:id', auth, asyncHandler(async (req, res) => {
  const { status, progress_percent } = req.body

  const result = await pool.query(
    `UPDATE enrollments SET status=COALESCE($1, status), progress_percent=COALESCE($2, progress_percent)
     WHERE id=$3 RETURNING *`,
    [status, progress_percent, req.params.id]
  )

  res.json({ success: true, message: 'Enrollment updated', enrollment: result.rows[0] })
}))

module.exports = router
