const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const { auth } = require('../middleware/auth')
const { validateRegister, validateLogin, validateOTPVerify } = require('../middleware/validation')
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter')
const { sendOTP, sendWelcomeEmail, generateOTP } = require('../utils/emailService')
const { asyncHandler } = require('../middleware/errorHandler')

// POST /api/auth/register
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, class_level, subject } = req.body

  const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email])
  if (existing.rows.length) return res.status(409).json({ success: false, message: 'Email already registered' })

  const hash = await bcrypt.hash(password, 12)
  const result = await pool.query(
    `INSERT INTO users (name, email, phone, password, role, class_level, subject, status, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, email, role, status`,
    [name, email, phone || null, hash, role, class_level || null, subject || null, 'active', false]
  )

  const user = result.rows[0]
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  // Send welcome email
  try {
    await sendWelcomeEmail(email, name, role)
  } catch (emailErr) {
    console.error('Welcome email failed:', emailErr)
  }

  res.status(201).json({ success: true, message: 'Registration successful', token, user })
}))

// POST /api/auth/login
router.post('/login', loginLimiter, validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
  if (!result.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' })

  const user = result.rows[0]
  if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' })

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  const { password: _, ...safeUser } = user
  res.json({ success: true, message: 'Login successful', token, user: safeUser })
}))

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' })

  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  await pool.query('DELETE FROM otps WHERE email=$1', [email])
  await pool.query(
    'INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)',
    [email, otp, expiresAt]
  )

  try {
    await sendOTP(email, otp)
    res.json({ success: true, message: 'OTP sent successfully' })
  } catch (err) {
    console.error('OTP email failed:', err)
    res.status(500).json({ success: false, message: 'Failed to send OTP' })
  }
}))

// POST /api/auth/verify-otp
router.post('/verify-otp', validateOTPVerify, asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  const result = await pool.query(
    'SELECT * FROM otps WHERE email=$1 AND otp=$2 AND expires_at > NOW() AND used=false',
    [email, otp]
  )

  if (!result.rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })

  await pool.query('UPDATE otps SET used=true WHERE id=$1', [result.rows[0].id])

  // Mark email as verified
  await pool.query('UPDATE users SET is_verified=true WHERE email=$1', [email])

  res.json({ success: true, message: 'Email verified successfully' })
}))

// GET /api/auth/profile
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const user = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id])
  if (!user.rows.length) return res.status(404).json({ success: false, message: 'User not found' })

  const { password, ...safeUser } = user.rows[0]
  res.json({ success: true, user: safeUser })
}))

// PATCH /api/auth/profile
router.patch('/profile', auth, asyncHandler(async (req, res) => {
  const { name, phone, bio, avatar_url } = req.body

  const result = await pool.query(
    `UPDATE users SET name=COALESCE($1, name), phone=COALESCE($2, phone),
     bio=COALESCE($3, bio), avatar_url=COALESCE($4, avatar_url), updated_at=NOW()
     WHERE id=$5 RETURNING id, name, email, phone, bio, avatar_url, role, status`,
    [name, phone, bio, avatar_url, req.user.id]
  )

  res.json({ success: true, message: 'Profile updated successfully', user: result.rows[0] })
}))

// PATCH /api/auth/change-password
router.patch('/change-password', auth, asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' })

  const user = await pool.query('SELECT password FROM users WHERE id=$1', [req.user.id])
  if (!user.rows.length) return res.status(404).json({ success: false, message: 'User not found' })

  const valid = await bcrypt.compare(oldPassword, user.rows[0].password)
  if (!valid) return res.status(401).json({ success: false, message: 'Old password is incorrect' })

  const newHash = await bcrypt.hash(newPassword, 12)
  await pool.query('UPDATE users SET password=$1 WHERE id=$2', [newHash, req.user.id])

  res.json({ success: true, message: 'Password changed successfully' })
}))

module.exports = router
