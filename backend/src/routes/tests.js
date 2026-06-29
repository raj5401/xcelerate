const router = require('express').Router()
const { pool } = require('../db')
const { auth, teacherOrAdmin, adminOnly } = require('../middleware/auth')
const { validateTestCreate } = require('../middleware/validation')
const { asyncHandler } = require('../middleware/errorHandler')
const { calculateScorePercentile } = require('../utils/helpers')

// GET /api/tests (List tests)
router.get('/', asyncHandler(async (req, res) => {
  const { course_id, batch_id, status } = req.query
  let query = `SELECT t.*, COUNT(q.id) as question_count FROM tests t
    LEFT JOIN questions q ON q.test_id = t.id
    WHERE t.status='active'`
  const params = []

  if (course_id) {
    query += ` AND t.course_id = $${params.length + 1}`
    params.push(course_id)
  }
  if (batch_id) {
    query += ` AND t.batch_id = $${params.length + 1}`
    params.push(batch_id)
  }

  query += ' GROUP BY t.id ORDER BY t.scheduled_at DESC'
  const tests = await pool.query(query, params)
  res.json({ success: true, tests: tests.rows })
}))

// GET /api/tests/:id
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const test = await pool.query(
    `SELECT t.*, COUNT(q.id) as question_count FROM tests t
     LEFT JOIN questions q ON q.test_id = t.id
     WHERE t.id=$1 GROUP BY t.id`,
    [req.params.id]
  )
  if (!test.rows.length) return res.status(404).json({ success: false, message: 'Test not found' })

  // Get questions only for authorized users or after test window
  const t = test.rows[0]
  let questions = []
  if (req.user?.role === 'admin' || req.user?.role === 'teacher' || t.scheduled_at <= new Date()) {
    const q = await pool.query(
      'SELECT id, text, option_a, option_b, option_c, option_d, marks FROM questions WHERE test_id=$1 ORDER BY id',
      [req.params.id]
    )
    questions = q.rows
  }

  res.json({ success: true, test: { ...t, questions } })
}))

// POST /api/tests (Create test)
router.post('/', auth, teacherOrAdmin, validateTestCreate, asyncHandler(async (req, res) => {
  const { title, description, course_id, batch_id, duration, total_marks, scheduled_at, test_type } = req.body

  const result = await pool.query(
    `INSERT INTO tests (title, description, course_id, batch_id, teacher_id, duration, total_marks, scheduled_at, test_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [title, description, course_id, batch_id, req.user.id, duration, total_marks, scheduled_at, test_type, 'active']
  )

  res.status(201).json({ success: true, message: 'Test created', test: result.rows[0] })
}))

// POST /api/tests/:id/questions (Add questions)
router.post('/:id/questions', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const { questions } = req.body
  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ success: false, message: 'Questions array required' })
  }

  const testId = req.params.id
  const insertedQuestions = []

  for (const q of questions) {
    const result = await pool.query(
      `INSERT INTO questions (test_id, question_type, text, option_a, option_b, option_c, option_d, correct, marks, negative, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [testId, q.question_type || 'mcq', q.text, q.option_a, q.option_b, q.option_c, q.option_d,
        q.correct, q.marks || 4, q.negative || 1, q.difficulty || 'medium']
    )
    insertedQuestions.push(result.rows[0])
  }

  res.status(201).json({ success: true, message: `${questions.length} questions added`, questions: insertedQuestions })
}))

