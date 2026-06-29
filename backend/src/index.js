require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { apiLimiter } = require('./middleware/rateLimiter')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.FRONTEND_ADMIN_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Rate limiting
app.use('/api/', apiLimiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV })
})

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/courses', require('./routes/courses'))
app.use('/api/chapters', require('./routes/chapters'))
app.use('/api/videos', require('./routes/videos'))
app.use('/api/batches', require('./routes/batches'))
app.use('/api/live-classes', require('./routes/liveClasses'))
app.use('/api/enrollments', require('./routes/enrollments'))
app.use('/api/payments', require('./routes/payments'))
app.use('/api/tests', require('./routes/tests'))
app.use('/api/assignments', require('./routes/assignments'))
app.use('/api/doubts', require('./routes/doubts'))
app.use('/api/study-materials', require('./routes/studyMaterials'))
app.use('/api/certificates', require('./routes/certificates'))
app.use('/api/analytics', require('./routes/analytics'))

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Xcelerate API running on http://localhost:${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
