const router = require('express').Router()
const { pool } = require('../db')
const { auth, teacherOrAdmin, adminOnly } = require('../middleware/auth')
const { validateCourseCreate } = require('../middleware/validation')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /api/courses (List all published courses)
router.get('/', asyncHandler(async (req, res) => {
  const { subject, class_level, search, page = 1, limit = 12 } = req.query
  let query = `SELECT c.*, u.name as teacher_name, u.avatar_url as teacher_avatar,
    COUNT(DISTINCT e.id) as enrolled_count
    FROM courses c
    LEFT JOIN users u ON u.id = c.teacher_id
    LEFT JOIN enrollments e ON e.course_id = c.id
    WHERE c.status = 'published'`
  const params = []

  if (subject) {
    query += ` AND c.subject = $${params.length + 1}`
    params.push(subject)
  }
  if (class_level) {
    query += ` AND c.class_level = $${params.length + 1}`
    params.push(class_level)
  }
  if (search) {
    query += ` AND (c.title ILIKE $${params.length + 1} OR c.description ILIKE $${params.length + 1})`
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ` GROUP BY c.id, u.name, u.avatar_url
    ORDER BY c.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, (page - 1) * limit)

  const courses = await pool.query(query, params)
  res.json({ success: true, courses: courses.rows, page, limit })
}))

// GET /api/courses/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await pool.query(
    `SELECT c.*, u.name as teacher_name, u.bio as teacher_bio, u.avatar_url as teacher_avatar,
     COUNT(DISTINCT ch.id) as total_chapters, COUNT(DISTINCT v.id) as total_videos
     FROM courses c
     LEFT JOIN users u ON u.id = c.teacher_id
     LEFT JOIN chapters ch ON ch.course_id = c.id
     LEFT JOIN videos v ON v.course_id = c.id
     WHERE c.id=$1 AND c.status='published'
     GROUP BY c.id, u.name, u.bio, u.avatar_url`,
    [req.params.id]
  )
  if (!course.rows.length) return res.status(404).json({ success: false, message: 'Course not found' })

  const chapters = await pool.query(
    'SELECT * FROM chapters WHERE course_id=$1 ORDER BY order_num',
    [req.params.id]
  )

  const reviews = await pool.query(
    `SELECT r.*, u.name as student_name, u.avatar_url
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.course_id=$1
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [req.params.id]
  )

  res.json({
    success: true,
    course: { ...course.rows[0], chapters: chapters.rows, reviews: reviews.rows }
  })
}))

// POST /api/courses (Create course - Teacher/Admin only)
router.post('/', auth, teacherOrAdmin, validateCourseCreate, asyncHandler(async (req, res) => {
  const { title, description, subject, class_level, price, thumbnail, banner } = req.body
  const teacher_id = req.user.role === 'teacher' ? req.user.id : req.body.teacher_id

  const result = await pool.query(
    `INSERT INTO courses (title, description, subject, class_level, teacher_id, price, thumbnail, banner, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [title, description, subject, class_level, teacher_id, price, thumbnail, banner, 'draft']
  )

  res.status(201).json({ success: true, message: 'Course created successfully', course: result.rows[0] })
}))

// PATCH /api/courses/:id (Update course)
router.patch('/:id', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { title, description, price, status, discount_percent } = req.body

  // Check ownership if teacher
  if (req.user.role === 'teacher') {
    const course = await pool.query('SELECT teacher_id FROM courses WHERE id=$1', [req.params.id])
    if (!course.rows.length || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your course' })
    }
  }

  const result = await pool.query(
    `UPDATE courses SET title=COALESCE($1,title), description=COALESCE($2,description),
     price=COALESCE($3,price), status=COALESCE($4,status), discount_percent=COALESCE($5,discount_percent),
     updated_at=NOW() WHERE id=$6 RETURNING *`,
    [title, description, price, status, discount_percent, req.params.id]
  )

  res.json({ success: true, message: 'Course updated successfully', course: result.rows[0] })
}))

module.exports = router
