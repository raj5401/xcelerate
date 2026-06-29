require('dotenv').config()
const { pool } = require('./index')

async function migrate() {
  console.log('🔄 Running comprehensive LMS migrations...')
  try {
    await pool.query(`

      -- ════════════════════════════════════════════════════════════════
      -- USERS & AUTHENTICATION
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS users (
        id                SERIAL PRIMARY KEY,
        name              VARCHAR(100) NOT NULL,
        email             VARCHAR(150) UNIQUE NOT NULL,
        phone             VARCHAR(15),
        password          TEXT NOT NULL,
        role              VARCHAR(20) DEFAULT 'student', -- student | teacher | admin | parent
        subject           VARCHAR(50), -- Physics | Chemistry | Math | Biology (for teachers)
        class_level       VARCHAR(10), -- 11 | 12 (for teachers)
        bio               TEXT,
        avatar_url        VARCHAR(500),
        qualification     TEXT, -- For teachers
        experience_years  INTEGER DEFAULT 0,
        hourly_rate       NUMERIC(10,2), -- For future consulting
        status            VARCHAR(20) DEFAULT 'active', -- active | inactive | suspended
        is_verified       BOOLEAN DEFAULT false,
        phone_verified    BOOLEAN DEFAULT false,
        is_parent         BOOLEAN DEFAULT false,
        linked_student_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Parent linked to student
        created_at        TIMESTAMP DEFAULT NOW(),
        updated_at        TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
      CREATE INDEX idx_users_status ON users(status);

      -- ════════════════════════════════════════════════════════════════
      -- AUTHENTICATION & VERIFICATION
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS otps (
        id         SERIAL PRIMARY KEY,
        email      VARCHAR(150) NOT NULL,
        otp        VARCHAR(10)  NOT NULL,
        expires_at TIMESTAMP    NOT NULL,
        used       BOOLEAN      DEFAULT false,
        created_at TIMESTAMP    DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS email_verifications (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email         VARCHAR(150) NOT NULL,
        token         VARCHAR(255) UNIQUE NOT NULL,
        expires_at    TIMESTAMP NOT NULL,
        verified      BOOLEAN DEFAULT false,
        verified_at   TIMESTAMP,
        created_at    TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id        SERIAL PRIMARY KEY,
        user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token     VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- ════════════════════════════════════════════════════════════════
      -- COURSES & STRUCTURE
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS courses (
        id                SERIAL PRIMARY KEY,
        title             VARCHAR(200) NOT NULL,
        description       TEXT,
        subject           VARCHAR(50) NOT NULL, -- Physics | Chemistry | Math | Biology
        class_level       VARCHAR(10) NOT NULL, -- 11 | 12
        teacher_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
        price             NUMERIC(10,2) DEFAULT 0,
        discount_percent  NUMERIC(5,2) DEFAULT 0,
        thumbnail         VARCHAR(500),
        banner            VARCHAR(500),
        total_chapters    INTEGER DEFAULT 0,
        total_videos      INTEGER DEFAULT 0,
        total_duration    INTEGER DEFAULT 0, -- in minutes
        language          VARCHAR(50) DEFAULT 'English',
        difficulty_level  VARCHAR(20) DEFAULT 'intermediate', -- beginner | intermediate | advanced
        status            VARCHAR(20) DEFAULT 'draft', -- draft | published | archived
        rating_avg        NUMERIC(3,2) DEFAULT 0,
        rating_count      INTEGER DEFAULT 0,
        max_students      INTEGER DEFAULT 100,
        created_at        TIMESTAMP DEFAULT NOW(),
        updated_at        TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_courses_subject ON courses(subject);
      CREATE INDEX idx_courses_class_level ON courses(class_level);
      CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
      CREATE INDEX idx_courses_status ON courses(status);

      CREATE TABLE IF NOT EXISTS chapters (
        id          SERIAL PRIMARY KEY,
        course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        order_num   INTEGER DEFAULT 0,
        total_videos INTEGER DEFAULT 0,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_chapters_course_id ON chapters(course_id);

      CREATE TABLE IF NOT EXISTS videos (
        id              SERIAL PRIMARY KEY,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        chapter_id      INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
        teacher_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title           VARCHAR(200) NOT NULL,
        description     TEXT,
        s3_key          VARCHAR(500) NOT NULL, -- S3 path
        duration        INTEGER NOT NULL, -- in seconds
        thumbnail_url   VARCHAR(500),
        file_size_mb    NUMERIC(10,2),
        quality_options TEXT, -- JSON: {"720p": "s3://...", "1080p": "s3://..."}
        order_num       INTEGER DEFAULT 0,
        views           INTEGER DEFAULT 0,
        likes           INTEGER DEFAULT 0,
        status          VARCHAR(20) DEFAULT 'published',
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_videos_course_id ON videos(course_id);
      CREATE INDEX idx_videos_chapter_id ON videos(chapter_id);

      -- ════════════════════════════════════════════════════════════════
      -- BATCHES & LIVE CLASSES
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS batches (
        id              SERIAL PRIMARY KEY,
        name            VARCHAR(200) NOT NULL,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        teacher_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        description     TEXT,
        schedule_days   VARCHAR(50), -- JSON: ["Monday", "Wednesday", "Friday"]
        schedule_time   TIME,
        start_date      DATE,
        end_date        DATE,
        max_students    INTEGER DEFAULT 30,
        current_students INTEGER DEFAULT 0,
        status          VARCHAR(20) DEFAULT 'active',
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_batches_course_id ON batches(course_id);
      CREATE INDEX idx_batches_teacher_id ON batches(teacher_id);

      CREATE TABLE IF NOT EXISTS live_classes (
        id              SERIAL PRIMARY KEY,
        batch_id        INTEGER REFERENCES batches(id) ON DELETE CASCADE,
        teacher_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title           VARCHAR(200) NOT NULL,
        description     TEXT,
        scheduled_at    TIMESTAMP NOT NULL,
        duration        INTEGER, -- in minutes
        jitsi_room_id   VARCHAR(255) UNIQUE, -- Jitsi room name
        recording_url   VARCHAR(500),
        status          VARCHAR(20) DEFAULT 'scheduled', -- scheduled | in_progress | completed | cancelled
        started_at      TIMESTAMP,
        ended_at        TIMESTAMP,
        attendees       INTEGER DEFAULT 0,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_live_classes_batch_id ON live_classes(batch_id);
      CREATE INDEX idx_live_classes_scheduled_at ON live_classes(scheduled_at);

      CREATE TABLE IF NOT EXISTS live_class_attendance (
        id              SERIAL PRIMARY KEY,
        live_class_id   INTEGER REFERENCES live_classes(id) ON DELETE CASCADE,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at       TIMESTAMP DEFAULT NOW(),
        left_at         TIMESTAMP,
        duration        INTEGER DEFAULT 0, -- in minutes
        status          VARCHAR(20) DEFAULT 'attended', -- attended | absent | excused
        UNIQUE(live_class_id, user_id)
      );

      CREATE INDEX idx_live_class_attendance_user_id ON live_class_attendance(user_id);

      -- ════════════════════════════════════════════════════════════════
      -- ENROLLMENTS & PAYMENTS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS enrollments (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        batch_id        INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        payment_id      INTEGER REFERENCES payments(id) ON DELETE SET NULL,
        enrollment_type VARCHAR(20) DEFAULT 'paid', -- paid | free | scholarship
        status          VARCHAR(20) DEFAULT 'active', -- active | completed | dropped | suspended
        progress_percent NUMERIC(5,2) DEFAULT 0,
        enrolled_at     TIMESTAMP DEFAULT NOW(),
        completed_at    TIMESTAMP,
        dropped_at      TIMESTAMP,
        UNIQUE(user_id, course_id)
      );

      CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
      CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);

      CREATE TABLE IF NOT EXISTS payments (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        course_id       INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        student_name    VARCHAR(100),
        email           VARCHAR(150),
        phone           VARCHAR(15),
        course_title    VARCHAR(200),
        amount          NUMERIC(10,2),
        discount_amount NUMERIC(10,2) DEFAULT 0,
        final_amount    NUMERIC(10,2),
        status          VARCHAR(20) DEFAULT 'pending', -- pending | paid | failed | refunded
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature VARCHAR(255),
        payment_method  VARCHAR(50), -- card | upi | netbanking | wallet
        paid_at         TIMESTAMP,
        refund_amount   NUMERIC(10,2) DEFAULT 0,
        refund_reason   TEXT,
        refunded_at     TIMESTAMP,
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_payments_user_id ON payments(user_id);
      CREATE INDEX idx_payments_status ON payments(status);
      CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);

      -- ═════════════��══════════════════════════════════════════════════
      -- LEARNING PROGRESS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS video_progress (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        video_id        INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        watched_seconds INTEGER DEFAULT 0,
        watched_percent NUMERIC(5,2) DEFAULT 0,
        completed       BOOLEAN DEFAULT false,
        completed_at    TIMESTAMP,
        last_watched_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, video_id)
      );

      CREATE INDEX idx_video_progress_user_id ON video_progress(user_id);
      CREATE INDEX idx_video_progress_video_id ON video_progress(video_id);

      CREATE TABLE IF NOT EXISTS notes_personal (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        video_id        INTEGER REFERENCES videos(id) ON DELETE SET NULL,
        title           VARCHAR(200),
        content         TEXT,
        tags            VARCHAR(255), -- JSON: ["important", "review"]
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_notes_personal_user_id ON notes_personal(user_id);

      -- ════════════════════════════════════════════════════════════════
      -- TESTS & ASSESSMENTS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS tests (
        id                  SERIAL PRIMARY KEY,
        title               VARCHAR(200) NOT NULL,
        description         TEXT,
        course_id           INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        batch_id            INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        teacher_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
        subject             VARCHAR(50),
        class_level         VARCHAR(10),
        test_type           VARCHAR(30) DEFAULT 'quiz', -- quiz | chapter_test | mock_exam | final_exam
        duration            INTEGER NOT NULL, -- in minutes
        total_marks         INTEGER NOT NULL,
        passing_marks       INTEGER DEFAULT 0,
        scheduled_at        TIMESTAMP,
        show_answers        BOOLEAN DEFAULT false,
        show_answers_after  TIMESTAMP,
        status              VARCHAR(20) DEFAULT 'active',
        results_published   BOOLEAN DEFAULT false,
        published_at        TIMESTAMP,
        negative_marking    NUMERIC(4,2) DEFAULT 1,
        shuffle_questions   BOOLEAN DEFAULT true,
        shuffle_options     BOOLEAN DEFAULT true,
        allow_review        BOOLEAN DEFAULT true,
        attempts_allowed    INTEGER DEFAULT 1,
        created_at          TIMESTAMP DEFAULT NOW(),
        updated_at          TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_tests_course_id ON tests(course_id);
      CREATE INDEX idx_tests_batch_id ON tests(batch_id);
      CREATE INDEX idx_tests_scheduled_at ON tests(scheduled_at);

      CREATE TABLE IF NOT EXISTS questions (
        id              SERIAL PRIMARY KEY,
        test_id         INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        question_type   VARCHAR(30) DEFAULT 'mcq', -- mcq | multiselect | short_answer | long_answer | numerical
        text            TEXT NOT NULL,
        option_a        TEXT,
        option_b        TEXT,
        option_c        TEXT,
        option_d        TEXT,
        correct         CHAR(1), -- A | B | C | D
        marks           INTEGER DEFAULT 4,
        negative        NUMERIC(4,2) DEFAULT 1,
        explanation     TEXT,
        difficulty      VARCHAR(20) DEFAULT 'medium', -- easy | medium | hard
        order_num       INTEGER DEFAULT 0,
        image_url       VARCHAR(500),
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_questions_test_id ON questions(test_id);

      CREATE TABLE IF NOT EXISTS attempts (
        id              SERIAL PRIMARY KEY,
        test_id         INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        answers         JSONB DEFAULT '{}', -- {"question_id": "answer"}
        score           NUMERIC(8,2),
        obtained_marks  INTEGER,
        status          VARCHAR(20) DEFAULT 'in_progress', -- in_progress | submitted | evaluated
        started_at      TIMESTAMP DEFAULT NOW(),
        submitted_at    TIMESTAMP,
        duration_taken  INTEGER, -- in seconds
        correct_count   INTEGER DEFAULT 0,
        wrong_count     INTEGER DEFAULT 0,
        skipped_count   INTEGER DEFAULT 0,
        percentile      NUMERIC(5,2),
        rank            INTEGER,
        feedback        TEXT,
        UNIQUE(test_id, user_id)
      );

      CREATE INDEX idx_attempts_user_id ON attempts(user_id);
      CREATE INDEX idx_attempts_test_id ON attempts(test_id);
      CREATE INDEX idx_attempts_status ON attempts(status);

      -- ════════════════════════════════════════════════════════════════
      -- ASSIGNMENTS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS assignments (
        id              SERIAL PRIMARY KEY,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        chapter_id      INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
        teacher_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title           VARCHAR(200) NOT NULL,
        description     TEXT,
        instructions    TEXT,
        file_url        VARCHAR(500),
        due_date        TIMESTAMP NOT NULL,
        max_score       INTEGER DEFAULT 100,
        status          VARCHAR(20) DEFAULT 'active',
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_assignments_course_id ON assignments(course_id);
      CREATE INDEX idx_assignments_due_date ON assignments(due_date);

      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id              SERIAL PRIMARY KEY,
        assignment_id   INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        submission_text TEXT,
        file_url        VARCHAR(500),
        status          VARCHAR(20) DEFAULT 'submitted', -- submitted | graded | late_submitted
        submitted_at    TIMESTAMP DEFAULT NOW(),
        graded_at       TIMESTAMP,
        score           INTEGER,
        feedback        TEXT,
        teacher_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(assignment_id, user_id)
      );

      CREATE INDEX idx_assignment_submissions_user_id ON assignment_submissions(user_id);
      CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);

      -- ════════════════════════════════════════════════════════════════
      -- STUDY MATERIALS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS study_materials (
        id              SERIAL PRIMARY KEY,
        title           VARCHAR(200) NOT NULL,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        chapter_id      INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
        teacher_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
        material_type   VARCHAR(30), -- notes | book | question_bank | formula_sheet
        s3_key          VARCHAR(500) NOT NULL,
        file_size_mb    NUMERIC(10,2),
        downloads       INTEGER DEFAULT 0,
        description     TEXT,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_study_materials_course_id ON study_materials(course_id);

      -- ════════════════════════════════════════════════════════════════
      -- DOUBTS & QUESTIONS FORUM
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS doubts (
        id              SERIAL PRIMARY KEY,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        chapter_id      INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title           VARCHAR(200) NOT NULL,
        question        TEXT NOT NULL,
        image_url       VARCHAR(500),
        tags            VARCHAR(255), -- JSON: ["algebra", "difficult"]
        status          VARCHAR(20) DEFAULT 'open', -- open | answered | resolved
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_doubts_course_id ON doubts(course_id);
      CREATE INDEX idx_doubts_user_id ON doubts(user_id);
      CREATE INDEX idx_doubts_status ON doubts(status);

      CREATE TABLE IF NOT EXISTS doubt_replies (
        id              SERIAL PRIMARY KEY,
        doubt_id        INTEGER REFERENCES doubts(id) ON DELETE CASCADE,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reply_text      TEXT NOT NULL,
        image_url       VARCHAR(500),
        is_teacher_reply BOOLEAN DEFAULT false,
        helpful_count   INTEGER DEFAULT 0,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_doubt_replies_doubt_id ON doubt_replies(doubt_id);

      -- ════════════════════════════════════════════════════════════════
      -- REVIEWS & RATINGS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS reviews (
        id              SERIAL PRIMARY KEY,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text     TEXT,
        helpful_count   INTEGER DEFAULT 0,
        unhelpful_count INTEGER DEFAULT 0,
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW(),
        UNIQUE(course_id, user_id)
      );

      CREATE INDEX idx_reviews_course_id ON reviews(course_id);

      -- ════════════════════════════════════════════════════════════════
      -- MESSAGES & NOTIFICATIONS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS messages (
        id              SERIAL PRIMARY KEY,
        sender_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recipient_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject         VARCHAR(200),
        content         TEXT NOT NULL,
        is_read         BOOLEAN DEFAULT false,
        read_at         TIMESTAMP,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
      CREATE INDEX idx_messages_is_read ON messages(is_read);

      CREATE TABLE IF NOT EXISTS notifications (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title           VARCHAR(200) NOT NULL,
        message         TEXT,
        type            VARCHAR(50), -- enrollment | payment | test_scheduled | assignment_due | new_reply | class_reminder
        related_id      INTEGER, -- course_id, test_id, etc.
        is_read         BOOLEAN DEFAULT false,
        read_at         TIMESTAMP,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);

      -- ════════════════════════════════════════════════════════════════
      -- CERTIFICATES
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS certificates (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        certificate_url VARCHAR(500),
        certificate_code VARCHAR(100) UNIQUE,
        issued_at       TIMESTAMP DEFAULT NOW(),
        score           NUMERIC(5,2),
        completion_date TIMESTAMP
      );

      CREATE INDEX idx_certificates_user_id ON certificates(user_id);
      CREATE INDEX idx_certificates_course_id ON certificates(course_id);

      -- ════════════════════════════════════════════════════════════════
      -- ANALYTICS & REPORTS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS student_analytics (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        videos_watched  INTEGER DEFAULT 0,
        notes_downloaded INTEGER DEFAULT 0,
        tests_taken     INTEGER DEFAULT 0,
        assignments_submitted INTEGER DEFAULT 0,
        avg_test_score  NUMERIC(5,2) DEFAULT 0,
        total_study_hours NUMERIC(8,2) DEFAULT 0,
        last_accessed   TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_student_analytics_user_id ON student_analytics(user_id);
      CREATE INDEX idx_student_analytics_course_id ON student_analytics(course_id);

      -- ════════════════════════════════════════════════════════════════
      -- SYSTEM & LOGS
      -- ════════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS audit_logs (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action          VARCHAR(100) NOT NULL,
        resource_type   VARCHAR(50),
        resource_id     INTEGER,
        details         JSONB,
        ip_address      VARCHAR(50),
        user_agent      TEXT,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

    `)

    console.log('✅ All tables created successfully')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

migrate()
