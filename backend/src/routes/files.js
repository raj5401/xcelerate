const router  = require('express').Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const { pool } = require('../db')
const { auth, adminOnly } = require('../middleware/auth')

const UPLOADS_DIR = path.join(__dirname, '../../uploads')

// Multer storage
function storage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOADS_DIR, subfolder)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e6)
      cb(null, unique + path.extname(file.originalname))
    },
  })
}

const uploadNote  = multer({ storage: storage('notes'),  limits: { fileSize: 50 * 1024 * 1024 } })
const uploadVideo = multer({ storage: storage('videos'), limits: { fileSize: 2 * 1024 * 1024 * 1024 } })

// ── NOTES ──────────────────────────────────────────────

// GET /api/files/notes — student (enrolled) or admin
router.get('/notes', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.id, n.title, n.course_id, n.chapter_id, n.size_kb, n.downloads, n.created_at,
        c.title as course_title, c.subject,
        ch.title as chapter_title
      FROM notes n
      LEFT JOIN courses c ON c.id = n.course_id
      LEFT JOIN chapters ch ON ch.id = n.chapter_id
      ORDER BY n.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/files/notes/upload — admin/teacher
router.post('/notes/upload', auth, uploadNote.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File required' })
  const { title, course_id, chapter_id } = req.body
  const size_kb = Math.round(req.file.size / 1024)
  try {
    const result = await pool.query(
      'INSERT INTO notes (title,course_id,chapter_id,teacher_id,filename,size_kb) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title || req.file.originalname, course_id || null, chapter_id || null, req.user.id, req.file.filename, size_kb]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// GET /api/files/notes/:id/download
router.get('/notes/:id/download', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id=$1', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Note not found' })
    const note = result.rows[0]
    const filepath = path.join(UPLOADS_DIR, 'notes', note.filename)
    if (!fs.existsSync(filepath)) return res.status(404).json({ message: 'File not found on disk' })
    await pool.query('UPDATE notes SET downloads=downloads+1 WHERE id=$1', [req.params.id])
    res.download(filepath, note.title + '.pdf')
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/files/notes/:id — admin
router.delete('/notes/:id', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM notes WHERE id=$1 RETURNING filename', [req.params.id])
    if (result.rows.length) {
      const filepath = path.join(UPLOADS_DIR, 'notes', result.rows[0].filename)
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    }
    res.json({ message: 'Note deleted' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// ── VIDEOS ─────────────────────────────────────────────

// GET /api/files/videos
router.get('/videos', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id,title,batch_name,duration,size_mb,views,created_at FROM videos ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/files/videos/upload — admin
router.post('/videos/upload', auth, adminOnly, uploadVideo.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File required' })
  const { title, batch_name, batch_id, duration } = req.body
  const size_mb = (req.file.size / (1024 * 1024)).toFixed(2)
  try {
    const result = await pool.query(
      'INSERT INTO videos (title,batch_id,batch_name,filename,duration,size_mb) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title || req.file.originalname, batch_id || null, batch_name || '', req.file.filename, duration || null, size_mb]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// GET /api/files/videos/:id/stream
router.get('/videos/:id/stream', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM videos WHERE id=$1', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Video not found' })
    const video    = result.rows[0]
    const filepath = path.join(UPLOADS_DIR, 'videos', video.filename)
    if (!fs.existsSync(filepath)) return res.status(404).json({ message: 'File not found on disk' })

    const stat  = fs.statSync(filepath)
    const range = req.headers.range

    await pool.query('UPDATE videos SET views=views+1 WHERE id=$1', [req.params.id])

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
      const start = parseInt(startStr, 10)
      const end   = endStr ? parseInt(endStr, 10) : stat.size - 1
      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': end - start + 1,
        'Content-Type':   'video/mp4',
      })
      fs.createReadStream(filepath, { start, end }).pipe(res)
    } else {
      res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' })
      fs.createReadStream(filepath).pipe(res)
    }
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// DELETE /api/files/videos/:id — admin
router.delete('/videos/:id', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM videos WHERE id=$1 RETURNING filename', [req.params.id])
    if (result.rows.length) {
      const filepath = path.join(UPLOADS_DIR, 'videos', result.rows[0].filename)
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    }
    res.json({ message: 'Video deleted' })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

module.exports = router
