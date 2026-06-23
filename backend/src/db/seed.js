require('dotenv').config()
const { pool } = require('./index')
const bcrypt   = require('bcryptjs')

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data (safe re-run)
  await pool.query(`
    TRUNCATE doubts, progress, attempts, questions, tests,
             notes, videos, enrollments, payments,
             batches, chapters, courses, otps, users
    RESTART IDENTITY CASCADE
  `)
  console.log('  Cleared old data')

  // ── USERS ──────────────────────────────────────────────────────
  const adminPass   = await bcrypt.hash('Admin@1234', 10)
  const teacherPass = await bcrypt.hash('Teacher@1234', 10)
  const studentPass = await bcrypt.hash('Student@1234', 10)

  await pool.query(`
    INSERT INTO users (name, email, phone, password, role, subject, bio) VALUES
    ('Admin',              'admin@xcelerate.com',      '9000000000', $1, 'admin',   NULL,          'Platform administrator'),
    ('Dr. Suresh Kumar',   'physics@xcelerate.com',    '9111111111', $2, 'teacher', 'Physics',     'M.Sc Physics, 12 years teaching experience. Specializes in JEE & NEET Physics.'),
    ('Dr. Anita Rao',      'biology@xcelerate.com',    '9222222222', $2, 'teacher', 'Biology',     'M.Sc Biology, 10 years teaching. Expert in NEET Biology preparation.'),
    ('Prof. Rajan Mehta',  'maths@xcelerate.com',      '9333333333', $2, 'teacher', 'Mathematics', 'M.Sc Mathematics, 15 years experience. Loves making maths simple.'),
    ('Dr. Kavya Nair',     'chemistry@xcelerate.com',  '9444444444', $2, 'teacher', 'Chemistry',   'M.Sc Chemistry, 8 years teaching. Organic chemistry specialist.'),
    ('Ravi Kumar',         'ravi@student.com',         '9876543201', $3, 'student', NULL, NULL),
    ('Priya Sharma',       'priya@student.com',        '9876543202', $3, 'student', NULL, NULL),
    ('Arjun Singh',        'arjun@student.com',        '9876543203', $3, 'student', NULL, NULL),
    ('Neha Patel',         'neha@student.com',         '9876543204', $3, 'student', NULL, NULL),
    ('Karthik Reddy',      'karthik@student.com',      '9876543205', $3, 'student', NULL, NULL),
    ('Sneha Iyer',         'sneha@student.com',        '9876543206', $3, 'student', NULL, NULL)
  `, [adminPass, teacherPass, studentPass])
  console.log('✅ Users seeded (1 admin, 4 teachers, 6 students)')

  // Get user IDs
  const users     = await pool.query('SELECT id, email, role, subject FROM users ORDER BY id')
  const admin     = users.rows.find(u => u.role === 'admin')
  const teachers  = users.rows.filter(u => u.role === 'teacher')
  const students  = users.rows.filter(u => u.role === 'student')

  const tPhysics  = teachers.find(t => t.subject === 'Physics').id
  const tBiology  = teachers.find(t => t.subject === 'Biology').id
  const tMaths    = teachers.find(t => t.subject === 'Mathematics').id
  const tChem     = teachers.find(t => t.subject === 'Chemistry').id

  // ── COURSES ────────────────────────────────────────────────────
  const coursesData = [
    // Physics
    ['PUC 11 Physics',     'Physics',     '11', tPhysics, 1999, 'Complete PUC 1st Year Physics — from mechanics to thermodynamics. Covers all Karnataka board chapters with concept videos and chapter-wise tests.'],
    ['PUC 12 Physics',     'Physics',     '12', tPhysics, 2499, 'PUC 2nd Year Physics covering electrostatics, current electricity, optics and modern physics. Board + CET focused.'],
    // Biology
    ['PUC 11 Biology',     'Biology',     '11', tBiology, 1999, 'PUC 1st Year Biology with detailed coverage of cell biology, plant kingdom, animal kingdom and human physiology.'],
    ['PUC 12 Biology',     'Biology',     '12', tBiology, 2499, 'PUC 2nd Year Biology — genetics, evolution, biotechnology and ecology. NEET focused preparation.'],
    // Mathematics
    ['PUC 11 Mathematics', 'Mathematics', '11', tMaths,   1999, 'PUC 1st Year Maths covering sets, relations, trigonometry, algebra and co-ordinate geometry.'],
    ['PUC 12 Mathematics', 'Mathematics', '12', tMaths,   2499, 'PUC 2nd Year Maths — calculus, vectors, 3D geometry, probability and linear programming.'],
    // Chemistry
    ['PUC 11 Chemistry',   'Chemistry',   '11', tChem,    1999, 'PUC 1st Year Chemistry — basic concepts, atomic structure, periodic table, chemical bonding and thermodynamics.'],
    ['PUC 12 Chemistry',   'Chemistry',   '12', tChem,    2499, 'PUC 2nd Year Chemistry covering electrochemistry, polymers, organic reactions and biomolecules.'],
  ]

  const courseIds = []
  for (const [title, subject, class_level, teacher_id, price, description] of coursesData) {
    const r = await pool.query(
      'INSERT INTO courses (title,subject,class_level,teacher_id,price,description,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [title, subject, class_level, teacher_id, price, description, 'active']
    )
    courseIds.push(r.rows[0].id)
  }
  console.log('✅ Courses seeded (8 courses)')

  // ── CHAPTERS ───────────────────────────────────────────────────
  const chaptersMap = {}  // courseId -> [chapterId, ...]

  const chaptersData = {
    0: [ // PUC 11 Physics
      'Chapter 1 — Physical World & Measurement',
      'Chapter 2 — Kinematics',
      'Chapter 3 — Laws of Motion',
      'Chapter 4 — Work, Energy & Power',
      'Chapter 5 — Motion of System of Particles',
      'Chapter 6 — Gravitation',
      'Chapter 7 — Thermodynamics',
      'Chapter 8 — Oscillations & Waves',
    ],
    1: [ // PUC 12 Physics
      'Chapter 1 — Electric Charges & Fields',
      'Chapter 2 — Electrostatic Potential',
      'Chapter 3 — Current Electricity',
      'Chapter 4 — Moving Charges & Magnetism',
      'Chapter 5 — Electromagnetic Induction',
      'Chapter 6 — Ray Optics',
      'Chapter 7 — Wave Optics',
      'Chapter 8 — Dual Nature of Radiation',
      'Chapter 9 — Atoms & Nuclei',
    ],
    2: [ // PUC 11 Biology
      'Chapter 1 — The Living World',
      'Chapter 2 — Biological Classification',
      'Chapter 3 — Plant Kingdom',
      'Chapter 4 — Animal Kingdom',
      'Chapter 5 — Cell Structure & Function',
      'Chapter 6 — Cell Division',
      'Chapter 7 — Transport in Plants',
      'Chapter 8 — Human Physiology',
    ],
    3: [ // PUC 12 Biology
      'Chapter 1 — Reproduction in Organisms',
      'Chapter 2 — Sexual Reproduction in Plants',
      'Chapter 3 — Human Reproduction',
      'Chapter 4 — Genetics & Heredity',
      'Chapter 5 — Molecular Basis of Inheritance',
      'Chapter 6 — Evolution',
      'Chapter 7 — Biotechnology',
      'Chapter 8 — Ecology',
    ],
    4: [ // PUC 11 Maths
      'Chapter 1 — Sets',
      'Chapter 2 — Relations & Functions',
      'Chapter 3 — Trigonometry',
      'Chapter 4 — Complex Numbers',
      'Chapter 5 — Permutations & Combinations',
      'Chapter 6 — Binomial Theorem',
      'Chapter 7 — Sequences & Series',
      'Chapter 8 — Straight Lines & Conic Sections',
    ],
    5: [ // PUC 12 Maths
      'Chapter 1 — Relations & Functions',
      'Chapter 2 — Inverse Trigonometry',
      'Chapter 3 — Matrices & Determinants',
      'Chapter 4 — Continuity & Differentiability',
      'Chapter 5 — Applications of Derivatives',
      'Chapter 6 — Integrals',
      'Chapter 7 — Differential Equations',
      'Chapter 8 — Vectors & 3D Geometry',
      'Chapter 9 — Linear Programming',
      'Chapter 10 — Probability',
    ],
    6: [ // PUC 11 Chemistry
      'Chapter 1 — Some Basic Concepts',
      'Chapter 2 — Structure of Atom',
      'Chapter 3 — Periodic Table',
      'Chapter 4 — Chemical Bonding',
      'Chapter 5 — States of Matter',
      'Chapter 6 — Thermodynamics',
      'Chapter 7 — Equilibrium',
      'Chapter 8 — Redox Reactions',
    ],
    7: [ // PUC 12 Chemistry
      'Chapter 1 — Solid State',
      'Chapter 2 — Solutions',
      'Chapter 3 — Electrochemistry',
      'Chapter 4 — Chemical Kinetics',
      'Chapter 5 — Surface Chemistry',
      'Chapter 6 — p-Block Elements',
      'Chapter 7 — Coordination Compounds',
      'Chapter 8 — Organic Chemistry',
      'Chapter 9 — Biomolecules & Polymers',
    ],
  }

  for (let i = 0; i < courseIds.length; i++) {
    chaptersMap[courseIds[i]] = []
    for (let j = 0; j < chaptersData[i].length; j++) {
      const r = await pool.query(
        'INSERT INTO chapters (course_id,title,order_num) VALUES ($1,$2,$3) RETURNING id',
        [courseIds[i], chaptersData[i][j], j + 1]
      )
      chaptersMap[courseIds[i]].push(r.rows[0].id)
    }
    // Update total_chapters count
    await pool.query('UPDATE courses SET total_chapters=$1 WHERE id=$2', [chaptersData[i].length, courseIds[i]])
  }
  console.log('✅ Chapters seeded (70+ chapters across 8 courses)')

  // ── BATCHES ────────────────────────────────────────────────────
  const batchIds = []
  const batchesData = [
    ['Physics 11 — Morning Batch', courseIds[0], tPhysics, 'Mon/Wed/Fri 7:00 AM', 'https://meet.google.com/phy-11-morning'],
    ['Physics 12 — Evening Batch', courseIds[1], tPhysics, 'Tue/Thu/Sat 6:00 PM', 'https://meet.google.com/phy-12-evening'],
    ['Biology 11 — Morning Batch', courseIds[2], tBiology, 'Mon-Fri 8:00 AM',     'https://meet.google.com/bio-11-morning'],
    ['Biology 12 — Evening Batch', courseIds[3], tBiology, 'Mon/Wed/Fri 5:00 PM', 'https://meet.google.com/bio-12-evening'],
    ['Maths 11 — Morning Batch',   courseIds[4], tMaths,   'Tue/Thu/Sat 7:00 AM', 'https://meet.google.com/mat-11-morning'],
    ['Maths 12 — Evening Batch',   courseIds[5], tMaths,   'Mon/Wed/Fri 6:00 PM', 'https://meet.google.com/mat-12-evening'],
    ['Chemistry 11 — Batch A',     courseIds[6], tChem,    'Mon/Wed/Fri 9:00 AM', 'https://meet.google.com/che-11-batcha'],
    ['Chemistry 12 — Batch A',     courseIds[7], tChem,    'Tue/Thu/Sat 5:00 PM', 'https://meet.google.com/che-12-batcha'],
  ]
  for (const [name, course_id, teacher_id, schedule, meet_link] of batchesData) {
    const r = await pool.query(
      'INSERT INTO batches (name,course_id,teacher_id,schedule,meet_link,start_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [name, course_id, teacher_id, schedule, meet_link, '2026-07-01']
    )
    batchIds.push(r.rows[0].id)
  }
  console.log('✅ Batches seeded')

  // ── ENROLLMENTS ────────────────────────────────────────────────
  const enrollData = [
    [students[0].id, courseIds[0], batchIds[0]],  // Ravi — Physics 11
    [students[0].id, courseIds[4], batchIds[4]],  // Ravi — Maths 11
    [students[1].id, courseIds[0], batchIds[0]],  // Priya — Physics 11
    [students[1].id, courseIds[2], batchIds[2]],  // Priya — Biology 11
    [students[2].id, courseIds[1], batchIds[1]],  // Arjun — Physics 12
    [students[2].id, courseIds[5], batchIds[5]],  // Arjun — Maths 12
    [students[3].id, courseIds[3], batchIds[3]],  // Neha — Biology 12
    [students[3].id, courseIds[7], batchIds[7]],  // Neha — Chemistry 12
    [students[4].id, courseIds[6], batchIds[6]],  // Karthik — Chemistry 11
    [students[5].id, courseIds[1], batchIds[1]],  // Sneha — Physics 12
  ]
  for (const [uid, cid, bid] of enrollData) {
    await pool.query(
      'INSERT INTO enrollments (user_id,course_id,batch_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [uid, cid, bid]
    )
  }
  console.log('✅ Enrollments seeded')

  // ── NOTES (metadata) ───────────────────────────────────────────
  const notesData = [
    ['Kinematics — Complete Notes',         courseIds[0], chaptersMap[courseIds[0]][1], tPhysics],
    ['Laws of Motion — Handwritten Notes',  courseIds[0], chaptersMap[courseIds[0]][2], tPhysics],
    ['Work Energy Power — Summary',         courseIds[0], chaptersMap[courseIds[0]][3], tPhysics],
    ['Electrostatics — Formula Sheet',      courseIds[1], chaptersMap[courseIds[1]][0], tPhysics],
    ['Current Electricity — Notes',         courseIds[1], chaptersMap[courseIds[1]][2], tPhysics],
    ['Cell Structure — Diagram Notes',      courseIds[2], chaptersMap[courseIds[2]][4], tBiology],
    ['Plant Kingdom — Quick Revision',      courseIds[2], chaptersMap[courseIds[2]][2], tBiology],
    ['Genetics — Mendel\'s Laws Notes',     courseIds[3], chaptersMap[courseIds[3]][3], tBiology],
    ['Trigonometry — Formula Sheet',        courseIds[4], chaptersMap[courseIds[4]][2], tMaths],
    ['Calculus — Differentiation Notes',    courseIds[5], chaptersMap[courseIds[5]][3], tMaths],
    ['Atomic Structure — Notes',            courseIds[6], chaptersMap[courseIds[6]][1], tChem],
    ['Electrochemistry — Notes',            courseIds[7], chaptersMap[courseIds[7]][2], tChem],
  ]
  for (const [title, course_id, chapter_id, teacher_id] of notesData) {
    await pool.query(
      'INSERT INTO notes (title,course_id,chapter_id,teacher_id,filename,size_kb) VALUES ($1,$2,$3,$4,$5,$6)',
      [title, course_id, chapter_id, teacher_id, title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.pdf', Math.floor(Math.random() * 2000) + 500]
    )
  }
  console.log('✅ Notes seeded')

  // ── VIDEOS (metadata) ──────────────────────────────────────────
  const videosData = [
    ['Kinematics — Lecture 1: Introduction',    courseIds[0], chaptersMap[courseIds[0]][1], tPhysics, '1:12:34', 1],
    ['Kinematics — Lecture 2: Equations',       courseIds[0], chaptersMap[courseIds[0]][1], tPhysics, '58:20',   2],
    ['Laws of Motion — Lecture 1',              courseIds[0], chaptersMap[courseIds[0]][2], tPhysics, '1:05:00', 1],
    ['Electrostatics — Lecture 1',              courseIds[1], chaptersMap[courseIds[1]][0], tPhysics, '1:20:00', 1],
    ['Current Electricity — Lecture 1',         courseIds[1], chaptersMap[courseIds[1]][2], tPhysics, '1:10:00', 1],
    ['Cell Structure — Lecture 1',              courseIds[2], chaptersMap[courseIds[2]][4], tBiology, '1:15:00', 1],
    ['Plant Kingdom — Lecture 1',               courseIds[2], chaptersMap[courseIds[2]][2], tBiology, '55:00',   1],
    ['Genetics — Lecture 1: Mendel\'s Laws',    courseIds[3], chaptersMap[courseIds[3]][3], tBiology, '1:25:00', 1],
    ['Trigonometry — Lecture 1',                courseIds[4], chaptersMap[courseIds[4]][2], tMaths,   '1:00:00', 1],
    ['Differentiation — Lecture 1',             courseIds[5], chaptersMap[courseIds[5]][3], tMaths,   '1:18:00', 1],
    ['Atomic Structure — Lecture 1',            courseIds[6], chaptersMap[courseIds[6]][1], tChem,    '1:05:00', 1],
    ['Electrochemistry — Lecture 1',            courseIds[7], chaptersMap[courseIds[7]][2], tChem,    '1:22:00', 1],
  ]
  for (const [title, course_id, chapter_id, teacher_id, duration, order_num] of videosData) {
    await pool.query(
      'INSERT INTO videos (title,course_id,chapter_id,teacher_id,filename,duration,size_mb,order_num) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [title, course_id, chapter_id, teacher_id, title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.mp4', duration, (Math.random() * 800 + 200).toFixed(1), order_num]
    )
  }
  console.log('✅ Videos seeded')

  // ── TESTS ──────────────────────────────────────────────────────
  const t1 = await pool.query(
    `INSERT INTO tests (title,course_id,teacher_id,subject,class_level,duration,total_marks,scheduled_at,status,results_published)
     VALUES ('Physics 11 — Chapter Test 1 (Kinematics)', $1, $2, 'Physics', '11', 60, 60, NOW()-INTERVAL '3 days', 'active', true) RETURNING id`,
    [courseIds[0], tPhysics]
  )
  const t2 = await pool.query(
    `INSERT INTO tests (title,course_id,teacher_id,subject,class_level,duration,total_marks,scheduled_at,status,results_published)
     VALUES ('Physics 12 — Electrostatics Mock Test', $1, $2, 'Physics', '12', 90, 80, NOW()-INTERVAL '1 day', 'active', false) RETURNING id`,
    [courseIds[1], tPhysics]
  )
  const t3 = await pool.query(
    `INSERT INTO tests (title,course_id,teacher_id,subject,class_level,duration,total_marks,scheduled_at,status,results_published)
     VALUES ('Biology 11 — Cell Biology Test', $1, $2, 'Biology', '11', 45, 40, NOW()+INTERVAL '2 days', 'active', false) RETURNING id`,
    [courseIds[2], tBiology]
  )
  const t4 = await pool.query(
    `INSERT INTO tests (title,course_id,teacher_id,subject,class_level,duration,total_marks,scheduled_at,status,results_published)
     VALUES ('Maths 12 — Calculus Test', $1, $2, 'Mathematics', '12', 90, 100, NOW()-INTERVAL '5 days', 'active', true) RETURNING id`,
    [courseIds[5], tMaths]
  )
  const testIds = [t1.rows[0].id, t2.rows[0].id, t3.rows[0].id, t4.rows[0].id]

  // Questions for Test 1 (Physics 11 Kinematics)
  const physicsQs = [
    ['A car accelerates from rest at 2 m/s². Distance covered in 5 seconds is:', '10 m', '25 m', '50 m', '100 m', 'B'],
    ['Which of the following is NOT a vector quantity?', 'Velocity', 'Displacement', 'Speed', 'Acceleration', 'C'],
    ['A ball is thrown vertically upward. At the highest point its velocity is:', '9.8 m/s', '0 m/s', 'Maximum', 'Equal to initial', 'B'],
    ['The slope of a velocity-time graph gives:', 'Speed', 'Displacement', 'Acceleration', 'Force', 'C'],
    ['A particle moving with uniform velocity has acceleration equal to:', '1 m/s²', '9.8 m/s²', '0 m/s²', 'Cannot determine', 'C'],
  ]
  for (const [text, a, b, c, d, correct] of physicsQs) {
    await pool.query(
      'INSERT INTO questions (test_id,text,option_a,option_b,option_c,option_d,correct,marks,negative) VALUES ($1,$2,$3,$4,$5,$6,$7,4,1)',
      [testIds[0], text, a, b, c, d, correct]
    )
  }

  // Questions for Test 4 (Maths 12 Calculus)
  const mathsQs = [
    ['d/dx(x³) is equal to:', 'x²', '3x', '3x²', '3x³', 'C'],
    ['∫x dx equals:', 'x²', 'x²/2 + C', '2x + C', '1/x + C', 'B'],
    ['The derivative of sin(x) is:', 'cos(x)', '-cos(x)', 'sin(x)', '-sin(x)', 'A'],
    ['If f(x) = e^x then f\'(x) is:', 'e^(x-1)', 'xe^x', 'e^x', '0', 'C'],
    ['The maximum value of sin(x) is:', '0', '1', '-1', 'Infinity', 'B'],
  ]
  for (const [text, a, b, c, d, correct] of mathsQs) {
    await pool.query(
      'INSERT INTO questions (test_id,text,option_a,option_b,option_c,option_d,correct,marks,negative) VALUES ($1,$2,$3,$4,$5,$6,$7,4,1)',
      [testIds[3], text, a, b, c, d, correct]
    )
  }
  console.log('✅ Tests & Questions seeded')

  // ── DOUBTS ─────────────────────────────────────────────────────
  await pool.query(
    `INSERT INTO doubts (course_id, chapter_id, user_id, question, answer, answered_by, answered_at, status) VALUES
    ($1, $2, $3, 'What is the difference between distance and displacement?',
     'Distance is the total path length (scalar), while displacement is the shortest straight-line path from start to end point (vector).', $4, NOW()-INTERVAL '2 days', 'answered')`,
    [courseIds[0], chaptersMap[courseIds[0]][1], students[0].id, tPhysics]
  )
  await pool.query(
    `INSERT INTO doubts (course_id, chapter_id, user_id, question, status) VALUES ($1, $2, $3, 'How do we find instantaneous velocity?', 'open')`,
    [courseIds[0], chaptersMap[courseIds[0]][1], students[1].id]
  )
  await pool.query(
    `INSERT INTO doubts (course_id, chapter_id, user_id, question, answer, answered_by, answered_at, status) VALUES
    ($1, $2, $3, 'Can you explain Ohm''s law in simple terms?',
     'Ohm''s law states V = IR, meaning voltage equals current times resistance. If resistance is constant, more voltage means more current.', $4, NOW()-INTERVAL '1 day', 'answered')`,
    [courseIds[1], chaptersMap[courseIds[1]][2], students[0].id, tPhysics]
  )
  console.log('✅ Doubts seeded')

  console.log('\n🎉 Database seeded successfully!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('LOGIN CREDENTIALS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin:')
  console.log('  admin@xcelerate.com     / Admin@1234')
  console.log('\nTeachers:')
  console.log('  physics@xcelerate.com   / Teacher@1234  (Dr. Suresh Kumar)')
  console.log('  biology@xcelerate.com   / Teacher@1234  (Dr. Anita Rao)')
  console.log('  maths@xcelerate.com     / Teacher@1234  (Prof. Rajan Mehta)')
  console.log('  chemistry@xcelerate.com / Teacher@1234  (Dr. Kavya Nair)')
  console.log('\nStudents:')
  console.log('  ravi@student.com        / Student@1234')
  console.log('  priya@student.com       / Student@1234')
  console.log('  (all 6 students use Student@1234)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  process.exit(0)
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1) })
