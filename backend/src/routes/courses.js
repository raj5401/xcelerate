const router = require('express').Router()
const { pool } = require('../db')
const { auth, adminOnly } = require('../middleware/auth')

// GET /api/courses — public
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(e.id) as enrolled
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// GET /api/courses/my/enrollments — student
router.get('/my/enrollments', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, b.name as batch_name, b.schedule, b.meet_link, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN batches b ON b.id = e.batch_id
      WHERE e.user_id = $1
      ORDER BY e.enrolled_at DESC
    `, [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/courses/enroll — student
router.post('/enroll', auth, async (req, res) => {
  const { course_id, batch_id } = req.body
  if (!course_id) return res.status(400).json({ message: 'course_id required' })
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id=$1 AND status=$2', [course_id, 'active'])
    if (!course.rows.length) return res.status(404).json({ message: 'Course not found' })

    const existing = await pool.query('SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2', [req.user.id, course_id])
    if (existing.rows.length) return res.status(409).json({ message: 'Already enrolled' })

    // Create pending payment
    await pool.query(
      'INSERT INTO payments (user_id,course_id,student_name,email,course_title,amount,status) SELECT $1,$2,u.name,u.email,$3,$4,$5 FROM users u WHERE u.id=$1',
      [req.user.id, course_id, course.rows[0].title, course.rows[0].price, 'pending']
    )
    const result = await pool.query(
      'INSERT INTO enrollments (user_id,course_id,batch_id) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, course_id, batch_id || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }) }
})

// GET /api/courses/batches/all — admin
router.get('/batches/all', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.title as course_title,
        COUNT(e.id) as students
      FROM batches b
      LEFT JOIN courses c ON c.id = b.course_id
      LEFT JOIN enrollments e ON e.batch_id = b.id
      GROUP BY b.id, c.title
      ORDER BY b.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/courses — admin
router.post('/', auth, adminOnly, async (req, res) => {
  const { title, exam, batch_class, price, chapters, description } = req.body
  if (!title) return res.status(400).json({ message: 'Title required' })
  try {
    const result = await pool.query(
      'INSERT INTO courses (title,exam,batch_class,price,chapters,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, exam, batch_class, price || 0, chapters || 0, description]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/courses/:id — admin
router.patch('/:id', auth, adminOnly, async (req, res) => {
  const { title, exam, batch_class, price, chapters, description } = req.body
  try {
    const result = await pool.query(
      `UPDATE courses SET
        title=COALESCE($1,title), exam=COALESCE($2,exam),
        batch_class=COALESCE($3,batch_class), price=COALESCE($4,price),
        chapters=COALESCE($5,chapters), description=COALESCE($6,description)
       WHERE id=$7 RETURNING *`,
      [title, exam, batch_class, price, chapters, description, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/courses/:id — admin
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE courses SET status=$1 WHERE id=$2', ['inactive', req.params.id])
    res.json({ message: 'Course deactivated' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/courses/batches — admin
router.post('/batches', auth, adminOnly, async (req, res) => {
  const { name, course_id, exam, schedule, meet_link, start_date } = req.body
  if (!name || !course_id) return res.status(400).json({ message: 'Name and course required' })
  try {
    const result = await pool.query(
      'INSERT INTO batches (name,course_id,exam,schedule,meet_link,start_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, course_id, exam, schedule, meet_link, start_date || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/courses/batches/:id — admin
router.patch('/batches/:id', auth, adminOnly, async (req, res) => {
  const { name, exam, schedule, meet_link, start_date, status } = req.body
  try {
    const result = await pool.query(
      `UPDATE batches SET
        name=COALESCE($1,name), exam=COALESCE($2,exam),
        schedule=COALESCE($3,schedule), meet_link=COALESCE($4,meet_link),
        start_date=COALESCE($5,start_date), status=COALESCE($6,status)
       WHERE id=$7 RETURNING *`,
      [name, exam, schedule, meet_link, start_date, status, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/courses/batches/:id — admin
router.delete('/batches/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM batches WHERE id=$1', [req.params.id])
    res.json({ message: 'Batch deleted' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

module.exports = router