// POST /api/tests/:id/start (Student starts test)
router.post('/:id/start', auth, asyncHandler(async (req, res) => {
  const testId = req.params.id
  const userId = req.user.id

  // Check if test is available
  const test = await pool.query('SELECT * FROM tests WHERE id=$1 AND status=$2', [testId, 'active'])
  if (!test.rows.length) return res.status(404).json({ success: false, message: 'Test not found' })

  const t = test.rows[0]
  if (t.scheduled_at && new Date(t.scheduled_at) > new Date()) {
    return res.status(403).json({ success: false, message: 'Test has not started yet' })
  }

  // Check for existing attempt
  const existing = await pool.query(
    'SELECT * FROM attempts WHERE test_id=$1 AND user_id=$2',
    [testId, userId]
  )

  if (existing.rows.length && existing.rows[0].status === 'submitted') {
    return res.status(409).json({ success: false, message: 'You have already submitted this test' })
  }

  if (existing.rows.length) {
    return res.json({ success: true, attempt: existing.rows[0] })
  }

  // Create new attempt
  const result = await pool.query(
    `INSERT INTO attempts (test_id, user_id, status) VALUES ($1, $2, $3) RETURNING *`,
    [testId, userId, 'in_progress']
  )

  res.json({ success: true, attempt: result.rows[0] })
}))

// POST /api/tests/:id/submit (Submit test)
router.post('/:id/submit', auth, asyncHandler(async (req, res) => {
  const { answers } = req.body
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ success: false, message: 'Valid answers object required' })
  }

  const testId = req.params.id
  const userId = req.user.id

  // Get all questions
  const questions = await pool.query(
    'SELECT id, correct, marks, negative FROM questions WHERE test_id=$1',
    [testId]
  )

  let score = 0, correctCount = 0, wrongCount = 0, skippedCount = 0

  for (const q of questions.rows) {
    const answer = answers[q.id.toString()]
    if (!answer) {
      skippedCount++
    } else if (answer === q.correct) {
      score += Number(q.marks || 4)
      correctCount++
    } else {
      score -= Number(q.negative || 1)
      wrongCount++
    }
  }

  score = Math.max(0, score) // Floor at 0

  // Get test info for passing marks
  const test = await pool.query('SELECT total_marks, passing_marks FROM tests WHERE id=$1', [testId])
  const percentile = (score / test.rows[0].total_marks) * 100

  // Update or create attempt
  const result = await pool.query(
    `INSERT INTO attempts (test_id, user_id, answers, score, obtained_marks, status, submitted_at, duration_taken, correct_count, wrong_count, skipped_count, percentile)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0, $7, $8, $9, $10)
     ON CONFLICT (test_id, user_id) DO UPDATE SET
       answers=$3, score=$4, obtained_marks=$5, status='submitted', submitted_at=NOW(), correct_count=$7, wrong_count=$8, skipped_count=$9, percentile=$10
     RETURNING *`,
    [testId, userId, JSON.stringify(answers), score, score, 'submitted', correctCount, wrongCount, skippedCount, percentile]
  )

  res.json({
    success: true,
    message: 'Test submitted successfully',
    attempt: result.rows[0],
    summary: { score, correctCount, wrongCount, skippedCount, percentile }
  })
}))

// GET /api/tests/:id/results
router.get('/:id/results', auth, asyncHandler(async (req, res) => {
  const test = await pool.query('SELECT * FROM tests WHERE id=$1', [req.params.id])
  if (!test.rows.length) return res.status(404).json({ success: false, message: 'Test not found' })

  // Check if results are published or user is admin
  if (!test.rows[0].results_published && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Results not published yet' })
  }

  const results = await pool.query(
    `SELECT u.id, u.name, u.email, a.score, a.obtained_marks, a.submitted_at, a.percentile,
     RANK() OVER (ORDER BY a.score DESC) as rank
     FROM attempts a
     JOIN users u ON u.id = a.user_id
     WHERE a.test_id=$1 AND a.status='submitted'
     ORDER BY a.score DESC`,
    [req.params.id]
  )

  res.json({ success: true, results: results.rows })
}))

// POST /api/tests/:id/publish-results
router.post('/:id/publish-results', auth, adminOnly, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'UPDATE tests SET results_published=true, published_at=NOW() WHERE id=$1 RETURNING *',
    [req.params.id]
  )

  res.json({ success: true, message: 'Results published', test: result.rows[0] })
}))

module.exports = router
