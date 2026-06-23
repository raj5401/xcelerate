require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth',     require('./routes/auth'))
app.use('/api/otp',      require('./routes/otp'))
app.use('/api/courses',  require('./routes/courses'))
app.use('/api/students', require('./routes/students'))
app.use('/api/payments', require('./routes/payments'))
app.use('/api/tests',    require('./routes/tests'))
app.use('/api/files',    require('./routes/files'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✅ Xcelerate API running on http://localhost:${PORT}`))
