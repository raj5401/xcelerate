const router = require('express').Router()
const { pool } = require('../db')
const { auth, adminOnly } = require('../middleware/auth')

function teacherOrAdmin(req, res, next) {
  if (req.user?.role === 'admin' || req.user?.role === 'teacher') return next()
  return res.status(403).json({ message: 'Teacher or admin access required' })
}

// GET /api/courses — public, with filters
router.get('/', async (req, res) => {
  const { subject, class_level } = req.query
  try {
    const result = await pool.query(`
      SELECT c.*,
        u.name as teacher_name, u.subject as teacher_subject, u.bio as teacher_bio,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON u.id = c.teacher_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.status = 'active'
        AND ($1::text IS NULL OR c.subject = $1)
        AND ($2::text IS NULL OR c.class_level = $2)
      GROUP BY c.id, u.name, u.subject, u.bio
      ORDER BY c.subject, c.class_level
    `, [subject || null, class_level || null])
    res.json(result.rows)
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }) }
})

// GET /api/courses/:id — public, full detail with chapters
router.get('/:id', async (req, res) => {
  try {
    const course = await pool.query(`
      SELECT c.*,
        u.name as teacher_name, u.subject as teacher_subject,
        u.bio as teacher_bio, u.avatar_url as teacher_avatar
      FROM courses c
      LEFT JOIN users u ON u.id = c.teacher_id
      WHERE c.id = $1 AND c.status = 'active'
    `, [req.params.id])
    if (!course.rows.length) return res.status(404).json({ message: 'Course not found' })

    const chapters = await pool.query(
      'SELECT * FROM chapters WHERE course_id=$1 ORDER BY order_num',
      [req.params.id]
    )
    res.json({ ...course.rows[0], chapters: chapters.rows })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// GET /api/courses/my/enrollments — student
router.get('/my/enrollments', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, b.name as batch_name, b.schedule, b.meet_link,
        u.name as teacher_name, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN batches b ON b.id = e.batch_id
      LEFT JOIN users u ON u.id = c.teacher_id
      WHERE e.user_id = $1
      ORDER BY e.enrolled_at DESC
    `, [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/courses/enroll — free enrollment
router.post('/enroll', auth, async (req, res) => {
  const { course_id, batch_id } = req.body
  if (!course_id) return res.status(400).json({ message: 'course_id required' })
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id=$1 AND status=$2', [course_id, 'active'])
    if (!course.rows.length) return res.status(404).json({ message: 'Course not found' })

    const existing = await pool.query('SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2', [req.user.id, course_id])
    if (existing.rows.length) return res.status(409).json({ message: 'Already enrolled' })

    const result = await pool.query(
      'INSERT INTO enrollments (user_id,course_id,batch_id) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, course_id, batch_id || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }) }
})

// GET /api/courses/batches/all — admin/teacher
router.get('/batches/all', auth, teacherOrAdmin, async (req, res) => {
  try {
    const whereClause = req.user.role === 'teacher' ? 'WHERE b.teacher_id=$1' : ''
    const params      = req.user.role === 'teacher' ? [req.user.id] : []
    const result = await pool.query(`
      SELECT b.*, c.title as course_title, c.subject,
        COUNT(e.id) as students
      FROM batches b
      LEFT JOIN courses c ON c.id = b.course_id
      LEFT JOIN enrollments e ON e.batch_id = b.id
      ${whereClause}
      GROUP BY b.id, c.title, c.subject
      ORDER BY b.created_at DESC
    `, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/courses — admin only
router.post('/', auth, adminOnly, async (req, res) => {
  const { title, subject, class_level, teacher_id, price, description, language } = req.body
  if (!title || !subject || !class_level) return res.status(400).json({ message: 'Title, subject and class_level required' })
  try {
    const result = await pool.query(
      'INSERT INTO courses (title,subject,class_level,teacher_id,price,description,language) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, subject, class_level, teacher_id || null, price || 0, description, language || 'English']
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/courses/:id — admin or teacher (own course)
router.patch('/:id', auth, teacherOrAdmin, async (req, res) => {
  const { title, subject, class_level, price, description, language, status } = req.body
  try {
    if (req.user.role === 'teacher') {
      const own = await pool.query('SELECT id FROM courses WHERE id=$1 AND teacher_id=$2', [req.params.id, req.user.id])
      if (!own.rows.length) return res.status(403).json({ message: 'Not your course' })
    }
    const result = await pool.query(
      `UPDATE courses SET title=COALESCE($1,title), subject=COALESCE($2,subject),
        class_level=COALESCE($3,class_level), price=COALESCE($4,price),
        description=COALESCE($5,description), language=COALESCE($6,language),
        status=COALESCE($7,status)
       WHERE id=$8 RETURNING *`,
      [title, subject, class_level, price, description, language, status, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/courses/:id — admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE courses SET status=$1 WHERE id=$2', ['inactive', req.params.id])
    res.json({ message: 'Course deactivated' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// ── CHAPTERS ───────────────────────────────────────────────────

// GET /api/courses/:id/chapters
router.get('/:id/chapters', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chapters WHERE course_id=$1 ORDER BY order_num',
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/courses/:id/chapters — teacher or admin
router.post('/:id/chapters', auth, teacherOrAdmin, async (req, res) => {
  const { title, description, order_num } = req.body
  if (!title) return res.status(400).json({ message: 'Title required' })
  try {
    const result = await pool.query(
      'INSERT INTO chapters (course_id,title,description,order_num) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, title, description, order_num || 0]
    )
    await pool.query('UPDATE courses SET total_chapters=(SELECT COUNT(*) FROM chapters WHERE course_id=$1) WHERE id=$1', [req.params.id])
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// ── BATCHES ────────────────────────────────────────────────────

// POST /api/courses/batches
router.post('/batches', auth, teacherOrAdmin, async (req, res) => {
  const { name, course_id, schedule, meet_link, start_date } = req.body
  if (!name || !course_id) return res.status(400).json({ message: 'Name and course required' })
  try {
    const result = await pool.query(
      'INSERT INTO batches (name,course_id,teacher_id,schedule,meet_link,start_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, course_id, req.user.id, schedule, meet_link, start_date || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/courses/batches/:id
router.patch('/batches/:id', auth, teacherOrAdmin, async (req, res) => {
  const { name, schedule, meet_link, start_date, status } = req.body
  try {
    const result = await pool.query(
      `UPDATE batches SET name=COALESCE($1,name), schedule=COALESCE($2,schedule),
        meet_link=COALESCE($3,meet_link), start_date=COALESCE($4,start_date), status=COALESCE($5,status)
       WHERE id=$6 RETURNING *`,
      [name, schedule, meet_link, start_date, status, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/courses/batches/:id
router.delete('/batches/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM batches WHERE id=$1', [req.params.id])
    res.json({ message: 'Batch deleted' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

module.exports = router
