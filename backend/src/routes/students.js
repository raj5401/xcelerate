const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const { pool } = require('../db')
const { auth, adminOnly } = require('../middleware/auth')

// GET /api/students — admin
router.get('/', auth, adminOnly, async (req, res) => {
  const { search = '', status = '' } = req.query
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
        COUNT(e.id) as enrolled_courses
      FROM users u
      LEFT JOIN enrollments e ON e.user_id = u.id
      WHERE u.role = 'student'
        AND ($1 = '' OR u.name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1)
        AND ($2 = '' OR u.status = $2)
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `, [`%${search}%`, status])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/students — admin creates student
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, email, phone, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email, password required' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name,email,phone,password,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,phone,status,created_at',
      [name, email, phone, hash, 'student']
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already exists' })
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/students/:id — admin toggle status
router.patch('/:id', auth, adminOnly, async (req, res) => {
  const { status, name, phone } = req.body
  try {
    const result = await pool.query(
      'UPDATE users SET status=COALESCE($1,status), name=COALESCE($2,name), phone=COALESCE($3,phone) WHERE id=$4 RETURNING id,name,email,phone,status',
      [status, name, phone, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/students/:id — admin
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1 AND role=$2', [req.params.id, 'student'])
    res.json({ message: 'Student deleted' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

module.exports = router
