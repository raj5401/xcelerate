const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { pool } = require('../db')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password required' })
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email])
    if (existing.rows.length)
      return res.status(409).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name,email,phone,password) VALUES ($1,$2,$3,$4) RETURNING id,name,email,phone,role,status',
      [name, email, phone || null, hash]
    )
    const user  = result.rows[0]
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' })
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    if (!result.rows.length)
      return res.status(401).json({ message: 'Invalid credentials' })

    const user = result.rows[0]
    if (user.status === 'inactive')
      return res.status(403).json({ message: 'Account deactivated. Contact support.' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
    const { password: _, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
