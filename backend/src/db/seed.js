require('dotenv').config()
const { pool } = require('./index')
const bcrypt = require('bcryptjs')

async function seed() {
  console.log('🌱 Seeding database with sample data...')
  try {
    // Clear existing data
    await pool.query('DELETE FROM users')

    // Create sample users
    const adminHash = await bcrypt.hash('admin123', 10)
    const teacherHash = await bcrypt.hash('teacher123', 10)
    const studentHash = await bcrypt.hash('student123', 10)

    // Admin user
    await pool.query(
      `INSERT INTO users (name, email, phone, password, role, status, is_verified, phone_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['Admin User', 'admin@xcelerate.com', '9999999999', adminHash, 'admin', 'active', true, true]
    )

    // Teachers
    const teachers = [
      { name: 'Dr. Rajesh Kumar', email: 'physics@xcelerate.com', subject: 'Physics', qualification: 'M.Sc Physics, B.Ed' },
      { name: 'Prof. Anjali Singh', email: 'chemistry@xcelerate.com', subject: 'Chemistry', qualification: 'M.Sc Chemistry, B.Ed' },
      { name: 'Mr. Vikram Patel', email: 'math@xcelerate.com', subject: 'Math', qualification: 'M.Sc Mathematics, B.Ed' },
      { name: 'Dr. Priya Sharma', email: 'biology@xcelerate.com', subject: 'Biology', qualification: 'M.Sc Biology, B.Ed' },
    ]

    const teacherIds = []
    for (const teacher of teachers) {
      const result = await pool.query(
        `INSERT INTO users (name, email, phone, password, role, subject, class_level, bio, qualification, experience_years, status, is_verified, phone_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [teacher.name, teacher.email, '98' + Math.random().toString().slice(2, 12), teacherHash, 'teacher', teacher.subject, '11,12', `Expert ${teacher.subject} teacher`, teacher.qualification, 5, 'active', true, true]
      )
      teacherIds.push(result.rows[0].id)
    }

    // Students (30 for each class)
    const studentEmails = []
    for (let i = 1; i <= 60; i++) {
      const email = `student${i}@xcelerate.com`
      studentEmails.push(email)
      await pool.query(
        `INSERT INTO users (name, email, phone, password, role, class_level, status, is_verified, phone_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [`Student ${i}`, email, '97' + Math.random().toString().slice(2, 12), studentHash, 'student', i <= 30 ? '11' : '12', 'active', true, true]
      )
    }

    // Create courses
    const subjects = ['Physics', 'Chemistry', 'Math', 'Biology']
    const courseIds = []
    for (let i = 0; i < subjects.length; i++) {
      for (let j = 11; j <= 12; j++) {
        const result = await pool.query(
          `INSERT INTO courses (title, description, subject, class_level, teacher_id, price, discount_percent, total_chapters, language, difficulty_level, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [
            `${subjects[i]} - Class ${j}`,
            `Complete ${subjects[i]} course for Class ${j} covering all CBSE/State Board topics. 100+ hours of video lectures, notes, and practice tests.`,
            subjects[i],
            j.toString(),
            teacherIds[i],
            2999, // ₹2999 per course
            0,
            15,
            'English',
            'intermediate',
            'published'
          ]
        )
        courseIds.push(result.rows[0].id)
      }
    }

    // Create batches
    const batchIds = []
    for (const courseId of courseIds.slice(0, 4)) {
      const result = await pool.query(
        `INSERT INTO batches (name, course_id, teacher_id, description, schedule_days, schedule_time, start_date, end_date, max_students, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          `Batch A`,
          courseId,
          teacherIds[courseIds.indexOf(courseId) % 4],
          `Main batch for online learning`,
          JSON.stringify(['Monday', 'Wednesday', 'Friday']),
          '18:00',
          new Date(),
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          60,
          'active'
        ]
      )
      batchIds.push(result.rows[0].id)
    }

    console.log('✅ Seed data created successfully')
    console.log(`📊 Created: 1 Admin, 4 Teachers, 60 Students, 8 Courses, ${batchIds.length} Batches`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  }
}

seed()
