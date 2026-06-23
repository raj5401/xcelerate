require('dotenv').config()
const { pool } = require('./index')

async function migrate() {
  console.log('Running migrations...')
  await pool.query(`
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) UNIQUE NOT NULL,
      phone       VARCHAR(15),
      password    TEXT NOT NULL,
      role        VARCHAR(20) DEFAULT 'student',
      status      VARCHAR(20) DEFAULT 'active',
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- OTP
    CREATE TABLE IF NOT EXISTS otps (
      id         SERIAL PRIMARY KEY,
      email      VARCHAR(150) NOT NULL,
      otp        VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used       BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Courses
    CREATE TABLE IF NOT EXISTS courses (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(200) NOT NULL,
      exam        VARCHAR(50),
      batch_class VARCHAR(100),
      price       NUMERIC(10,2) DEFAULT 0,
      chapters    INTEGER DEFAULT 0,
      description TEXT,
      status      VARCHAR(20) DEFAULT 'active',
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- Batches
    CREATE TABLE IF NOT EXISTS batches (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      exam        VARCHAR(50),
      schedule    VARCHAR(200),
      meet_link   VARCHAR(500),
      start_date  DATE,
      status      VARCHAR(20) DEFAULT 'active',
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- Enrollments
    CREATE TABLE IF NOT EXISTS enrollments (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      batch_id    INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      enrolled_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, course_id)
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
      course_id    INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      student_name VARCHAR(100),
      email        VARCHAR(150),
      course_title VARCHAR(200),
      amount       NUMERIC(10,2),
      status       VARCHAR(20) DEFAULT 'pending',
      created_at   TIMESTAMP DEFAULT NOW()
    );

    -- Tests
    CREATE TABLE IF NOT EXISTS tests (
      id                SERIAL PRIMARY KEY,
      title             VARCHAR(200) NOT NULL,
      exam              VARCHAR(50),
      batch_class       VARCHAR(100),
      duration          INTEGER NOT NULL,
      total_marks       INTEGER NOT NULL,
      scheduled_at      TIMESTAMP,
      status            VARCHAR(20) DEFAULT 'active',
      results_published BOOLEAN DEFAULT false,
      published_at      TIMESTAMP,
      created_at        TIMESTAMP DEFAULT NOW()
    );

    -- Questions
    CREATE TABLE IF NOT EXISTS questions (
      id        SERIAL PRIMARY KEY,
      test_id   INTEGER REFERENCES tests(id) ON DELETE CASCADE,
      text      TEXT NOT NULL,
      option_a  TEXT NOT NULL,
      option_b  TEXT NOT NULL,
      option_c  TEXT NOT NULL,
      option_d  TEXT NOT NULL,
      correct   CHAR(1) NOT NULL,
      marks     INTEGER DEFAULT 4,
      negative  NUMERIC(4,2) DEFAULT 1
    );

    -- Attempts
    CREATE TABLE IF NOT EXISTS attempts (
      id           SERIAL PRIMARY KEY,
      test_id      INTEGER REFERENCES tests(id) ON DELETE CASCADE,
      user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
      answers      JSONB DEFAULT '{}',
      score        NUMERIC(8,2),
      status       VARCHAR(20) DEFAULT 'in_progress',
      started_at   TIMESTAMP DEFAULT NOW(),
      submitted_at TIMESTAMP,
      UNIQUE(test_id, user_id)
    );

    -- Notes
    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(200) NOT NULL,
      batch_id   INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      batch_name VARCHAR(200),
      filename   VARCHAR(300),
      size_kb    INTEGER,
      downloads  INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Videos
    CREATE TABLE IF NOT EXISTS videos (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(200) NOT NULL,
      batch_id   INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      batch_name VARCHAR(200),
      filename   VARCHAR(300),
      duration   VARCHAR(20),
      size_mb    NUMERIC(8,2),
      views      INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  console.log('✅ All tables created')
  process.exit(0)
}

migrate().catch(e => { console.error('Migration failed:', e); process.exit(1) })
