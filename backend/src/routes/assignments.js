const router = require('express').Router()
const multer = require('multer')
const { pool } = require('../db')
const { auth, teacherOrAdmin } = require('../middleware/auth')
const { uploadToS3 } = require('../utils/s3Service')
const { asyncHandler } = require('../middleware/errorHandler')
const { sendNotification } = require('../utils/emailService')

const upload = multer({ storage: multer.memoryStorage() })

// GET /api/assignments
router.get('/', asyncHandler(async (req, res) => {
  const { course_id, status } = req.query
  let query = `SELECT a.*, u.name as teacher_name, c.title as course_title FROM assignments a
    JOIN courses c ON c.id = a.course_id
    LEFT JOIN users u ON u.id = a.teacher_id
    WHERE a.status='active'`
  const params = []

  if (course_id) {
    query += ` AND a.course_id = $${params.length + 1}`
    params.push(course_id)
  }

  query += ' ORDER BY a.due_date ASC'
  const assignments = await pool.query(query, params)
  res.json({ success: true, assignments: assignments.rows })
}))

// GET /api/assignments/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const assignment = await pool.query(
    `SELECT a.*, u.name as teacher_name, c.title as course_title FROM assignments a
     JOIN courses c ON c.id = a.course_id
     LEFT JOIN users u ON u.id = a.teacher_id
     WHERE a.id=$1`,
    [req.params.id]
  )
  if (!assignment.rows.length) return res.status(404).json({ success: false, message: 'Assignment not found' })

  // Get submissions if student or teacher
  let submissions = []
  if (req.user?.role === 'admin' || req.user?.role === 'teacher') {
    const subs = await pool.query(
      `SELECT s.*, u.name as student_name, u.email FROM assignment_submissions s
       JOIN users u ON u.id = s.user_id
       WHERE s.assignment_id=$1 ORDER BY s.submitted_at DESC`,
      [req.params.id]
    )
    submissions = subs.rows
  }

  res.json({ success: true, assignment: assignment.rows[0], submissions })
}))

// POST /api/assignments (Create assignment)
router.post('/', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { title, description, instructions, course_id, chapter_id, due_date, max_score } = req.body
  if (!title || !course_id || !due_date) {
    return res.status(400).json({ success: false, message: 'title, course_id, and due_date required' })
  }

  const result = await pool.query(
    `INSERT INTO assignments (title, description, instructions, course_id, chapter_id, teacher_id, due_date, max_score, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [title, description, instructions, course_id, chapter_id || null, req.user.id, due_date, max_score || 100, 'active']
  )

  res.status(201).json({ success: true, message: 'Assignment created', assignment: result.rows[0] })
}))

// POST /api/assignments/:id/submit (Student submits assignment)
router.post('/:id/submit', auth, upload.single('file'), asyncHandler(async (req, res) => {
  const { submission_text } = req.body
  const assignmentId = req.params.id

  if (!submission_text && !req.file) {
    return res.status(400).json({ success: false, message: 'Submission text or file required' })
  }

  let fileUrl = null
  if (req.file) {
    fileUrl = await uploadToS3(req.file, `assignments/${assignmentId}`)
  }

  // Check if already submitted
  const existing = await pool.query(
    'SELECT id FROM assignment_submissions WHERE assignment_id=$1 AND user_id=$2',
    [assignmentId, req.user.id]
  )

  let result
  if (existing.rows.length) {
    result = await pool.query(
      `UPDATE assignment_submissions SET submission_text=$1, file_url=$2, submitted_at=NOW(), status='submitted'
       WHERE assignment_id=$3 AND user_id=$4 RETURNING *`,
      [submission_text, fileUrl, assignmentId, req.user.id]
    )
  } else {
    result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, user_id, submission_text, file_url, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [assignmentId, req.user.id, submission_text, fileUrl, 'submitted']
    )
  }

  res.json({ success: true, message: 'Assignment submitted', submission: result.rows[0] })
}))

// PATCH /api/assignments/submissions/:id (Grade assignment)
router.patch('/submissions/:id', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { score, feedback } = req.body

  const result = await pool.query(
    `UPDATE assignment_submissions SET score=$1, feedback=$2, status='graded', graded_at=NOW()
     WHERE id=$3 RETURNING *`,
    [score, feedback, req.params.id]
  )

  res.json({ success: true, message: 'Assignment graded', submission: result.rows[0] })
}))

module.exports = router
