require('dotenv').config()
const { pool } = require('./index')

async function migrate() {
  console.log('Running migrations...')
  await pool.query(`

    -- ── USERS ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) UNIQUE NOT NULL,
      phone       VARCHAR(15),
      password    TEXT NOT NULL,
      role        VARCHAR(20) DEFAULT 'student',  -- student | teacher | admin
      subject     VARCHAR(50),                    -- Physics | Biology | Mathematics | Chemistry (for teachers)
      bio         TEXT,
      avatar_url  VARCHAR(500),
      status      VARCHAR(20) DEFAULT 'active',
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- ── OTP ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS otps (
      id         SERIAL PRIMARY KEY,
      email      VARCHAR(150) NOT NULL,
      otp        VARCHAR(10)  NOT NULL,
      expires_at TIMESTAMP    NOT NULL,
      used       BOOLEAN      DEFAULT false,
      created_at TIMESTAMP    DEFAULT NOW()
    );

    -- ── COURSES ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS courses (
      id           SERIAL PRIMARY KEY,
      title        VARCHAR(200) NOT NULL,
      subject      VARCHAR(50)  NOT NULL,   -- Physics | Biology | Mathematics | Chemistry
      class_level  VARCHAR(10)  NOT NULL,   -- 11 | 12
      teacher_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
      price        NUMERIC(10,2) DEFAULT 0,
      description  TEXT,
      thumbnail    VARCHAR(500),
      total_chapters INTEGER DEFAULT 0,
      language     VARCHAR(50) DEFAULT 'English',
      status       VARCHAR(20) DEFAULT 'active',  -- active | draft | inactive
      created_at   TIMESTAMP DEFAULT NOW()
    );

    -- ── CHAPTERS ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS chapters (
      id          SERIAL PRIMARY KEY,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title       VARCHAR(200) NOT NULL,
      description TEXT,
      order_num   INTEGER DEFAULT 0,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- ── BATCHES ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS batches (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      schedule    VARCHAR(200),
      meet_link   VARCHAR(500),
      start_date  DATE,
      status      VARCHAR(20) DEFAULT 'active',
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- ── ENROLLMENTS ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS enrollments (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      batch_id    INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      enrolled_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, course_id)
    );

    -- ── PAYMENTS ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS payments (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
      course_id    INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      student_name VARCHAR(100),
      email        VARCHAR(150),
      course_title VARCHAR(200),
      amount       NUMERIC(10,2),
      status       VARCHAR(20) DEFAULT 'pending',  -- pending | paid | failed
      razorpay_id  VARCHAR(200),
      created_at   TIMESTAMP DEFAULT NOW()
    );

    -- ── NOTES ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notes (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(200) NOT NULL,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      chapter_id  INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
      teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      filename    VARCHAR(300),
      size_kb     INTEGER,
      downloads   INTEGER DEFAULT 0,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- ── VIDEOS ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS videos (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(200) NOT NULL,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      chapter_id  INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
      teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      filename    VARCHAR(300),
      duration    VARCHAR(20),
      size_mb     NUMERIC(8,2),
      order_num   INTEGER DEFAULT 0,
      views       INTEGER DEFAULT 0,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- ── PROGRESS ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS progress (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      video_id    INTEGER REFERENCES videos(id) ON DELETE CASCADE,
      watched_pct INTEGER DEFAULT 0,
      completed   BOOLEAN DEFAULT false,
      updated_at  TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, video_id)
    );

    -- ── TESTS ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tests (
      id                SERIAL PRIMARY KEY,
      title             VARCHAR(200) NOT NULL,
      course_id         INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      teacher_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
      subject           VARCHAR(50),
      class_level       VARCHAR(10),
      duration          INTEGER NOT NULL,
      total_marks       INTEGER NOT NULL,
      scheduled_at      TIMESTAMP,
      status            VARCHAR(20) DEFAULT 'active',
      results_published BOOLEAN DEFAULT false,
      published_at      TIMESTAMP,
      created_at        TIMESTAMP DEFAULT NOW()
    );

    -- ── QUESTIONS ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS questions (
      id        SERIAL PRIMARY KEY,
      test_id   INTEGER REFERENCES tests(id) ON DELETE CASCADE,
      text      TEXT    NOT NULL,
      option_a  TEXT    NOT NULL,
      option_b  TEXT    NOT NULL,
      option_c  TEXT    NOT NULL,
      option_d  TEXT    NOT NULL,
      correct   CHAR(1) NOT NULL,
      marks     INTEGER DEFAULT 4,
      negative  NUMERIC(4,2) DEFAULT 1
    );

    -- ── ATTEMPTS ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS attempts (
      id           SERIAL PRIMARY KEY,
      test_id      INTEGER REFERENCES tests(id) ON DELETE CASCADE,
      user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
      answers      JSONB   DEFAULT '{}',
      score        NUMERIC(8,2),
      status       VARCHAR(20) DEFAULT 'in_progress',
      started_at   TIMESTAMP DEFAULT NOW(),
      submitted_at TIMESTAMP,
      UNIQUE(test_id, user_id)
    );

    -- ── DOUBTS ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS doubts (
      id          SERIAL PRIMARY KEY,
      course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      chapter_id  INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      question    TEXT NOT NULL,
      answer      TEXT,
      answered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      answered_at TIMESTAMP,
      status      VARCHAR(20) DEFAULT 'open',  -- open | answered
      created_at  TIMESTAMP DEFAULT NOW()
    );

  `)

  // Add new columns to existing tables if they don't exist (safe for re-runs)
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS subject    VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio        TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject        VARCHAR(50);
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_level    VARCHAR(10);
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS teacher_id     INTEGER;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail      VARCHAR(500);
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_chapters INTEGER DEFAULT 0;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS language       VARCHAR(50) DEFAULT 'English';
    ALTER TABLE courses DROP COLUMN IF EXISTS exam;
    ALTER TABLE courses DROP COLUMN IF EXISTS batch_class;
    ALTER TABLE courses DROP COLUMN IF EXISTS chapters;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS course_id   INTEGER;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS teacher_id  INTEGER;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS subject     VARCHAR(50);
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS class_level VARCHAR(10);
    ALTER TABLE tests DROP COLUMN IF EXISTS exam;
    ALTER TABLE tests DROP COLUMN IF EXISTS batch_class;
    ALTER TABLE notes ADD COLUMN IF NOT EXISTS course_id  INTEGER;
    ALTER TABLE notes ADD COLUMN IF NOT EXISTS chapter_id INTEGER;
    ALTER TABLE notes ADD COLUMN IF NOT EXISTS teacher_id INTEGER;
    ALTER TABLE notes DROP COLUMN IF EXISTS batch_id;
    ALTER TABLE notes DROP COLUMN IF EXISTS batch_name;
    ALTER TABLE videos ADD COLUMN IF NOT EXISTS course_id  INTEGER;
    ALTER TABLE videos ADD COLUMN IF NOT EXISTS chapter_id INTEGER;
    ALTER TABLE videos ADD COLUMN IF NOT EXISTS teacher_id INTEGER;
    ALTER TABLE videos ADD COLUMN IF NOT EXISTS order_num  INTEGER DEFAULT 0;
    ALTER TABLE videos DROP COLUMN IF EXISTS batch_id;
    ALTER TABLE videos DROP COLUMN IF EXISTS batch_name;
    ALTER TABLE batches ADD COLUMN IF NOT EXISTS teacher_id INTEGER;
    ALTER TABLE batches DROP COLUMN IF EXISTS exam;
  `)

  console.log('✅ All tables created/updated')
  process.exit(0)
}

migrate().catch(e => { console.error('Migration failed:', e); process.exit(1) })
