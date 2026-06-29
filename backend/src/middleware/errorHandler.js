const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let statusCode = 500
  let message = 'Internal server error'
  let details = err.message

  // Database errors
  if (err.code === '23505') { // Unique violation
    statusCode = 409
    message = 'Record already exists'
    details = err.detail
  } else if (err.code === '23503') { // Foreign key violation
    statusCode = 400
    message = 'Invalid reference'
    details = err.detail
  } else if (err.code === '23502') { // Not null violation
    statusCode = 400
    message = 'Missing required field'
    details = err.detail
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413
    message = 'File too large'
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { details })
  })
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = { errorHandler, asyncHandler }
