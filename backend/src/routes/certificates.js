const router = require('express').Router()
const { pool } = require('../db')
const { auth, adminOnly } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const { generateCertificate } = require('../utils/helpers')

// GET /api/certificates (Student's certificates)
router.get('/', auth, asyncHandler(async (req, res) => {
  const certificates = await pool.query(
    `SELECT c.*, co.title as course_title, co.subject
     FROM certificates c
     JOIN courses co ON co.id = c.course_id
     WHERE c.user_id=$1
     ORDER BY c.issued_at DESC`,
    [req.user.id]
  )
  res.json({ success: true, certificates: certificates.rows })
}))

// GET /api/certificates/:code (Verify certificate)
router.get('/verify/:code', asyncHandler(async (req, res) => {
  const certificate = await pool.query(
    `SELECT c.*, u.name as student_name, co.title as course_title
     FROM certificates c
     JOIN users u ON u.id = c.user_id
     JOIN courses co ON co.id = c.course_id
     WHERE c.certificate_code=$1`,
    [req.params.code]
  )

  if (!certificate.rows.length) {
    return res.status(404).json({ success: false, message: 'Certificate not found' })
  }

  res.json({ success: true, certificate: certificate.rows[0] })
}))

// POST /api/certificates (Generate certificate - Admin/System)
router.post('/', auth, asyncHandler(async (req, res) => {
  const { user_id, course_id, score, completion_date } = req.body
  if (!user_id || !course_id) {
    return res.status(400).json({ success: false, message: 'user_id and course_id required' })
  }

  const user = await pool.query('SELECT name FROM users WHERE id=$1', [user_id])
  const course = await pool.query('SELECT title FROM courses WHERE id=$1', [course_id])

  if (!user.rows.length || !course.rows.length) {
    return res.status(404).json({ success: false, message: 'User or course not found' })
  }

  const certificateCode = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  const certificateUrl = `${process.env.FRONTEND_URL}/certificates/${certificateCode}`

  const result = await pool.query(
    `INSERT INTO certificates (user_id, course_id, certificate_url, certificate_code, score, completion_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [user_id, course_id, certificateUrl, certificateCode, score || 0, completion_date || new Date()]
  )

  res.status(201).json({ success: true, message: 'Certificate generated', certificate: result.rows[0] })
}))

module.exports = router
