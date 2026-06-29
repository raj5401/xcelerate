const router = require('express').Router()
const { pool } = require('../db')
const { auth, teacherOrAdmin } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /api/live-classes
router.get('/', asyncHandler(async (req, res) => {
  const { batch_id, status } = req.query
  let query = `SELECT lc.*, b.name as batch_name, u.name as teacher_name
    FROM live_classes lc
    JOIN batches b ON b.id = lc.batch_id
    LEFT JOIN users u ON u.id = lc.teacher_id
    WHERE 1=1`
  const params = []

  if (batch_id) {
    query += ` AND lc.batch_id = $${params.length + 1}`
    params.push(batch_id)
  }
  if (status) {
    query += ` AND lc.status = $${params.length + 1}`
    params.push(status)
  }

  query += ' ORDER BY lc.scheduled_at DESC'
  const classes = await pool.query(query, params)
  res.json({ success: true, liveClasses: classes.rows })
}))

// GET /api/live-classes/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const liveClass = await pool.query(
    `SELECT lc.*, b.name as batch_name, u.name as teacher_name,
     COUNT(DISTINCT lca.id) as current_attendees
     FROM live_classes lc
     JOIN batches b ON b.id = lc.batch_id
     LEFT JOIN users u ON u.id = lc.teacher_id
     LEFT JOIN live_class_attendance lca ON lca.live_class_id = lc.id
     WHERE lc.id=$1
     GROUP BY lc.id, b.name, u.name`,
    [req.params.id]
  )
  if (!liveClass.rows.length) return res.status(404).json({ success: false, message: 'Live class not found' })

  res.json({ success: true, liveClass: liveClass.rows[0] })
}))

// POST /api/live-classes (Create live class)
router.post('/', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { batch_id, title, description, scheduled_at, duration } = req.body
  if (!batch_id || !title || !scheduled_at) {
    return res.status(400).json({ success: false, message: 'batch_id, title, and scheduled_at required' })
  }

  const jitsiRoomId = `xcelerate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const result = await pool.query(
    `INSERT INTO live_classes (batch_id, teacher_id, title, description, scheduled_at, duration, jitsi_room_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [batch_id, req.user.id, title, description, scheduled_at, duration || 60, jitsiRoomId, 'scheduled']
  )

  res.status(201).json({ success: true, message: 'Live class scheduled', liveClass: result.rows[0] })
}))

// POST /api/live-classes/:id/start
router.post('/:id/start', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE live_classes SET status='in_progress', started_at=NOW() WHERE id=$1 RETURNING *`,
    [req.params.id]
  )

  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Live class not found' })
  res.json({ success: true, message: 'Class started', liveClass: result.rows[0] })
}))

// POST /api/live-classes/:id/end
router.post('/:id/end', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { recording_url } = req.body

  const result = await pool.query(
    `UPDATE live_classes SET status='completed', ended_at=NOW(), recording_url=$1 WHERE id=$2 RETURNING *`,
    [recording_url, req.params.id]
  )

  res.json({ success: true, message: 'Class ended', liveClass: result.rows[0] })
}))

// POST /api/live-classes/:id/attendance (Mark attendance)
router.post('/:id/attendance', auth, asyncHandler(async (req, res) => {
  const { status = 'attended' } = req.body

  const existing = await pool.query(
    'SELECT id FROM live_class_attendance WHERE live_class_id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  )

  if (existing.rows.length) {
    await pool.query(
      'UPDATE live_class_attendance SET status=$1, left_at=NOW() WHERE id=$2',
      [status, existing.rows[0].id]
    )
  } else {
    await pool.query(
      'INSERT INTO live_class_attendance (live_class_id, user_id, status) VALUES ($1, $2, $3)',
      [req.params.id, req.user.id, status]
    )
  }

  res.json({ success: true, message: 'Attendance marked' })
}))

module.exports = router
