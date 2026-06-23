const router  = require('express').Router()
const { pool } = require('../db')
const { auth, adminOnly } = require('../middleware/auth')

// GET /api/payments — admin
router.get('/', auth, adminOnly, async (req, res) => {
  const { status = '' } = req.query
  try {
    const result = await pool.query(`
      SELECT p.*, u.phone
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE ($1 = '' OR p.status = $1)
      ORDER BY p.created_at DESC
    `, [status])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// GET /api/payments/stats — admin
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status='paid'    THEN amount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status='pending' THEN amount END), 0) as pending,
        COALESCE(SUM(CASE WHEN status='failed'  THEN amount END), 0) as failed,
        COUNT(*) as total
      FROM payments
    `)
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/payments/:id — admin mark paid/failed
router.patch('/:id', auth, adminOnly, async (req, res) => {
  const { status } = req.body
  try {
    const result = await pool.query(
      'UPDATE payments SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

module.exports = router
