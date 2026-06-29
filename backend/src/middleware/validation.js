const { body, validationResult } = require('express-validator')

const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
    })
  }
  next()
}

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('role').isIn(['student', 'teacher']).withMessage('Invalid role'),
  body('class_level').optional().isIn(['11', '12']).withMessage('Invalid class level'),
  validateRequest
]

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
]

const validateOTPVerify = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must be numeric'),
  validateRequest
]

const validateCourseCreate = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').isIn(['Physics', 'Chemistry', 'Math', 'Biology']).withMessage('Invalid subject'),
  body('class_level').isIn(['11', '12']).withMessage('Invalid class level'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').optional().trim(),
  validateRequest
]

const validateBatchCreate = [
  body('name').trim().notEmpty().withMessage('Batch name is required'),
  body('course_id').isInt({ min: 1 }).withMessage('Valid course_id required'),
  body('schedule_days').isArray({ min: 1 }).withMessage('At least one schedule day required'),
  body('schedule_time').matches(/^\d{2}:\d{2}$/).withMessage('Valid time format required (HH:MM)'),
  body('max_students').optional().isInt({ min: 1 }).withMessage('Max students must be at least 1'),
  validateRequest
]

const validateTestCreate = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('course_id').isInt({ min: 1 }).withMessage('Valid course_id required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('total_marks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('test_type').isIn(['quiz', 'chapter_test', 'mock_exam', 'final_exam']).withMessage('Invalid test type'),
  validateRequest
]

const validateAssignmentCreate = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('course_id').isInt({ min: 1 }).withMessage('Valid course_id required'),
  body('due_date').isISO8601().withMessage('Valid due date required'),
  body('instructions').optional().trim(),
  validateRequest
]

module.exports = {
  validateRegister,
  validateLogin,
  validateOTPVerify,
  validateCourseCreate,
  validateBatchCreate,
  validateTestCreate,
  validateAssignmentCreate
}
