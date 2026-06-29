const router = require('express').Router()
const { pool } = require('../db')
const { auth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const { sendNotification } = require('../utils/emailService')

// GET /api/doubts
router.get('/', asyncHandler(async (req, res) => {
  const { course_id, status, search, page = 1, limit = 10 } = req.query
  let query = `SELECT d.*, u.name as student_name, u.avatar_url, c.title as course_title,
    COUNT(dr.id) as reply_count FROM doubts d
    JOIN users u ON u.id = d.user_id
    JOIN courses c ON c.id = d.course_id
    LEFT JOIN doubt_replies dr ON dr.doubt_id = d.id
    WHERE 1=1`
  const params = []

  if (course_id) {
    query += ` AND d.course_id = $${params.length + 1}`
    params.push(course_id)
  }
  if (status) {
    query += ` AND d.status = $${params.length + 1}`
    params.push(status)
  }
  if (search) {
    query += ` AND (d.title ILIKE $${params.length + 1} OR d.question ILIKE $${params.length + 1})`
    params.push(`%${search}%`, `%${search}%`)
  }

  query += ` GROUP BY d.id, u.name, u.avatar_url, c.title
    ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, (page - 1) * limit)

  const doubts = await pool.query(query, params)
  res.json({ success: true, doubts: doubts.rows, page, limit })
}))

// GET /api/doubts/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const doubt = await pool.query(
    `SELECT d.*, u.name as student_name, u.avatar_url, c.title as course_title
     FROM doubts d
     JOIN users u ON u.id = d.user_id
     JOIN courses c ON c.id = d.course_id
     WHERE d.id=$1`,
    [req.params.id]
  )
  if (!doubt.rows.length) return res.status(404).json({ success: false, message: 'Doubt not found' })

  const replies = await pool.query(
    `SELECT dr.*, u.name as reply_author, u.avatar_url, u.role
     FROM doubt_replies dr
     JOIN users u ON u.id = dr.user_id
     WHERE dr.doubt_id=$1
     ORDER BY dr.created_at ASC`,
    [req.params.id]
  )

  res.json({ success: true, doubt: doubt.rows[0], replies: replies.rows })
}))

// POST /api/doubts (Create doubt)
router.post('/', auth, asyncHandler(async (req, res) => {
  const { course_id, chapter_id, title, question, image_url, tags } = req.body
  if (!course_id || !title || !question) {
    return res.status(400).json({ success: false, message: 'course_id, title, and question required' })
  }

  const result = await pool.query(
    `INSERT INTO doubts (course_id, chapter_id, user_id, title, question, image_url, tags, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [course_id, chapter_id || null, req.user.id, title, question, image_url || null, tags ? JSON.stringify(tags) : null, 'open']
  )

  res.status(201).json({ success: true, message: 'Doubt posted', doubt: result.rows[0] })
}))

// POST /api/doubts/:id/replies (Add reply)
router.post('/:id/replies', auth, asyncHandler(async (req, res) => {
  const { reply_text, image_url } = req.body
  if (!reply_text) return res.status(400).json({ success: false, message: 'reply_text required' })

  const result = await pool.query(
    `INSERT INTO doubt_replies (doubt_id, user_id, reply_text, image_url, is_teacher_reply)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.id, req.user.id, reply_text, image_url || null, req.user.role === 'teacher']
  )

  // Update doubt status if teacher replies
  if (req.user.role === 'teacher') {
    await pool.query('UPDATE doubts SET status=$1 WHERE id=$2', ['answered', req.params.id])
  }

  res.status(201).json({ success: true, message: 'Reply posted', reply: result.rows[0] })
}))

// PATCH /api/doubts/:id/status
router.patch('/:id/status', auth, asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['open', 'answered', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }

  const result = await pool.query(
    'UPDATE doubts SET status=$1 WHERE id=$2 RETURNING *',
    [status, req.params.id]
  )

  res.json({ success: true, message: 'Doubt status updated', doubt: result.rows[0] })
}))

module.exports = router
