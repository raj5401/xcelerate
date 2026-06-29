const router = require('express').Router()
const { pool } = require('../db')
const { auth, studentOnly, adminOnly } = require('../middleware/auth')
const { createOrder, verifyPayment, capturePayment } = require('../utils/paymentService')
const { sendNotification } = require('../utils/emailService')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /api/payments (Admin - all payments)
router.get('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  let query = 'SELECT * FROM payments WHERE 1=1'
  const params = []

  if (status) {
    query += ` AND status = $${params.length + 1}`
    params.push(status)
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, (page - 1) * limit)

  const payments = await pool.query(query, params)
  res.json({ success: true, payments: payments.rows, page, limit })
}))

// GET /api/payments/my (Student - their payments)
router.get('/my', auth, studentOnly, asyncHandler(async (req, res) => {
  const payments = await pool.query(
    'SELECT * FROM payments WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  )
  res.json({ success: true, payments: payments.rows })
}))

// POST /api/payments/create-order (Create Razorpay order)
router.post('/create-order', auth, asyncHandler(async (req, res) => {
  const { course_id, amount } = req.body
  if (!course_id || !amount) return res.status(400).json({ success: false, message: 'course_id and amount required' })

  const user = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id])
  const course = await pool.query('SELECT * FROM courses WHERE id=$1', [course_id])

  if (!user.rows.length || !course.rows.length) {
    return res.status(404).json({ success: false, message: 'User or course not found' })
  }

  try {
    const order = await createOrder(amount, `payment-${Date.now()}`, {
      user_id: req.user.id,
      course_id: course_id,
    })

    // Save payment record
    const payment = await pool.query(
      `INSERT INTO payments (user_id, course_id, student_name, email, phone, course_title, amount, final_amount, status, razorpay_order_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, course_id, user.rows[0].name, user.rows[0].email, user.rows[0].phone,
        course.rows[0].title, amount, amount, 'pending', order.id]
    )

    res.json({ success: true, message: 'Order created', order: order, payment: payment.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create order', error: err.message })
  }
}))

// POST /api/payments/verify (Verify payment)
router.post('/verify', auth, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body

  const isValid = verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature)
  if (!isValid) return res.status(400).json({ success: false, message: 'Invalid payment signature' })

  // Update payment
  const payment = await pool.query(
    `UPDATE payments SET status='paid', razorpay_payment_id=$1, razorpay_signature=$2, paid_at=NOW()
     WHERE id=$3 RETURNING *`,
    [razorpay_payment_id, razorpay_signature, payment_id]
  )

  if (!payment.rows.length) return res.status(404).json({ success: false, message: 'Payment not found' })

  // Create enrollment
  await pool.query(
    `INSERT INTO enrollments (user_id, course_id, payment_id, enrollment_type, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user.id, payment.rows[0].course_id, payment_id, 'paid', 'active']
  )

  // Send notification
  try {
    await sendNotification(payment.rows[0].email, 'Payment Successful', `Your payment for ${payment.rows[0].course_title} has been received. Course access granted!`)
  } catch (err) {
    console.error('Notification failed:', err)
  }

  res.json({ success: true, message: 'Payment verified successfully', payment: payment.rows[0] })
}))

// GET /api/payments/stats (Admin - payment statistics)
router.get('/stats', auth, adminOnly, asyncHandler(async (req, res) => {
  const stats = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status='paid' THEN final_amount ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN status='pending' THEN final_amount ELSE 0 END), 0) as pending_amount,
      COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count,
      COUNT(*) as total_payments
    FROM payments
  `)
  res.json({ success: true, stats: stats.rows[0] })
}))

module.exports = router
