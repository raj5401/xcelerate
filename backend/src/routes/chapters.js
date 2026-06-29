const router = require('express').Router()
const { pool } = require('../db')
const { auth, teacherOrAdmin } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /api/chapters/:courseId
router.get('/:courseId', asyncHandler(async (req, res) => {
  const chapters = await pool.query(
    'SELECT * FROM chapters WHERE course_id=$1 ORDER BY order_num',
    [req.params.courseId]
  )
  res.json({ success: true, chapters: chapters.rows })
}))

// POST /api/chapters (Create chapter)
router.post('/', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { course_id, title, description, order_num } = req.body
  if (!course_id || !title) return res.status(400).json({ success: false, message: 'course_id and title required' })

  // Verify teacher owns this course
  if (req.user.role === 'teacher') {
    const course = await pool.query('SELECT teacher_id FROM courses WHERE id=$1', [course_id])
    if (!course.rows.length || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your course' })
    }
  }

  const result = await pool.query(
    'INSERT INTO chapters (course_id, title, description, order_num) VALUES ($1, $2, $3, $4) RETURNING *',
    [course_id, title, description, order_num || 0]
  )

  res.status(201).json({ success: true, message: 'Chapter created', chapter: result.rows[0] })
}))

// PATCH /api/chapters/:id
router.patch('/:id', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { title, description, order_num } = req.body

  const result = await pool.query(
    `UPDATE chapters SET title=COALESCE($1,title), description=COALESCE($2,description),
     order_num=COALESCE($3,order_num) WHERE id=$4 RETURNING *`,
    [title, description, order_num, req.params.id]
  )

  res.json({ success: true, message: 'Chapter updated', chapter: result.rows[0] })
}))

// DELETE /api/chapters/:id
router.delete('/:id', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM chapters WHERE id=$1', [req.params.id])
  res.json({ success: true, message: 'Chapter deleted' })
}))

module.exports = router
