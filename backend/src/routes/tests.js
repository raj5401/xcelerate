const router = require('express').Router()
const { pool } = require('../db')
const { auth, adminOnly } = require('../middleware/auth')

// ── SCHEDULED / OPEN routes (must be before /:id) ────────────

// GET /api/tests/scheduled — tests visible to students right now
router.get('/scheduled', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, COUNT(q.id) as question_count
      FROM tests t
      LEFT JOIN questions q ON q.test_id = t.id
      WHERE t.status = 'active'
        AND (
          t.scheduled_at IS NULL
          OR t.scheduled_at <= NOW()
        )
      GROUP BY t.id
      ORDER BY t.scheduled_at DESC NULLS LAST, t.created_at DESC
    `)
    res.json(result.rows)
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/tests/upcoming — tests scheduled for the future (admin + preview)
router.get('/upcoming', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, COUNT(q.id) as question_count
      FROM tests t
      LEFT JOIN questions q ON q.test_id = t.id
      WHERE t.status = 'active' AND t.scheduled_at > NOW()
      GROUP BY t.id
      ORDER BY t.scheduled_at ASC
    `)
    res.json(result.rows)
  } catch(err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// ── ADMIN CRUD ────────────────────────────────────────────────

// GET /api/tests — admin gets all tests, students get scheduled tests
router.get('/', auth, async (req, res) => {
  if (req.user.role === 'admin') return getAdminTests(req, res)
  return getStudentTests(req, res)
})

async function getStudentTests(req, res) {
  try {
    const result = await pool.query(`
      SELECT t.*, COUNT(q.id) as question_count
      FROM tests t
      LEFT JOIN questions q ON q.test_id = t.id
      WHERE t.status = 'active'
        AND (t.scheduled_at IS NULL OR t.scheduled_at <= NOW())
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `)
    res.json(result.rows)
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
}

async function getAdminTests(req, res) {
  try {
    const result = await pool.query(`
      SELECT t.*,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(DISTINCT a.id) as attempt_count,
        COUNT(DISTINCT CASE WHEN a.status='submitted' THEN a.id END) as submitted_count
      FROM tests t
      LEFT JOIN questions q ON q.test_id = t.id
      LEFT JOIN attempts a ON a.test_id = t.id
      WHERE t.status = 'active'
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `)
    res.json(result.rows)
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
}

// POST /api/tests
router.post('/', auth, adminOnly, async (req, res) => {
  const { title, exam, batch_class, duration, total_marks, scheduled_at } = req.body
  if (!title || !duration || !total_marks)
    return res.status(400).json({ message: 'Title, duration and marks required' })
  try {
    const result = await pool.query(
      'INSERT INTO tests (title,exam,batch_class,duration,total_marks,scheduled_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, exam, batch_class, duration, total_marks, scheduled_at || null]
    )
    res.status(201).json(result.rows[0])
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/tests/:id — update test (including reschedule)
router.patch('/:id', auth, adminOnly, async (req, res) => {
  const { title, exam, batch_class, duration, total_marks, scheduled_at } = req.body
  try {
    const result = await pool.query(
      `UPDATE tests SET
        title=COALESCE($1,title), exam=COALESCE($2,exam),
        batch_class=COALESCE($3,batch_class), duration=COALESCE($4,duration),
        total_marks=COALESCE($5,total_marks), scheduled_at=$6
       WHERE id=$7 RETURNING *`,
      [title, exam, batch_class, duration, total_marks, scheduled_at || null, req.params.id]
    )
    res.json(result.rows[0])
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/tests/:id/questions
router.post('/:id/questions', auth, adminOnly, async (req, res) => {
  const { questions } = req.body
  if (!questions?.length) return res.status(400).json({ message: 'Questions array required' })
  try {
    for (const q of questions) {
      await pool.query(
        'INSERT INTO questions (test_id,text,option_a,option_b,option_c,option_d,correct,marks,negative) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [req.params.id, q.text, q.option_a, q.option_b, q.option_c, q.option_d,
         q.correct.toUpperCase(), q.marks || 4, q.negative ?? 1]
      )
    }
    res.status(201).json({ message: `${questions.length} questions added` })
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/tests/:id/questions-admin
router.get('/:id/questions-admin', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions WHERE test_id=$1 ORDER BY id', [req.params.id])
    res.json(result.rows)
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/tests/:id/questions/:qid
router.delete('/:id/questions/:qid', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id=$1 AND test_id=$2', [req.params.qid, req.params.id])
    res.json({ message: 'Question deleted' })
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

// GET /api/tests/:id — student gets test with questions (only if visible)
router.get('/:id', auth, async (req, res) => {
  try {
    const test = await pool.query('SELECT * FROM tests WHERE id=$1 AND status=$2', [req.params.id, 'active'])
    if (!test.rows.length) return res.status(404).json({ message: 'Test not found' })

    const t = test.rows[0]
    // Students can't access future scheduled tests
    if (req.user.role !== 'admin' && t.scheduled_at && new Date(t.scheduled_at) > new Date()) {
      return res.status(403).json({ message: 'This test has not started yet' })
    }

    const questions = await pool.query(
      'SELECT id,text,option_a,option_b,option_c,option_d,marks FROM questions WHERE test_id=$1 ORDER BY id',
      [req.params.id]
    )
    res.json({ ...t, questions: questions.rows })
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/tests/:id/start
router.post('/:id/start', auth, async (req, res) => {
  try {
    const test = await pool.query('SELECT * FROM tests WHERE id=$1', [req.params.id])
    if (!test.rows.length) return res.status(404).json({ message: 'Test not found' })

    // Block if scheduled in future
    const t = test.rows[0]
    if (t.scheduled_at && new Date(t.scheduled_at) > new Date()) {
      return res.status(403).json({ message: 'Test has not started yet' })
    }

    const existing = await pool.query(
      'SELECT * FROM attempts WHERE test_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    )
    if (existing.rows.length) return res.json(existing.rows[0])

    const result = await pool.query(
      'INSERT INTO attempts (test_id,user_id,status) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, req.user.id, 'in_progress']
    )
    res.json(result.rows[0])
  } catch(err) {
    console.error('Start error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// POST /api/tests/:id/submit — JEE scoring: +4 correct, -1 wrong, 0 skipped
router.post('/:id/submit', auth, async (req, res) => {
  const { answers } = req.body
  try {
    const questions = await pool.query(
      'SELECT id, correct, marks, negative FROM questions WHERE test_id=$1',
      [req.params.id]
    )

    let score    = 0
    let correct  = 0
    let wrong    = 0
    let skipped  = 0

    for (const q of questions.rows) {
      const ans = answers[q.id]
      if (!ans) { skipped++; continue }
      if (ans === q.correct) {
        score += Number(q.marks || 4)
        correct++
      } else {
        score -= Number(q.negative || 1)
        wrong++
      }
    }
    score = Math.max(0, score) // floor at 0

    const result = await pool.query(
      `INSERT INTO attempts (test_id,user_id,answers,score,status,submitted_at)
       VALUES ($1,$2,$3,$4,'submitted',NOW())
       ON CONFLICT (test_id,user_id)
       DO UPDATE SET answers=$3, score=$4, status='submitted', submitted_at=NOW()
       RETURNING *`,
      [req.params.id, req.user.id, JSON.stringify(answers), score]
    )
    res.json({ score, correct, wrong, skipped, attempt: result.rows[0] })
  } catch(err) {
    console.error('Submit error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/tests/:id/results — only if published (or admin)
router.get('/:id/results', auth, async (req, res) => {
  try {
    const test = await pool.query('SELECT * FROM tests WHERE id=$1', [req.params.id])
    if (!test.rows.length) return res.status(404).json({ message: 'Test not found' })

    if (!test.rows[0].results_published && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Results not published yet.', not_published: true })
    }

    const result = await pool.query(`
      SELECT
        u.name, u.email,
        a.score, a.answers, a.submitted_at,
        RANK() OVER (ORDER BY a.score DESC) as rank,
        t.total_marks,
        t.title as test_title,
        (SELECT COUNT(*) FROM questions WHERE test_id=t.id) as total_questions,
        (
          SELECT COUNT(*) FROM (
            SELECT q.id, q.correct,
              (a.answers->>q.id::text) as given
            FROM questions q
            WHERE q.test_id = t.id
              AND (a.answers->>q.id::text) IS NOT NULL
          ) sub
        ) as attempted
      FROM attempts a
      JOIN users u ON u.id = a.user_id
      JOIN tests t ON t.id = a.test_id
      WHERE a.test_id=$1 AND a.status='submitted'
      ORDER BY a.score DESC
    `, [req.params.id])
    res.json(result.rows)
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/tests/:id/submissions — admin sees all
router.get('/:id/submissions', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id, a.score, a.answers, a.status, a.started_at, a.submitted_at,
        u.name, u.email, u.phone,
        t.total_marks, t.title as test_title,
        (SELECT COUNT(*) FROM questions WHERE test_id=t.id) as total_questions,
        RANK() OVER (PARTITION BY a.test_id ORDER BY a.score DESC) as rank,
        (
          SELECT COUNT(*) FROM json_each_text(a.answers::json)
        ) as attempted
      FROM attempts a
      JOIN users u ON u.id = a.user_id
      JOIN tests t ON t.id = a.test_id
      WHERE a.test_id=$1
      ORDER BY a.score DESC NULLS LAST
    `, [req.params.id])
    res.json(result.rows)
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/tests/:id/publish
router.post('/:id/publish', auth, adminOnly, async (req, res) => {
  try {
    await pool.query(
      'UPDATE tests SET results_published=true, published_at=NOW() WHERE id=$1',
      [req.params.id]
    )
    res.json({ message: 'Results published' })
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/tests/:id/unpublish
router.post('/:id/unpublish', auth, adminOnly, async (req, res) => {
  try {
    await pool.query(
      'UPDATE tests SET results_published=false, published_at=NULL WHERE id=$1',
      [req.params.id]
    )
    res.json({ message: 'Results unpublished' }) 
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/tests/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE tests SET status=$1 WHERE id=$2', ['inactive', req.params.id])
    res.json({ message: 'Test deactivated' })
  } catch(err) { res.status(500).json({ message: 'Server error' }) }
})

module.exports = router
