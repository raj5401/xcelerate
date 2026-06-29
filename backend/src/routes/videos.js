const router = require('express').Router()
const multer = require('multer')
const { pool } = require('../db')
const { auth, teacherOrAdmin } = require('../middleware/auth')
const { uploadToS3, deleteFromS3 } = require('../utils/s3Service')
const { asyncHandler } = require('../middleware/errorHandler')

const upload = multer({ storage: multer.memoryStorage() })

// GET /api/videos/:courseId
router.get('/course/:courseId', asyncHandler(async (req, res) => {
  const videos = await pool.query(
    'SELECT id, title, description, duration, thumbnail_url, order_num, views FROM videos WHERE course_id=$1 ORDER BY order_num',
    [req.params.courseId]
  )
  res.json({ success: true, videos: videos.rows })
}))

// GET /api/videos/:id (Single video details)
router.get('/:id', asyncHandler(async (req, res) => {
  const video = await pool.query(
    `SELECT v.*, u.name as teacher_name FROM videos v
     LEFT JOIN users u ON u.id = v.teacher_id
     WHERE v.id=$1`,
    [req.params.id]
  )
  if (!video.rows.length) return res.status(404).json({ success: false, message: 'Video not found' })

  res.json({ success: true, video: video.rows[0] })
}))

// POST /api/videos/upload (Upload video)
router.post('/upload', auth, teacherOrAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Video file required' })

  const { title, course_id, chapter_id, duration, order_num } = req.body
  if (!title || !course_id) return res.status(400).json({ success: false, message: 'Title and course_id required' })

  // Upload to S3
  const s3Url = await uploadToS3(req.file, `videos/${course_id}`)
  const fileSizeMb = req.file.size / (1024 * 1024)

  const result = await pool.query(
    `INSERT INTO videos (course_id, chapter_id, teacher_id, title, s3_key, duration, file_size_mb, order_num)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [course_id, chapter_id || null, req.user.id, title, s3Url, duration || 0, fileSizeMb, order_num || 0]
  )

  res.status(201).json({ success: true, message: 'Video uploaded successfully', video: result.rows[0] })
}))

// POST /api/videos/:id/progress (Update watch progress)
router.post('/:id/progress', auth, asyncHandler(async (req, res) => {
  const { watched_seconds, watched_percent, completed } = req.body

  const existing = await pool.query(
    'SELECT id FROM video_progress WHERE user_id=$1 AND video_id=$2',
    [req.user.id, req.params.id]
  )

  if (existing.rows.length) {
    await pool.query(
      `UPDATE video_progress SET watched_seconds=$1, watched_percent=$2,
       completed=COALESCE($3, completed), completed_at=CASE WHEN $3=true THEN NOW() ELSE completed_at END
       WHERE user_id=$4 AND video_id=$5`,
      [watched_seconds, watched_percent, completed, req.user.id, req.params.id]
    )
  } else {
    await pool.query(
      `INSERT INTO video_progress (user_id, video_id, watched_seconds, watched_percent, completed, completed_at)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $5=true THEN NOW() ELSE NULL END)`,
      [req.user.id, req.params.id, watched_seconds, watched_percent, completed]
    )
  }

  // Update video views
  await pool.query('UPDATE videos SET views=views+1 WHERE id=$1', [req.params.id])

  res.json({ success: true, message: 'Progress saved' })
}))

// DELETE /api/videos/:id
router.delete('/:id', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const video = await pool.query('SELECT s3_key FROM videos WHERE id=$1', [req.params.id])
  if (video.rows.length) {
    await deleteFromS3(video.rows[0].s3_key)
  }

  await pool.query('DELETE FROM videos WHERE id=$1', [req.params.id])
  res.json({ success: true, message: 'Video deleted' })
}))

module.exports = router
