const jwt = require('jsonwebtoken')

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' })

  const token = header.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required' })
  next()
}

function teacherOnly(req, res, next) {
  if (req.user?.role !== 'teacher')
    return res.status(403).json({ success: false, message: 'Teacher access required' })
  next()
}

function studentOnly(req, res, next) {
  if (req.user?.role !== 'student')
    return res.status(403).json({ success: false, message: 'Student access required' })
  next()
}

function teacherOrAdmin(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'teacher')
    return res.status(403).json({ success: false, message: 'Teacher or admin access required' })
  next()
}

module.exports = { auth, adminOnly, teacherOnly, studentOnly, teacherOrAdmin }
