const router = require('express').Router()
const { pool } = require('../db')
const { auth, adminOnly, teacherOrAdmin } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /api/analytics/dashboard (Admin dashboard)
router.get('/dashboard', auth, adminOnly, asyncHandler(async (req, res) => {
  const stats = {}

  // Total users
  const users = await pool.query(`
    SELECT role, COUNT(*) as count FROM users GROUP BY role
  `)
  stats.usersByRole = users.rows.reduce((acc, row) => {
    acc[row.role] = row.count
    return acc
  }, {})

  // Total enrollments
  const enrollments = await pool.query('SELECT COUNT(*) as count FROM enrollments')
  stats.totalEnrollments = enrollments.rows[0].count

  // Revenue
  const revenue = await pool.query(`
    SELECT 
      COALESCE(SUM(CASE WHEN status='paid' THEN final_amount ELSE 0 END), 0) as total_revenue,
      COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count
    FROM payments
  `)
  stats.revenue = revenue.rows[0]

  // Courses
  const courses = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status=$1', ['published'])
  stats.publishedCourses = courses.rows[0].count

  // Tests taken
  const tests = await pool.query('SELECT COUNT(*) as count FROM attempts WHERE status=$1', ['submitted'])
  stats.testsTaken = tests.rows[0].count

  res.json({ success: true, stats })
}))

// GET /api/analytics/student (Student analytics)
router.get('/student', auth, asyncHandler(async (req, res) => {
  // Get enrollments and progress
  const enrollments = await pool.query(
    `SELECT e.*, c.title, c.subject,
     (SELECT COUNT(*) FROM videos WHERE course_id = c.id) as total_videos,
     (SELECT COUNT(*) FROM video_progress WHERE user_id = e.user_id AND video_id IN (SELECT id FROM videos WHERE course_id = c.id) AND completed = true) as completed_videos
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id=$1`,
    [req.user.id]
  )

  // Get test scores
  const testScores = await pool.query(
    `SELECT a.score, a.percentile, t.title
     FROM attempts a
     JOIN tests t ON t.id = a.test_id
     WHERE a.user_id=$1 AND a.status='submitted'
     ORDER BY a.submitted_at DESC`,
    [req.user.id]
  )

  // Get study hours
  const studyHours = await pool.query(
    `SELECT COALESCE(SUM(watched_seconds), 0) as total_seconds
     FROM video_progress
     WHERE user_id=$1`,
    [req.user.id]
  )

  res.json({
    success: true,
    analytics: {
      enrollments,
      testScores: testScores.rows,
      studyHours: Math.round(studyHours.rows[0].total_seconds / 3600)
    }
  })
}))

// GET /api/analytics/teacher (Teacher analytics)
router.get('/teacher', auth, teacherOrAdmin, asyncHandler(async (req, res) => {
  const teacherId = req.user.role === 'teacher' ? req.user.id : req.query.teacher_id

  // Courses created
  const courses = await pool.query(
    'SELECT COUNT(*) as count FROM courses WHERE teacher_id=$1',
    [teacherId]
  )

  // Total students enrolled
  const students = await pool.query(
    `SELECT COUNT(DISTINCT e.user_id) as count FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE c.teacher_id=$1`,
    [teacherId]
  )

  // Average test score
  const avgScore = await pool.query(
    `SELECT COALESCE(AVG(a.score), 0) as avg_score FROM attempts a
     JOIN tests t ON t.id = a.test_id
     WHERE t.teacher_id=$1 AND a.status='submitted'`,
    [teacherId]
  )

  // Videos uploaded
  const videos = await pool.query(
    'SELECT COUNT(*) as count FROM videos WHERE teacher_id=$1',
    [teacherId]
  )

  res.json({
    success: true,
    analytics: {
      coursesCreated: courses.rows[0].count,
      totalStudents: students.rows[0].count,
      avgTestScore: parseFloat(avgScore.rows[0].avg_score).toFixed(2),
      videosUploaded: videos.rows[0].count
    }
  })
}))

// GET /api/analytics/course/:courseId
router.get('/course/:courseId', auth, asyncHandler(async (req, res) => {
  // Enrollment stats
  const enrollments = await pool.query(
    `SELECT COUNT(*) as total, COUNT(CASE WHEN status='completed' THEN 1 END) as completed
     FROM enrollments WHERE course_id=$1`,
    [req.params.courseId]
  )

  // Average progress
  const progress = await pool.query(
    `SELECT COALESCE(AVG(progress_percent), 0) as avg_progress
     FROM enrollments WHERE course_id=$1`,
    [req.params.courseId]
  )

  // Test performance
  const testPerf = await pool.query(
    `SELECT COALESCE(AVG(a.score), 0) as avg_score, COUNT(DISTINCT a.user_id) as attempts
     FROM attempts a
     JOIN tests t ON t.id = a.test_id
     WHERE t.course_id=$1 AND a.status='submitted'`,
    [req.params.courseId]
  )

  res.json({
    success: true,
    analytics: {
      enrollmentStats: enrollments.rows[0],
      avgProgress: progress.rows[0].avg_progress,
      testPerformance: testPerf.rows[0]
    }
  })
}))

module.exports = router
