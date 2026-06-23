const router = require('express').Router()
const { pool } = require('../db')
const { auth } = require('../middleware/auth')

// GET /api/doubts?course_id=&chapter_id=
router.get('/', auth, async (req, res) => {
  const { course_id, chapter_id } = req.query
  try {
    const result = await pool.query(`
      SELECT d.*,
        u.name as student_name,
        a.name as answered_by_name
      FROM doubts d
      JOIN users u ON u.id = d.user_id
      LEFT JOIN users a ON a.id = d.answered_by
      WHERE ($1::int IS NULL OR d.course_id = $1)
        AND ($2::int IS NULL OR d.chapter_id = $2)
      ORDER BY d.created_at DESC
    `, [course_id || null, chapter_id || null])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/doubts — student asks
router.post('/', auth, async (req, res) => {
  const { course_id, chapter_id, question } = req.body
  if (!course_id || !question) return res.status(400).json({ message: 'course_id and question required' })
  try {
    const result = await pool.query(
      'INSERT INTO doubts (course_id,chapter_id,user_id,question) VALUES ($1,$2,$3,$4) RETURNING *',
      [course_id, chapter_id || null, req.user.id, question]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// PATCH /api/doubts/:id/answer — teacher answers
router.patch('/:id/answer', auth, async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only teachers can answer doubts' })
  const { answer } = req.body
  if (!answer) return res.status(400).json({ message: 'Answer required' })
  try {
    const result = await pool.query(
      `UPDATE doubts SET answer=$1, answered_by=$2, answered_at=NOW(), status='answered'
       WHERE id=$3 RETURNING *`,
      [answer, req.user.id, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/doubts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM doubts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ message: 'Doubt deleted' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

module.exports = router
