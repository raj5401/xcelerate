const router = require('express').Router()
const multer = require('multer')
const { pool } = require('../db')
const { auth, teacherOrAdmin } = require('../middleware/auth')
const { uploadToS3 } = require('../utils/s3Service')
const { asyncHandler } = require('../middleware/errorHandler')

const upload = multer({ storage: multer.memoryStorage() })

// GET /api/study-materials
router.get('/', asyncHandler(async (req, res) => {
  const { course_id, material_type, page = 1, limit = 20 } = req.query
  let query = `SELECT s.*, c.title as course_title, u.name as teacher_name
    FROM study_materials s
    JOIN courses c ON c.id = s.course_id
    LEFT JOIN users u ON u.id = s.teacher_id
    WHERE 1=1`
  const params = []

  if (course_id) {
    query += ` AND s.course_id = $${params.length + 1}`
    params.push(course_id)
  }
  if (material_type) {
    query += ` AND s.material_type = $${params.length + 1}`
    params.push(material_type)
  }

  query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, (page - 1) * limit)

  const materials = await pool.query(query, params)
  res.json({ success: true, materials: materials.rows, page, limit })
}))

// POST /api/study-materials/upload
router.post('/upload', auth, teacherOrAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File required' })

  const { title, course_id, chapter_id, material_type, description } = req.body
  if (!title || !course_id || !material_type) {
    return res.status(400).json({ success: false, message: 'title, course_id, and material_type required' })
  }

  const s3Url = await uploadToS3(req.file, `study-materials/${course_id}`)
  const fileSizeMb = req.file.size / (1024 * 1024)

  const result = await pool.query(
    `INSERT INTO study_materials (title, course_id, chapter_id, teacher_id, material_type, s3_key, file_size_mb, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, course_id, chapter_id || null, req.user.id, material_type, s3Url, fileSizeMb, description || null]
  )

  res.status(201).json({ success: true, message: 'Study material uploaded', material: result.rows[0] })
}))

// POST /api/study-materials/:id/download
router.post('/:id/download', auth, asyncHandler(async (req, res) => {
  await pool.query('UPDATE study_materials SET downloads=downloads+1 WHERE id=$1', [req.params.id])
  res.json({ success: true, message: 'Download count updated' })
}))

module.exports = router
