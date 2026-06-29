const router = require('express').Router()
const { pool } = require('../db')
const { auth, teacherOrAdmin, adminOnly } = require('../middleware/auth')
const { validateBatchCreate } = require('../middleware/validation')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /api/batches
router.get('/', asyncHandler(async (req, res) => {
  const { course_id, status } = req.query
  let query = 'SELECT b.*, c.title as course_title, u.name as teacher_name FROM batches b JOIN courses c ON c.id = b.course_id LEFT JOIN users u ON u.id = b.teacher_id WHERE 1=1'
  const params = []

  if (course_id) {
    query += ` AND b.course_id = $${params.length + 1}`
    params.push(course_id)
  }
  if (status) {
    query += ` AND b.status = $${params.length + 1}`
    params.push(status)
  }

  const batches = await pool.query(query, params)
  res.json({ success: true, batches: batches.rows })
}))

// GET /api/batches/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const batch = await pool.query(
    `SELECT b.*, c.title as course_title, u.name as teacher_name,
     COUNT(DISTINCT e.id) as enrolled_students
     FROM batches b
     JOIN courses c ON c.id = b.course_id
     LEFT JOIN users u ON u.id = b.teacher_id
     LEFT JOIN enrollments e ON e.batch_id = b.id
     WHERE b.id=$1
     GROUP BY b.id, c.title, u.name`,
    [req.params.id]
  )
  if (!batch.rows.length) return res.status(404).json({ success: false, message: 'Batch not found' })

  res.json({ success: true, batch: batch.rows[0] })
}))

// POST /api/batches (Create batch)
router.post('/', auth, teacherOrAdmin, validateBatchCreate, asyncHandler(async (req, res) => {
  const { name, course_id, schedule_days, schedule_time, start_date, end_date, max_students } = req.body
  const teacher_id = req.user.role === 'teacher' ? req.user.id : req.body.teacher_id

  const result = await pool.query(
    `INSERT INTO batches (name, course_id, teacher_id, schedule_days, schedule_time, start_date, end_date, max_students, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [name, course_id, teacher_id, JSON.stringify(schedule_days), schedule_time, start_date, end_date, max_students || 30, 'active']
  )

  res.status(201).json({ success: true, message: 'Batch created', batch: result.rows[0] })
}))

// PATCH /api/batches/:id
router.patch('/:id', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { name, schedule_days, schedule_time, start_date, end_date, status } = req.body

  const result = await pool.query(
    `UPDATE batches SET name=COALESCE($1, name), schedule_days=COALESCE($2, schedule_days),
     schedule_time=COALESCE($3, schedule_time), start_date=COALESCE($4, start_date),
     end_date=COALESCE($5, end_date), status=COALESCE($6, status), updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [name, schedule_days ? JSON.stringify(schedule_days) : null, schedule_time, start_date, end_date, status, req.params.id]
  )

  res.json({ success: true, message: 'Batch updated', batch: result.rows[0] })
}))

// DELETE /api/batches/:id
router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM batches WHERE id=$1', [req.params.id])
  res.json({ success: true, message: 'Batch deleted' })
}))

module.exports = router
